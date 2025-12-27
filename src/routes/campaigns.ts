import { Router, Request, Response } from 'express';
import { validateRequest } from '../middleware/validation';
import {
  CreateCampaignSchema,
  CreateCampaignRequest,
  CampaignResponse,
} from '../types/campaign';
import { CampaignManager } from '../services/campaign-manager';
import { QueueManager } from '../services/queue-manager';
import { FileStorage } from '../services/file-storage';
import { ReportGenerator } from '../services/report-generator';

const router = Router();

// File upload endpoint
router.post('/upload', (req: Request, res: Response) => {
  try {
    const { base64, filename, backendUrl } = req.body;

    if (!base64 || !filename) {
      console.warn('Upload request missing base64 or filename');
      return res.status(400).json({
        success: false,
        message: 'base64 and filename are required',
      });
    }

    // Validate base64 is a string
    if (typeof base64 !== 'string') {
      console.warn('Upload request: base64 is not a string, type:', typeof base64);
      return res.status(400).json({
        success: false,
        message: 'base64 must be a string',
      });
    }

    const relativePath = FileStorage.saveBase64File(base64, filename);

    // Build absolute URL using the request's host
    const protocol = req.protocol || 'http';
    const host = req.get('host') || 'localhost:3000';
    const fileUrl = `${protocol}://${host}${relativePath}`;

    console.log(`File uploaded: ${filename} -> ${fileUrl}`);

    return res.status(200).json({
      success: true,
      fileUrl,
      message: 'File uploaded successfully',
    });
  } catch (error: any) {
    console.error('Error uploading file:', error.message || error);
    return res.status(500).json({
      success: false,
      message: 'Failed to upload file',
      errors: [error.message || 'Unknown error'],
    });
  }
});

router.post(
  '/create',
  validateRequest(CreateCampaignSchema),
  (req: Request<{}, {}, CreateCampaignRequest>, res: Response<CampaignResponse>) => {
    try {
      const campaign = CampaignManager.createCampaign(req.body);
      const sessionCount = new Set(req.body.contactSessions.map(cs => cs.session)).size;

      return res.status(201).json({
        success: true,
        campaignId: campaign.campaignId,
        message: `Campaign created successfully with ${campaign.wahaRequests.length} requests to execute across ${sessionCount} sessions`,
      });
    } catch (error: any) {
      console.error('Error creating campaign:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to create campaign',
        errors: [error.message],
      });
    }
  }
);

router.get('/:campaignId', (req: Request, res: Response) => {
  try {
    const { campaignId } = req.params;
    const campaign = CampaignManager.getCampaignSummary(campaignId);

    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: `Campaign with ID ${campaignId} not found`,
      });
    }

    return res.status(200).json({
      success: true,
      data: campaign,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve campaign',
      errors: [error.message],
    });
  }
});

router.get('/:campaignId/requests', (req: Request, res: Response) => {
  try {
    const { campaignId } = req.params;
    const requests = CampaignManager.getWAHARequests(campaignId);

    if (!requests) {
      return res.status(404).json({
        success: false,
        message: `Campaign with ID ${campaignId} not found`,
      });
    }

    return res.status(200).json({
      success: true,
      totalRequests: requests.length,
      data: requests,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve campaign requests',
      errors: [error.message],
    });
  }
});

router.get('/', (req: Request, res: Response) => {
  try {
    const campaigns = CampaignManager.getAllCampaigns();

    return res.status(200).json({
      success: true,
      totalCampaigns: campaigns.length,
      data: campaigns.map(c => CampaignManager.getCampaignSummary(c.campaignId)),
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve campaigns',
      errors: [error.message],
    });
  }
});

