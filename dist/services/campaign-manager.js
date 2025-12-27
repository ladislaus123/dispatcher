"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CampaignManager = void 0;
const waha_builder_1 = require("./waha-builder");
const persistence_manager_1 = require("./persistence-manager");
class CampaignManager {
    /**
     * Create a new campaign and build WAHA requests
     * Each contact is sent messages through its assigned session
     */
    static createCampaign(request) {
        const campaignId = `campaign_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        // Build all WAHA requests with per-contact sessions
        const wahaRequests = waha_builder_1.WAHABuilder.buildCampaignRequests(request.messages, request.contactSessions);
        const campaign = {
            campaignId,
            createdAt: new Date(),
            request,
            wahaRequests,
            status: 'pending',
            totalMessages: request.messages.length,
            totalContacts: request.contactSessions.length,
        };
        this.campaigns.set(campaignId, campaign);
        console.log(`Campaign ${campaignId} created`);
        console.log(`  - Total requests to execute: ${wahaRequests.length}`);
        console.log(`  - Messages per contact: ${request.messages.length}`);
        console.log(`  - Contacts with sessions: ${request.contactSessions.length}`);
        console.log(`  - Sessions involved:`);
        const sessionsSet = new Set(request.contactSessions.map((cs) => cs.session));
        sessionsSet.forEach(session => console.log(`    - ${session}`));
        // Persist campaign
        persistence_manager_1.PersistenceManager.debouncedSave('campaigns.json', () => this.serializeCampaigns());
        return campaign;
    }
    /**
     * Get campaign by ID
     */
    static getCampaign(campaignId) {
        return this.campaigns.get(campaignId);
    }
    /**
     * Get all campaigns
     */
    static getAllCampaigns() {
        return Array.from(this.campaigns.values());
    }
    /**
     * Update campaign status
     */
    static updateStatus(campaignId, status) {
        const campaign = this.campaigns.get(campaignId);
        if (campaign) {
            campaign.status = status;
            // Persist status update
            persistence_manager_1.PersistenceManager.debouncedSave('campaigns.json', () => this.serializeCampaigns());
        }
    }
    /**
     * Get WAHA requests for a campaign
     */
    static getWAHARequests(campaignId) {
        const campaign = this.campaigns.get(campaignId);
        return campaign?.wahaRequests;
    }
    /**
     * Delete campaign
     */
    static deleteCampaign(campaignId) {
        const deleted = this.campaigns.delete(campaignId);
        if (deleted) {
            // Persist deletion
            persistence_manager_1.PersistenceManager.debouncedSave('campaigns.json', () => this.serializeCampaigns());
        }
        return deleted;
    }
    /**
     * Get campaign summary (without sensitive data)
     */
    static getCampaignSummary(campaignId) {
        const campaign = this.campaigns.get(campaignId);
        if (!campaign)
            return undefined;
        const sessionCount = new Set(campaign.request.contactSessions.map((cs) => cs.session)).size;
        return {
            campaignId: campaign.campaignId,
            createdAt: campaign.createdAt,
            status: campaign.status,
            totalMessages: campaign.totalMessages,
            totalContacts: campaign.totalContacts,
            totalRequests: campaign.wahaRequests.length,
            totalSessions: sessionCount,
        };
    }
    /**
     * Load campaigns from persistent storage
     */
    static async load() {
        try {
            const data = await persistence_manager_1.PersistenceManager.loadData('campaigns.json');
            if (!data || !data.campaigns)
                return;
            for (const [campaignId, campaign] of Object.entries(data.campaigns)) {
                this.campaigns.set(campaignId, {
                    campaignId: campaign.campaignId,
                    createdAt: new Date(campaign.createdAt),
                    request: campaign.request,
                    wahaRequests: campaign.wahaRequests,
                    status: campaign.status,
                    totalMessages: campaign.totalMessages,
                    totalContacts: campaign.totalContacts,
                });
            }
            console.log(`[CampaignManager] Loaded ${this.campaigns.size} campaigns from storage`);
        }
        catch (error) {
            console.error('[CampaignManager] Failed to load campaigns:', error);
        }
    }
    /**
     * Save campaigns to persistent storage
     */
    static async save() {
        try {
            const data = this.serializeCampaigns();
            await persistence_manager_1.PersistenceManager.saveData('campaigns.json', data);
        }
        catch (error) {
            console.error('[CampaignManager] Failed to save campaigns:', error);
        }
    }
    /**
     * Serialize campaigns for persistence
     */
    static serializeCampaigns() {
        const campaigns = {};
        for (const [id, campaign] of this.campaigns.entries()) {
            campaigns[id] = {
                campaignId: campaign.campaignId,
                createdAt: campaign.createdAt.toISOString(),
                request: campaign.request,
                wahaRequests: campaign.wahaRequests,
                status: campaign.status,
                totalMessages: campaign.totalMessages,
                totalContacts: campaign.totalContacts,
            };
        }
        return { campaigns };
    }
}
exports.CampaignManager = CampaignManager;
CampaignManager.campaigns = new Map();
//# sourceMappingURL=campaign-manager.js.map