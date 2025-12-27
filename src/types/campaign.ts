import { z } from 'zod';

export const MessageVariationSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('text'),
    content: z.string().min(1, 'Text content cannot be empty'),
  }),
  z.object({
    type: z.literal('audio'),
    content: z.string().min(1, 'Audio URL/path cannot be empty'),
  }),
  z.object({
    type: z.literal('photo'),
    content: z.string().min(1, 'Photo URL/path cannot be empty'),
    caption: z.string().optional(),
    filename: z.string().optional(),
  }),
  z.object({
    type: z.literal('video'),
    content: z.string().min(1, 'Video URL/path cannot be empty'),
    caption: z.string().optional(),
    filename: z.string().optional(),
    asNote: z.boolean().optional().default(false),
  }),
]);

export type MessageVariation = z.infer<typeof MessageVariationSchema>;

// Message with variations - each message can have multiple variations
export const MessageSchema = z.object({
  variations: z
    .array(MessageVariationSchema)
    .min(1, 'At least one variation is required for each message'),
});

export type Message = z.infer<typeof MessageSchema>;

// Campaign with contacts distributed across multiple sessions
export const CreateCampaignSchema = z.object({
  messages: z
    .array(MessageSchema)
    .min(1, 'At least one message is required'),
  contactSessions: z
    .array(
      z.object({
        contact: z.string().min(1, 'Contact cannot be empty'),
        session: z.string().min(1, 'Session string is required'),
      })
    )
    .min(1, 'At least one contact-session pair is required'),
});

export type CreateCampaignRequest = z.infer<typeof CreateCampaignSchema>;

export interface CampaignResponse {
  success: boolean;
  campaignId?: string;
  message: string;
  errors?: string[];
}
