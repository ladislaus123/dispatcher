import PDFDocument from 'pdfkit';
import { StoredCampaign } from './campaign-manager';
import { QueueManager } from './queue-manager';

type PDFDocType = InstanceType<typeof PDFDocument>;

interface DeliveryStatus {
  contact: string;
  session: string;
  messages: Array<{
    messageIndex: number;
    status: 'pending' | 'executing' | 'completed' | 'failed';
    error?: string;
    executedAt?: string;
  }>;
  totalFailed: number;
  totalCompleted: number;
  totalPending: number;
}

export class ReportGenerator {
  /**
   * Generate a PDF report for a campaign
   */
  static generatePDFReport(campaign: StoredCampaign): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          size: 'A4',
          margin: 40,
          bufferPages: true,
        });

        const chunks: Buffer[] = [];
        doc.on('data', (chunk: Buffer) => chunks.push(chunk));
        doc.on('end', () => {
          resolve(Buffer.concat(chunks));
        });

        // Generate report sections
        this.addHeader(doc, campaign);
        this.addSummaryStats(doc, campaign);
        this.addDeliveryTable(doc, campaign);
        this.addErrorDetails(doc, campaign);
        this.addFooter(doc);

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Add header section to PDF
   */
  private static addHeader(doc: PDFDocType, campaign: StoredCampaign): void {
    // Title
    doc
      .fontSize(24)
      .font('Helvetica-Bold')
      .text('Campaign Report', { underline: true });

    doc.fontSize(11).font('Helvetica').moveDown(0.5);

    // Campaign info
    const createdDate = new Date(campaign.createdAt).toLocaleString();
    const statusColor = this.getStatusColor(campaign.status);

    doc
      .fontSize(11)
      .text(`Campaign ID: ${campaign.campaignId}`, { continued: true })
      .text(` | Status: `, { continued: true })
      .fillColor(statusColor)
      .text(campaign.status.toUpperCase())
      .fillColor('black');

    doc.fontSize(10).text(`Created: ${createdDate}`);
    doc.text(`Total Contacts: ${campaign.totalContacts}`);
    doc.text(`Total Messages: ${campaign.totalMessages}`);
    doc.text(`Total Requests: ${campaign.totalMessages * campaign.totalContacts}`);

    doc.moveDown();
    doc.moveTo(40, doc.y).lineTo(555, doc.y).stroke();
    doc.moveDown();
  }

  /**
   * Add summary statistics section
   */
  private static addSummaryStats(doc: PDFDocType, campaign: StoredCampaign): void {
    // Get execution data
    const executionData = this.getExecutionData(campaign);

    doc.fontSize(14).font('Helvetica-Bold').text('Summary Statistics');
    doc.fontSize(10).font('Helvetica').moveDown(0.3);

    const stats = [
      { label: 'Total Requests', value: executionData.totalRequests.toString() },
      { label: 'Completed', value: executionData.completed.toString() },
      { label: 'Failed', value: executionData.failed.toString() },
      { label: 'Pending', value: executionData.pending.toString() },
      {
        label: 'Success Rate',
        value: `${(
          (executionData.completed / Math.max(executionData.totalRequests, 1)) *
          100
        ).toFixed(1)}%`,
      },
    ];

    stats.forEach(stat => {
      doc
        .font('Helvetica-Bold')
        .text(stat.label, { width: 150, continued: true })
        .font('Helvetica')
        .text(stat.value);
    });

    doc.moveDown();
    doc.moveTo(40, doc.y).lineTo(555, doc.y).stroke();
    doc.moveDown();
  }

  /**
   * Add contact delivery table
   */
  private static addDeliveryTable(doc: PDFDocType, campaign: StoredCampaign): void {
    const deliveryData = this.buildDeliveryMatrix(campaign);

    if (deliveryData.length === 0) {
      doc.fontSize(10).text('No delivery data available');
      return;
    }

    doc.fontSize(14).font('Helvetica-Bold').text('Contact Delivery Status');
    doc.fontSize(9).font('Helvetica').moveDown(0.3);

    // Simple list format for delivery status
    deliveryData.forEach(delivery => {
      const contactStatus = `${delivery.contact} (${delivery.session})`;
      doc.font('Helvetica-Bold').text(contactStatus);

      doc.fontSize(8).font('Helvetica');

      // Show message statuses
      let messageList = '  Messages: ';
      for (let i = 0; i < delivery.messages.length; i++) {
        const msg = delivery.messages[i];
        const statusEmoji = this.getStatusEmoji(msg.status);
        messageList += `${statusEmoji}M${i + 1} `;
      }
      doc.text(messageList);

      // Show summary
      const summary = `  Summary: ✓${delivery.totalCompleted} ✗${delivery.totalFailed} ⏳${delivery.totalPending}`;
      doc.text(summary);
      doc.fontSize(9).moveDown(0.2);
    });

    doc.moveDown();
  }

  /**
   * Add error details section
   */
  private static addErrorDetails(doc: PDFDocType, campaign: StoredCampaign): void {
    const executionData = this.getExecutionData(campaign);

    if (executionData.failed === 0) {
      return; // No errors to report
    }

    doc.addPage();
    doc.fontSize(14).font('Helvetica-Bold').text('Failed Deliveries');
    doc.fontSize(10).font('Helvetica').moveDown(0.3);

    const errors = this.getFailedRequests(campaign);

    if (errors.length === 0) {
      doc.text('No error details available');
      return;
    }

    errors.forEach((error, index) => {
      doc.fontSize(10).font('Helvetica-Bold').text(`Error ${index + 1}`);
      doc.fontSize(9).font('Helvetica');
      doc.text(`Contact: ${error.contact}`, { indent: 10 });
      doc.text(`Message: Message ${error.messageIndex + 1}`, { indent: 10 });
      doc.text(`Error: ${error.error}`, { indent: 10, width: 475 });
      doc.text(`Time: ${error.executedAt}`, { indent: 10 });
      doc.moveDown(0.5);
    });
  }

  /**
   * Add footer to PDF
   */
  private static addFooter(doc: PDFDocType): void {
    const pages = doc.bufferedPageRange();

    for (let i = 0; i < pages.count; i++) {
      doc.switchToPage(i);
      doc
        .fontSize(8)
        .font('Helvetica')
        .text(
          `Page ${i + 1} of ${pages.count}`,
          40,
          doc.page.height - 30,
          { align: 'center' }
        );
      doc.text(
        `Generated: ${new Date().toLocaleString()}`,
        40,
        doc.page.height - 20,
        { align: 'center' }
      );
    }
  }

  /**
   * Build delivery matrix: contact × message → status
   */
  private static buildDeliveryMatrix(campaign: StoredCampaign): DeliveryStatus[] {
    const deliveryMap = new Map<string, DeliveryStatus>();

    // Initialize delivery status for each contact
    for (const cs of campaign.request.contactSessions) {
      const key = `${cs.contact}:${cs.session}`;
      if (!deliveryMap.has(key)) {
        deliveryMap.set(key, {
          contact: cs.contact,
          session: cs.session,
          messages: Array(campaign.totalMessages)
            .fill(null)
            .map(() => ({
              messageIndex: 0,
              status: 'pending' as const,
            })),
          totalFailed: 0,
          totalCompleted: 0,
          totalPending: campaign.totalMessages,
        });
      }
    }

    // Fill in execution data from queues
    const allQueues = QueueManager.getAllQueues();

    for (const queueData of Object.values(allQueues)) {
      if (!queueData.requests) continue;

      for (const request of queueData.requests) {
        // Find matching delivery entry
        const chatId = (request.request.data as any).chatId;
        const cleanContact = chatId.replace('@c.us', '');

        for (const [key, delivery] of deliveryMap.entries()) {
          if (delivery.contact === cleanContact && request.campaignId === campaign.campaignId) {
            // Find which message this is
            let messageIndex = 0;
            for (let i = 0; i < campaign.totalMessages; i++) {
              if (
                campaign.wahaRequests.findIndex(
                  wr =>
                    (wr.data as any).session === delivery.session &&
                    (wr.data as any).chatId === chatId &&
                    campaign.wahaRequests.indexOf(wr) % campaign.totalMessages === i
                ) >= 0
              ) {
                messageIndex = i;
                break;
              }
            }

            // Update delivery status
            if (messageIndex < delivery.messages.length) {
              delivery.messages[messageIndex] = {
                messageIndex,
                status: request.status,
                error: request.error,
                executedAt: request.executedAt?.toISOString(),
              };

              // Update totals
              if (request.status === 'completed') {
                delivery.totalCompleted++;
                delivery.totalPending--;
              } else if (request.status === 'failed') {
                delivery.totalFailed++;
                delivery.totalPending--;
              }
            }
          }
        }
      }
    }

    return Array.from(deliveryMap.values());
  }

  /**
   * Get execution statistics from campaign
   */
  private static getExecutionData(campaign: StoredCampaign): {
    totalRequests: number;
    completed: number;
    failed: number;
    pending: number;
  } {
    let completed = 0;
    let failed = 0;
    let pending = 0;

    const allQueues = QueueManager.getAllQueues();

    for (const queueData of Object.values(allQueues)) {
      if (!queueData.requests) continue;

      for (const request of queueData.requests) {
        if (request.campaignId === campaign.campaignId) {
          if (request.status === 'completed') completed++;
          else if (request.status === 'failed') failed++;
          else pending++;
        }
      }
    }

    const totalRequests = campaign.totalMessages * campaign.totalContacts;

    return { totalRequests, completed, failed, pending };
  }

  /**
   * Get failed requests with error details
   */
  private static getFailedRequests(
    campaign: StoredCampaign
  ): Array<{ contact: string; messageIndex: number; error: string; executedAt: string }> {
    const failures: Array<{ contact: string; messageIndex: number; error: string; executedAt: string }> = [];

    const allQueues = QueueManager.getAllQueues();

    for (const queueData of Object.values(allQueues)) {
      if (!queueData.requests) continue;

      for (const request of queueData.requests) {
        if (request.campaignId === campaign.campaignId && request.status === 'failed') {
          const chatId = (request.request.data as any).chatId;
          const cleanContact = chatId.replace('@c.us', '');

          // Estimate message index (simplified)
          const messageIndex = 0; // Would need more complex logic to determine exact message

          failures.push({
            contact: cleanContact,
            messageIndex,
            error: request.error || 'Unknown error',
            executedAt: request.executedAt?.toISOString() || 'Unknown',
          });
        }
      }
    }

    return failures;
  }

  /**
   * Get status emoji
   */
  private static getStatusEmoji(status: string): string {
    switch (status) {
      case 'completed':
        return '✅';
      case 'failed':
        return '❌';
      case 'executing':
        return '⏳';
      default:
        return '⏸️';
    }
  }

  /**
   * Get status color
   */
  private static getStatusColor(status: string): string {
    switch (status) {
      case 'completed':
        return '#10b981';
      case 'in_progress':
        return '#3b82f6';
      case 'failed':
        return '#ef4444';
      default:
        return '#6b7280';
    }
  }
}
