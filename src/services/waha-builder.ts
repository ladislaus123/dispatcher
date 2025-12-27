import { Message, MessageVariation } from '../types/campaign';
import {
  WAHAMessagePayload,
  WAHARequest,
  WAHATextMessagePayload,
  WAHAImageMessagePayload,
  WAHAAudioMessagePayload,
  WAHAVideoMessagePayload,
} from '../types/waha';

const WAHA_BASE_URL = process.env.WAHA_BASE_URL || 'http://147.93.0.70:3000';
const WAHA_API_KEY = process.env.WAHA_API_KEY || '482a9764aea842dc97622a687ceb70ee';

export class WAHABuilder {
  /**
   * Randomly select a variation from the available variations
   */
  private static selectRandomVariation(variations: MessageVariation[]): MessageVariation {
    return variations[Math.floor(Math.random() * variations.length)];
  }

  /**
   * Build a WAHA API payload from a message variation
   */
  static buildPayload(
    variation: MessageVariation,
    session: string,
    chatId: string
  ): WAHAMessagePayload {
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

  private static buildTextPayload(
    variation: Extract<MessageVariation, { type: 'text' }>,
    session: string,
    chatId: string
  ): WAHATextMessagePayload {
    return {
      session,
      chatId,
      text: variation.content,
    };
  }

  private static buildImagePayload(
    variation: Extract<MessageVariation, { type: 'photo' }>,
    session: string,
    chatId: string
  ): WAHAImageMessagePayload {
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

  private static buildAudioPayload(
    variation: Extract<MessageVariation, { type: 'audio' }>,
    session: string,
    chatId: string
  ): WAHAAudioMessagePayload {
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

  private static buildVideoPayload(
    variation: Extract<MessageVariation, { type: 'video' }>,
    session: string,
    chatId: string
  ): WAHAVideoMessagePayload {
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
  static buildRequest(
    payload: WAHAMessagePayload,
    endpoint: string = '/api/sendText'
  ): WAHARequest {
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
  static buildCampaignRequests(
    messages: Message[],
    contactSessions: Array<{ contact: string; session: string }>
  ): WAHARequest[] {
    const requests: WAHARequest[] = [];

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
