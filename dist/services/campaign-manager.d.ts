import { CreateCampaignRequest } from '../types/campaign';
import { WAHARequest } from '../types/waha';
export interface StoredCampaign {
    campaignId: string;
    createdAt: Date;
    request: CreateCampaignRequest;
    wahaRequests: WAHARequest[];
    status: 'pending' | 'in_progress' | 'completed' | 'failed';
    totalMessages: number;
    totalContacts: number;
}
export declare class CampaignManager {
    private static campaigns;
    /**
     * Create a new campaign and build WAHA requests
     * Each contact is sent messages through its assigned session
     */
    static createCampaign(request: CreateCampaignRequest): StoredCampaign;
    /**
     * Get campaign by ID
     */
    static getCampaign(campaignId: string): StoredCampaign | undefined;
    /**
     * Get all campaigns
     */
    static getAllCampaigns(): StoredCampaign[];
    /**
     * Update campaign status
     */
    static updateStatus(campaignId: string, status: StoredCampaign['status']): void;
    /**
     * Get WAHA requests for a campaign
     */
    static getWAHARequests(campaignId: string): WAHARequest[] | undefined;
    /**
     * Delete campaign
     */
    static deleteCampaign(campaignId: string): boolean;
    /**
     * Get campaign summary (without sensitive data)
     */
    static getCampaignSummary(campaignId: string): {
        campaignId: string;
        createdAt: Date;
        status: "pending" | "in_progress" | "completed" | "failed";
        totalMessages: number;
        totalContacts: number;
        totalRequests: number;
        totalSessions: number;
    } | undefined;
    /**
     * Load campaigns from persistent storage
     */
    static load(): Promise<void>;
    /**
     * Save campaigns to persistent storage
     */
    static save(): Promise<void>;
    /**
     * Serialize campaigns for persistence
     */
    private static serializeCampaigns;
}
//# sourceMappingURL=campaign-manager.d.ts.map