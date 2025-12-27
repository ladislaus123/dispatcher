"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WAHABuilder = void 0;
const WAHA_BASE_URL = process.env.WAHA_BASE_URL || 'http://147.93.0.70:3000';
const WAHA_API_KEY = process.env.WAHA_API_KEY || '482a9764aea842dc97622a687ceb70ee';
class WAHABuilder {
    /**
     * Randomly select a variation from the available variations
     */
    static selectRandomVariation(variations) {
        return variations[Math.floor(Math.random() * variations.length)];
    }
    /**
     * Build a WAHA API payload from a message variation
     */
    static buildPayload(variation, session, chatId) {
        switch (variation.type) {
            case 'text':
                return WAHABuilder.buildTextPayload(variation, session, chatId);
            case 'photo':
                return WAHABuilder.buildImagePayload(variation, session, chatId);
            case 'audio':
                return WAHABuilder.buildAudioPayload(variation, session, chatId);
            case 'video':
                return WAHABuilder.buildVideoPayload(variation, session, chatId);
            default:
                throw new Error(`Unsupported message type`);
        }
    }
    static buildTextPayload(variation, session, chatId) {
        return {
            session,
            chatId,
            text: variation.content,
        };
    }
    static buildImagePayload(variation, session, chatId) {
        return {
            session,
            chatId,
            file: {
                mimetype: 'image/jpeg',
                url: variation.content,
                filename: variation.filename || 'image.jpg',
            },
            caption: variation.caption,
        };
    }
    static buildAudioPayload(variation, session, chatId) {
        return {
            session,
            chatId,
            file: {
                mimetype: 'audio/ogg; codecs=opus',
                url: variation.content,
            },
            convert: false,
        };
    }
    static buildVideoPayload(variation, session, chatId) {
        return {
            session,
            chatId,
            caption: variation.caption,
            asNote: variation.asNote || false,
            file: {
                mimetype: 'video/mp4',
                url: variation.content,
                filename: variation.filename || 'video.mp4',
            },
            convert: false,
        };
    }
    /**
     * Build a complete WAHA API request with headers
     */
    static buildRequest(payload, endpoint = '/api/sendText') {
        return {
            method: 'POST',
            url: `${WAHA_BASE_URL}${endpoint}`,
            headers: {
                'accept': 'application/json',
                'Content-Type': 'application/json',
                'X-Api-Key': WAHA_API_KEY,
            },
            data: payload,
        };
    }
    /**
     * Build all WAHA requests for a campaign
     * Each contact receives a randomly selected variation of each message
     */
    static buildCampaignRequests(messages, contactSessions) {
        const requests = [];
        for (const { contact, session } of contactSessions) {
            // Ensure chatId has @c.us suffix
            const chatId = contact.includes('@') ? contact : `${contact}@c.us`;
            for (const message of messages) {
                // Randomly select one variation from the available variations
                const selectedVariation = this.selectRandomVariation(message.variations);
                const payload = WAHABuilder.buildPayload(selectedVariation, session, chatId);
                const request = WAHABuilder.buildRequest(payload);
                requests.push(request);
            }
        }
        return requests;
    }
}
exports.WAHABuilder = WAHABuilder;
//# sourceMappingURL=waha-builder.js.map