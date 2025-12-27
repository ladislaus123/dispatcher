export interface WAHAFilePayload {
    mimetype: string;
    url: string;
    filename?: string;
}
export interface WAHATextMessagePayload {
    session: string;
    chatId: string;
    text: string;
}
export interface WAHAImageMessagePayload {
    session: string;
    chatId: string;
    file: WAHAFilePayload;
    caption?: string;
}
export interface WAHAAudioMessagePayload {
    session: string;
    chatId: string;
    file: WAHAFilePayload;
    convert: boolean;
}
export interface WAHAVideoMessagePayload {
    session: string;
    chatId: string;
    caption?: string;
    asNote: boolean;
    file: WAHAFilePayload;
    convert: boolean;
}
export type WAHAMessagePayload = WAHATextMessagePayload | WAHAImageMessagePayload | WAHAAudioMessagePayload | WAHAVideoMessagePayload;
export interface WAHARequest {
    method: 'POST';
    url: string;
    headers: {
        'accept': string;
        'Content-Type': string;
        'X-Api-Key': string;
    };
    data: WAHAMessagePayload;
}
//# sourceMappingURL=waha.d.ts.map