router.post('/:campaignId/execute', (req: Request, res: Response) => {
  try {
    const { campaignId } = req.params;
    const campaign = CampaignManager.getCampaign(campaignId);

    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: `Campaign with ID ${campaignId} not found`,
      });
    }

    const wahaRequests = campaign.wahaRequests;
    const contactSessions = campaign.request.contactSessions;
    const sessions = new Set<string>(contactSessions.map((cs: any) => cs.session));

    // Enqueue requests for each session
    sessions.forEach((session) => {
      const sessionRequests = wahaRequests.filter(req => (req.data as any).session === session);
      QueueManager.enqueueRequests(session, sessionRequests, campaignId);
    });

    // Update campaign status
    CampaignManager.updateStatus(campaignId, 'in_progress');

    const workerStatus = QueueManager.getAllWorkerStatus();

    return res.status(202).json({
      success: true,
      campaignId,
      message: `Campaign execution started across ${sessions.size} sessions`,
      workers: workerStatus,
    });
  } catch (error: any) {
    console.error('Error executing campaign:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to execute campaign',
      errors: [error.message],
    });
  }
});

router.post('/:campaignId/stop', (req: Request, res: Response) => {
  try {
    const { campaignId } = req.params;
    const campaign = CampaignManager.getCampaign(campaignId);

    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: `Campaign with ID ${campaignId} not found`,
      });
    }

    // Clear campaign from queue
    QueueManager.clearCampaign(campaignId);
    CampaignManager.updateStatus(campaignId, 'completed');

    return res.status(200).json({
      success: true,
      campaignId,
      message: `Campaign stopped`,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: 'Failed to stop campaign',
      errors: [error.message],
    });
  }
});

router.get('/queue/status', (req: Request, res: Response) => {
  try {
    const stats = QueueManager.getStats();
    const workers = QueueManager.getAllWorkerStatus();

    return res.status(200).json({
      success: true,
      stats,
      workers,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: 'Failed to get queue status',
      errors: [error.message],
    });
  }
});

router.post('/queue/stop-all', (req: Request, res: Response) => {
  try {
    const workers = QueueManager.getAllWorkerStatus() || [];

    workers.forEach(worker => {
      if (worker) {
        QueueManager.stopWorker(worker.session);
      }
    });

    return res.status(200).json({
      success: true,
      message: 'All workers stopped',
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: 'Failed to stop all workers',
      errors: [error.message],
    });
  }
});

router.delete('/:campaignId', (req: Request, res: Response) => {
  try {
    const { campaignId } = req.params;
    const campaign = CampaignManager.getCampaign(campaignId);

    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: `Campaign with ID ${campaignId} not found`,
      });
    }

    // Get all sessions for this campaign
    const sessions = new Set(campaign.request.contactSessions.map((cs: any) => cs.session));

    // Stop workers and clear campaign requests from queues
    for (const session of sessions) {
      const worker = QueueManager.getWorkerStatus(session);
      if (worker) {
        QueueManager.stopWorker(session);
      }
      QueueManager.clearCampaign(campaignId);
    }

    // Delete campaign
    const deleted = CampaignManager.deleteCampaign(campaignId);

    if (!deleted) {
      return res.status(500).json({
        success: false,
        message: 'Failed to delete campaign',
      });
    }

    console.log(`Campaign ${campaignId} deleted`);

    return res.status(200).json({
      success: true,
      message: 'Campaign deleted successfully',
      campaignId,
      requestsCleared: campaign.wahaRequests.length,
    });
  } catch (error: any) {
    console.error('Error deleting campaign:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete campaign',
      errors: [error.message],
    });
  }
});

router.get('/:campaignId/export', async (req: Request, res: Response) => {
  try {
    const { campaignId } = req.params;
    const campaign = CampaignManager.getCampaign(campaignId);

    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: `Campaign with ID ${campaignId} not found`,
      });
    }

    console.log(`Generating PDF report for campaign ${campaignId}`);

    // Generate PDF
    const pdfBuffer = await ReportGenerator.generatePDFReport(campaign);

    // Set headers for file download
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const filename = `campaign_export_${campaignId}_${timestamp}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', pdfBuffer.length);

    return res.send(pdfBuffer);
  } catch (error: any) {
    console.error('Error exporting campaign:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to export campaign',
      errors: [error.message],
    });
  }
});

export default router;
