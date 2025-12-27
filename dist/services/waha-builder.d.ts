import { Message, MessageVariation } from '../types/campaign';
import { WAHAMessagePayload, WAHARequest } from '../types/waha';
export declare class WAHABuilder {
    /**
     * Randomly select a variation from the available variations
     */
    private static selectRandomVariation;
    /**
     * Build a WAHA API payload from a message variation
     */
    static buildPayload(variation: MessageVariation, session: string, chatId: string): WAHAMessagePayload;
    private static buildTextPayload;
    private static buildImagePayload;
    private static buildAudioPayload;
    private static buildVideoPayload;
    /**
     * Build a complete WAHA API request with headers
     */
    static buildRequest(payload: WAHAMessagePayload, endpoint?: string): WAHARequest;
    /**
     * Build all WAHA requests for a campaign
     * Each contact receives a randomly selected variation of each message
     */
    static buildCampaignRequests(messages: Message[], contactSessions: Array<{
        contact: string;
        session: string;
    }>): WAHARequest[];
}
//# sourceMappingURL=waha-builder.d.ts.map