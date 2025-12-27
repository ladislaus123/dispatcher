"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const validation_1 = require("../middleware/validation");
const campaign_1 = require("../types/campaign");
const campaign_manager_1 = require("../services/campaign-manager");
const queue_manager_1 = require("../services/queue-manager");
const file_storage_1 = require("../services/file-storage");
const report_generator_1 = require("../services/report-generator");
const router = (0, express_1.Router)();
// File upload endpoint
router.post('/upload', (req, res) => {
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
        const relativePath = file_storage_1.FileStorage.saveBase64File(base64, filename);
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
    }
    catch (error) {
        console.error('Error uploading file:', error.message || error);
        return res.status(500).json({
            success: false,
            message: 'Failed to upload file',
            errors: [error.message || 'Unknown error'],
        });
    }
});
router.post('/create', (0, validation_1.validateRequest)(campaign_1.CreateCampaignSchema), (req, res) => {
    try {
        const campaign = campaign_manager_1.CampaignManager.createCampaign(req.body);
        const sessionCount = new Set(req.body.contactSessions.map(cs => cs.session)).size;
        return res.status(201).json({
            success: true,
            campaignId: campaign.campaignId,
            message: `Campaign created successfully with ${campaign.wahaRequests.length} requests to execute across ${sessionCount} sessions`,
        });
    }
    catch (error) {
        console.error('Error creating campaign:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to create campaign',
            errors: [error.message],
        });
    }
});
router.get('/:campaignId', (req, res) => {
    try {
        const { campaignId } = req.params;
        const campaign = campaign_manager_1.CampaignManager.getCampaignSummary(campaignId);
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
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Failed to retrieve campaign',
            errors: [error.message],
        });
    }
});
router.get('/:campaignId/requests', (req, res) => {
    try {
        const { campaignId } = req.params;
        const requests = campaign_manager_1.CampaignManager.getWAHARequests(campaignId);
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
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Failed to retrieve campaign requests',
            errors: [error.message],
        });
    }
});
router.get('/', (req, res) => {
    try {
        const campaigns = campaign_manager_1.CampaignManager.getAllCampaigns();
        return res.status(200).json({
            success: true,
            totalCampaigns: campaigns.length,
            data: campaigns.map(c => campaign_manager_1.CampaignManager.getCampaignSummary(c.campaignId)),
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Failed to retrieve campaigns',
            errors: [error.message],
        });
    }
});
router.post('/:campaignId/execute', (req, res) => {
    try {
        const { campaignId } = req.params;
        const campaign = campaign_manager_1.CampaignManager.getCampaign(campaignId);
        if (!campaign) {
            return res.status(404).json({
                success: false,
                message: `Campaign with ID ${campaignId} not found`,
            });
        }
        const wahaRequests = campaign.wahaRequests;
        const contactSessions = campaign.request.contactSessions;
        const sessions = new Set(contactSessions.map((cs) => cs.session));
        // Enqueue requests for each session
        sessions.forEach((session) => {
            const sessionRequests = wahaRequests.filter(req => req.data.session === session);
            queue_manager_1.QueueManager.enqueueRequests(session, sessionRequests, campaignId);
        });
        // Update campaign status
        campaign_manager_1.CampaignManager.updateStatus(campaignId, 'in_progress');
        const workerStatus = queue_manager_1.QueueManager.getAllWorkerStatus();
        return res.status(202).json({
            success: true,
            campaignId,
            message: `Campaign execution started across ${sessions.size} sessions`,
            workers: workerStatus,
        });
    }
    catch (error) {
        console.error('Error executing campaign:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to execute campaign',
            errors: [error.message],
        });
    }
});
router.post('/:campaignId/stop', (req, res) => {
    try {
        const { campaignId } = req.params;
        const campaign = campaign_manager_1.CampaignManager.getCampaign(campaignId);
        if (!campaign) {
            return res.status(404).json({
                success: false,
                message: `Campaign with ID ${campaignId} not found`,
            });
        }
        // Clear campaign from queue
        queue_manager_1.QueueManager.clearCampaign(campaignId);
        campaign_manager_1.CampaignManager.updateStatus(campaignId, 'completed');
        return res.status(200).json({
            success: true,
            campaignId,
            message: `Campaign stopped`,
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Failed to stop campaign',
            errors: [error.message],
        });
    }
});
router.get('/queue/status', (req, res) => {
    try {
        const stats = queue_manager_1.QueueManager.getStats();
        const workers = queue_manager_1.QueueManager.getAllWorkerStatus();
        return res.status(200).json({
            success: true,
            stats,
            workers,
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Failed to get queue status',
            errors: [error.message],
        });
    }
});
router.post('/queue/stop-all', (req, res) => {
    try {
        const workers = queue_manager_1.QueueManager.getAllWorkerStatus() || [];
        workers.forEach(worker => {
            if (worker) {
                queue_manager_1.QueueManager.stopWorker(worker.session);
            }
        });
        return res.status(200).json({
            success: true,
            message: 'All workers stopped',
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Failed to stop all workers',
            errors: [error.message],
        });
    }
});
router.delete('/:campaignId', (req, res) => {
    try {
        const { campaignId } = req.params;
        const campaign = campaign_manager_1.CampaignManager.getCampaign(campaignId);
        if (!campaign) {
            return res.status(404).json({
                success: false,
                message: `Campaign with ID ${campaignId} not found`,
            });
        }
        // Get all sessions for this campaign
        const sessions = new Set(campaign.request.contactSessions.map((cs) => cs.session));
        // Stop workers and clear campaign requests from queues
        for (const session of sessions) {
            const worker = queue_manager_1.QueueManager.getWorkerStatus(session);
            if (worker) {
                queue_manager_1.QueueManager.stopWorker(session);
            }
            queue_manager_1.QueueManager.clearCampaign(campaignId);
        }
        // Delete campaign
        const deleted = campaign_manager_1.CampaignManager.deleteCampaign(campaignId);
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
    }
    catch (error) {
        console.error('Error deleting campaign:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to delete campaign',
            errors: [error.message],
        });
    }
});
router.get('/:campaignId/export', async (req, res) => {
    try {
        const { campaignId } = req.params;
        const campaign = campaign_manager_1.CampaignManager.getCampaign(campaignId);
        if (!campaign) {
            return res.status(404).json({
                success: false,
                message: `Campaign with ID ${campaignId} not found`,
            });
        }
        console.log(`Generating PDF report for campaign ${campaignId}`);
        // Generate PDF
        const pdfBuffer = await report_generator_1.ReportGenerator.generatePDFReport(campaign);
        // Set headers for file download
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
        const filename = `campaign_export_${campaignId}_${timestamp}.pdf`;
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.setHeader('Content-Length', pdfBuffer.length);
        return res.send(pdfBuffer);
    }
    catch (error) {
        console.error('Error exporting campaign:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to export campaign',
            errors: [error.message],
        });
    }
});
exports.default = router;
//# sourceMappingURL=campaigns.js.map