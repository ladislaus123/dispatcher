import { z } from 'zod';
export declare const MessageVariationSchema: z.ZodDiscriminatedUnion<"type", [z.ZodObject<{
    type: z.ZodLiteral<"text">;
    content: z.ZodString;
}, "strip", z.ZodTypeAny, {
    type: "text";
    content: string;
}, {
    type: "text";
    content: string;
}>, z.ZodObject<{
    type: z.ZodLiteral<"audio">;
    content: z.ZodString;
}, "strip", z.ZodTypeAny, {
    type: "audio";
    content: string;
}, {
    type: "audio";
    content: string;
}>, z.ZodObject<{
    type: z.ZodLiteral<"photo">;
    content: z.ZodString;
    caption: z.ZodOptional<z.ZodString>;
    filename: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    type: "photo";
    content: string;
    caption?: string | undefined;
    filename?: string | undefined;
}, {
    type: "photo";
    content: string;
    caption?: string | undefined;
    filename?: string | undefined;
}>, z.ZodObject<{
    type: z.ZodLiteral<"video">;
    content: z.ZodString;
    caption: z.ZodOptional<z.ZodString>;
    filename: z.ZodOptional<z.ZodString>;
    asNote: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
}, "strip", z.ZodTypeAny, {
    type: "video";
    content: string;
    asNote: boolean;
    caption?: string | undefined;
    filename?: string | undefined;
}, {
    type: "video";
    content: string;
    caption?: string | undefined;
    filename?: string | undefined;
    asNote?: boolean | undefined;
}>]>;
export type MessageVariation = z.infer<typeof MessageVariationSchema>;
export declare const MessageSchema: z.ZodObject<{
    variations: z.ZodArray<z.ZodDiscriminatedUnion<"type", [z.ZodObject<{
        type: z.ZodLiteral<"text">;
        content: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        type: "text";
        content: string;
    }, {
        type: "text";
        content: string;
    }>, z.ZodObject<{
        type: z.ZodLiteral<"audio">;
        content: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        type: "audio";
        content: string;
    }, {
        type: "audio";
        content: string;
    }>, z.ZodObject<{
        type: z.ZodLiteral<"photo">;
        content: z.ZodString;
        caption: z.ZodOptional<z.ZodString>;
        filename: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        type: "photo";
        content: string;
        caption?: string | undefined;
        filename?: string | undefined;
    }, {
        type: "photo";
        content: string;
        caption?: string | undefined;
        filename?: string | undefined;
    }>, z.ZodObject<{
        type: z.ZodLiteral<"video">;
        content: z.ZodString;
        caption: z.ZodOptional<z.ZodString>;
        filename: z.ZodOptional<z.ZodString>;
        asNote: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    }, "strip", z.ZodTypeAny, {
        type: "video";
        content: string;
        asNote: boolean;
        caption?: string | undefined;
        filename?: string | undefined;
    }, {
        type: "video";
        content: string;
        caption?: string | undefined;
        filename?: string | undefined;
        asNote?: boolean | undefined;
    }>]>, "many">;
}, "strip", z.ZodTypeAny, {
    variations: ({
        type: "text";
        content: string;
    } | {
        type: "audio";
        content: string;
    } | {
        type: "photo";
        content: string;
        caption?: string | undefined;
        filename?: string | undefined;
    } | {
        type: "video";
        content: string;
        asNote: boolean;
        caption?: string | undefined;
        filename?: string | undefined;
    })[];
}, {
    variations: ({
        type: "text";
        content: string;
    } | {
        type: "audio";
        content: string;
    } | {
        type: "photo";
        content: string;
        caption?: string | undefined;
        filename?: string | undefined;
    } | {
        type: "video";
        content: string;
        caption?: string | undefined;
        filename?: string | undefined;
        asNote?: boolean | undefined;
    })[];
}>;
export type Message = z.infer<typeof MessageSchema>;
export declare const CreateCampaignSchema: z.ZodObject<{
    messages: z.ZodArray<z.ZodObject<{
        variations: z.ZodArray<z.ZodDiscriminatedUnion<"type", [z.ZodObject<{
            type: z.ZodLiteral<"text">;
            content: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            type: "text";
            content: string;
        }, {
            type: "text";
            content: string;
        }>, z.ZodObject<{
            type: z.ZodLiteral<"audio">;
            content: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            type: "audio";
            content: string;
        }, {
            type: "audio";
            content: string;
        }>, z.ZodObject<{
            type: z.ZodLiteral<"photo">;
            content: z.ZodString;
            caption: z.ZodOptional<z.ZodString>;
            filename: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            type: "photo";
            content: string;
            caption?: string | undefined;
            filename?: string | undefined;
        }, {
            type: "photo";
            content: string;
            caption?: string | undefined;
            filename?: string | undefined;
        }>, z.ZodObject<{
            type: z.ZodLiteral<"video">;
            content: z.ZodString;
            caption: z.ZodOptional<z.ZodString>;
            filename: z.ZodOptional<z.ZodString>;
            asNote: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
        }, "strip", z.ZodTypeAny, {
            type: "video";
            content: string;
            asNote: boolean;
            caption?: string | undefined;
            filename?: string | undefined;
        }, {
            type: "video";
            content: string;
            caption?: string | undefined;
            filename?: string | undefined;
            asNote?: boolean | undefined;
        }>]>, "many">;
    }, "strip", z.ZodTypeAny, {
        variations: ({
            type: "text";
            content: string;
        } | {
            type: "audio";
            content: string;
        } | {
            type: "photo";
            content: string;
            caption?: string | undefined;
            filename?: string | undefined;
        } | {
            type: "video";
            content: string;
            asNote: boolean;
            caption?: string | undefined;
            filename?: string | undefined;
        })[];
    }, {
        variations: ({
            type: "text";
            content: string;
        } | {
            type: "audio";
            content: string;
        } | {
            type: "photo";
            content: string;
            caption?: string | undefined;
            filename?: string | undefined;
        } | {
            type: "video";
            content: string;
            caption?: string | undefined;
            filename?: string | undefined;
            asNote?: boolean | undefined;
        })[];
    }>, "many">;
    contactSessions: z.ZodArray<z.ZodObject<{
        contact: z.ZodString;
        session: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        contact: string;
        session: string;
    }, {
        contact: string;
        session: string;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    messages: {
        variations: ({
            type: "text";
            content: string;
        } | {
            type: "audio";
            content: string;
        } | {
            type: "photo";
            content: string;
            caption?: string | undefined;
            filename?: string | undefined;
        } | {
            type: "video";
            content: string;
            asNote: boolean;
            caption?: string | undefined;
            filename?: string | undefined;
        })[];
    }[];
    contactSessions: {
        contact: string;
        session: string;
    }[];
}, {
    messages: {
        variations: ({
            type: "text";
            content: string;
        } | {
            type: "audio";
            content: string;
        } | {
            type: "photo";
            content: string;
            caption?: string | undefined;
            filename?: string | undefined;
        } | {
            type: "video";
            content: string;
            caption?: string | undefined;
            filename?: string | undefined;
            asNote?: boolean | undefined;
        })[];
    }[];
    contactSessions: {
        contact: string;
        session: string;
    }[];
}>;
export type CreateCampaignRequest = z.infer<typeof CreateCampaignSchema>;
export interface CampaignResponse {
    success: boolean;
    campaignId?: string;
    message: string;
    errors?: string[];
}
//# sourceMappingURL=campaign.d.ts.map