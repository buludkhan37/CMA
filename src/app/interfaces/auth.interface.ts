export interface LoginRequest {
    login: string;
    password: string;
}

export interface LoginResponse {
    token: string;
    success?: boolean;
    message?: string;
}

export interface User {
    id?: string;
    login: string;
    token?: string;
}
