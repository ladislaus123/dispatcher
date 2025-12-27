import { CreateCampaignRequest } from '../types/campaign';
import { WAHARequest } from '../types/waha';
import { WAHABuilder } from './waha-builder';
import { PersistenceManager } from './persistence-manager';

export interface StoredCampaign {
  campaignId: string;
  createdAt: Date;
  request: CreateCampaignRequest;
  wahaRequests: WAHARequest[];
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  totalMessages: number;
  totalContacts: number;
}

interface PersistedCampaigns {
  campaigns: Record<string, {
    campaignId: string;
    createdAt: string;
    request: CreateCampaignRequest;
    wahaRequests: WAHARequest[];
    status: 'pending' | 'in_progress' | 'completed' | 'failed';
    totalMessages: number;
    totalContacts: number;
  }>;
}

export class CampaignManager {
  private static campaigns: Map<string, StoredCampaign> = new Map();

  /**
   * Create a new campaign and build WAHA requests
   * Each contact is sent messages through its assigned session
   */
  static createCampaign(request: CreateCampaignRequest): StoredCampaign {
    const campaignId = `campaign_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Build all WAHA requests with per-contact sessions
    const wahaRequests = WAHABuilder.buildCampaignRequests(
      request.messages,
      request.contactSessions
    );

    const campaign: StoredCampaign = {
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
    const sessionsSet = new Set(request.contactSessions.map((cs: any) => cs.session));
    sessionsSet.forEach(session => console.log(`    - ${session}`));

    // Persist campaign
    PersistenceManager.debouncedSave('campaigns.json', () => this.serializeCampaigns());

    return campaign;
  }

  /**
   * Get campaign by ID
   */
  static getCampaign(campaignId: string): StoredCampaign | undefined {
    return this.campaigns.get(campaignId);
  }

  /**
   * Get all campaigns
   */
  static getAllCampaigns(): StoredCampaign[] {
    return Array.from(this.campaigns.values());
  }

  /**
   * Update campaign status
   */
  static updateStatus(
    campaignId: string,
    status: StoredCampaign['status']
  ): void {
    const campaign = this.campaigns.get(campaignId);
    if (campaign) {
      campaign.status = status;
      // Persist status update
      PersistenceManager.debouncedSave('campaigns.json', () => this.serializeCampaigns());
    }
  }

  /**
   * Get WAHA requests for a campaign
   */
  static getWAHARequests(campaignId: string): WAHARequest[] | undefined {
    const campaign = this.campaigns.get(campaignId);
    return campaign?.wahaRequests;
  }

  /**
   * Delete campaign
   */
  static deleteCampaign(campaignId: string): boolean {
    const deleted = this.campaigns.delete(campaignId);
    if (deleted) {
      // Persist deletion
      PersistenceManager.debouncedSave('campaigns.json', () => this.serializeCampaigns());
    }
    return deleted;
  }

  /**
   * Get campaign summary (without sensitive data)
   */
  static getCampaignSummary(campaignId: string) {
    const campaign = this.campaigns.get(campaignId);
    if (!campaign) return undefined;

    const sessionCount = new Set(campaign.request.contactSessions.map((cs: any) => cs.session)).size;

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
  static async load(): Promise<void> {
    try {
      const data = await PersistenceManager.loadData<PersistedCampaigns>('campaigns.json');
      if (!data || !data.campaigns) return;

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
    } catch (error) {
      console.error('[CampaignManager] Failed to load campaigns:', error);
    }
  }

  /**
   * Save campaigns to persistent storage
   */
  static async save(): Promise<void> {
    try {
      const data = this.serializeCampaigns();
      await PersistenceManager.saveData('campaigns.json', data);
    } catch (error) {
      console.error('[CampaignManager] Failed to save campaigns:', error);
    }
  }

  /**
   * Serialize campaigns for persistence
   */
  private static serializeCampaigns(): PersistedCampaigns {
    const campaigns: Record<string, any> = {};

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
