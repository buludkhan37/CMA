export interface Client {
    id?: string | number;
    name: string;
    email?: string;
    phone?: string;
    company?: string;
    status?: string;
    created_at?: string;
    updated_at?: string;
}

export interface ClientListResponse {
    clients?: Client[];
    data?: Client[];
    success?: boolean;
    message?: string;
    total?: number;
    page?: number;
    per_page?: number;
}

export interface ClientCreateRequest {
    name: string;
    email?: string;
    phone?: string;
    company?: string;
    status?: string;
}

export interface PushNotification {
    title: string;
    message: string;
    client_ids: (string | number)[];
}

export interface PushNotificationResponse {
    success: boolean;
    message: string;
    sent_count?: number;
}
