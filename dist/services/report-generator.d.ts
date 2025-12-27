import { StoredCampaign } from './campaign-manager';
export declare class ReportGenerator {
    /**
     * Generate a PDF report for a campaign
     */
    static generatePDFReport(campaign: StoredCampaign): Promise<Buffer>;
    /**
     * Add header section to PDF
     */
    private static addHeader;
    /**
     * Add summary statistics section
     */
    private static addSummaryStats;
    /**
     * Add contact delivery table
     */
    private static addDeliveryTable;
    /**
     * Add error details section
     */
    private static addErrorDetails;
    /**
     * Add footer to PDF
     */
    private static addFooter;
    /**
     * Build delivery matrix: contact × message → status
     */
    private static buildDeliveryMatrix;
    /**
     * Get execution statistics from campaign
     */
    private static getExecutionData;
    /**
     * Get failed requests with error details
     */
    private static getFailedRequests;
    /**
     * Get status emoji
     */
    private static getStatusEmoji;
    /**
     * Get status color
     */
    private static getStatusColor;
}
//# sourceMappingURL=report-generator.d.ts.map