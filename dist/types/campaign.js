"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateCampaignSchema = exports.MessageSchema = exports.MessageVariationSchema = void 0;
const zod_1 = require("zod");
exports.MessageVariationSchema = zod_1.z.discriminatedUnion('type', [
    zod_1.z.object({
        type: zod_1.z.literal('text'),
        content: zod_1.z.string().min(1, 'Text content cannot be empty'),
    }),
    zod_1.z.object({
        type: zod_1.z.literal('audio'),
        content: zod_1.z.string().min(1, 'Audio URL/path cannot be empty'),
    }),
    zod_1.z.object({
        type: zod_1.z.literal('photo'),
        content: zod_1.z.string().min(1, 'Photo URL/path cannot be empty'),
        caption: zod_1.z.string().optional(),
        filename: zod_1.z.string().optional(),
    }),
    zod_1.z.object({
        type: zod_1.z.literal('video'),
        content: zod_1.z.string().min(1, 'Video URL/path cannot be empty'),
        caption: zod_1.z.string().optional(),
        filename: zod_1.z.string().optional(),
        asNote: zod_1.z.boolean().optional().default(false),
    }),
]);
// Message with variations - each message can have multiple variations
exports.MessageSchema = zod_1.z.object({
    variations: zod_1.z
        .array(exports.MessageVariationSchema)
        .min(1, 'At least one variation is required for each message'),
});
// Campaign with contacts distributed across multiple sessions
exports.CreateCampaignSchema = zod_1.z.object({
    messages: zod_1.z
        .array(exports.MessageSchema)
        .min(1, 'At least one message is required'),
    contactSessions: zod_1.z
        .array(zod_1.z.object({
        contact: zod_1.z.string().min(1, 'Contact cannot be empty'),
        session: zod_1.z.string().min(1, 'Session string is required'),
    }))
        .min(1, 'At least one contact-session pair is required'),
});
//# sourceMappingURL=campaign.js.map