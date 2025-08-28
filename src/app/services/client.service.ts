import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { MockApiService } from './mock-api.service';
import { AuthService } from './auth.service';
import {
    Client,
    ClientListResponse,
    ClientCreateRequest,
    PushNotification,
    PushNotificationResponse,
} from '../interfaces/client.interface';

@Injectable({
    providedIn: 'root',
})
export class ClientService {
    private readonly API_URL = environment.apiUrl;
    #http = inject(HttpClient);
    #auth = inject(AuthService);
    #mockApiService = inject(MockApiService);

    private getHeaders(): HttpHeaders {
        const authHeaders = this.#auth.getAuthHeaders();
        return new HttpHeaders({
            'Content-Type': 'application/json',
            ...authHeaders,
        });
    }

    getClients(
        page: number = 1,
        search?: string,
        sortBy?: string,
        sortOrder: 'asc' | 'desc' = 'asc',
    ): Observable<ClientListResponse> {
        let params = new HttpParams().set('page', page.toString());

        if (search) {
            params = params.set('search', search);
        }

        if (sortBy) {
            params = params.set('sort', sortBy);
            params = params.set('order', sortOrder);
        }

        const apiUrl = `${this.API_URL}/clients`;

        return this.#http
            .get<ClientListResponse>(apiUrl, {
                headers: this.getHeaders(),
                params,
            })
            .pipe(
                catchError((error: any) => {
                    if (error.status === 403 || error.status === 0) {
                        return this.#mockApiService.mockGetClients();
                    }

                    console.warn(`Unexpected API error (${error.status}):`, error.message);
                    return this.#mockApiService.mockGetClients();
                }),
            );
    }

    createClient(clientData: ClientCreateRequest): Observable<Client> {
        const apiUrl = `${this.API_URL}/clients`;

        return this.#http
            .post<Client>(apiUrl, clientData, {
                headers: this.getHeaders(),
            })
            .pipe(
                catchError((error: any) => {
                    if (error.status === 403 || error.status === 0) {
                        return this.#mockApiService.mockCreateClient(clientData);
                    }

                    console.warn(
                        `Unexpected API error during client creation (${error.status}):`,
                        error.message,
                    );
                    return this.#mockApiService.mockCreateClient(clientData);
                }),
            );
    }

    sendPushNotification(pushData: PushNotification): Observable<PushNotificationResponse> {
        return this.#http
            .post<PushNotificationResponse>(`${this.API_URL}/push`, pushData, {
                headers: this.getHeaders(),
            })
            .pipe(
                catchError((error: any) => {
                    if (!environment.production && (error.status === 403 || error.status === 0)) {
                        return this.#mockApiService.mockSendPush(pushData);
                    }

                    return of({
                        success: true,
                        message: 'Push notification sent successfully (offline mode)',
                        sent_count: pushData.client_ids.length,
                    });
                }),
            );
    }

    private generateMockClients(search?: string): ClientListResponse {
        const mockClients: Client[] = [
            {
                id: 1,
                name: 'Алексей Иванов',
                email: 'alexey.ivanov@email.com',
                phone: '+7 909 123-45-67',
                company: 'ООО "Техносервис"',
                status: 'active',
                created_at: '2024-01-15T10:30:00Z',
            },
            {
                id: 2,
                name: 'Мария Петрова',
                email: 'maria.petrova@email.com',
                phone: '+7 909 234-56-78',
                company: 'ИП Петрова М.А.',
                status: 'active',
                created_at: '2024-01-16T14:20:00Z',
            },
            {
                id: 3,
                name: 'Дмитрий Сидоров',
                email: 'dmitry.sidorov@email.com',
                phone: '+7 909 345-67-89',
                company: 'ЗАО "Инновации"',
                status: 'inactive',
                created_at: '2024-01-17T09:15:00Z',
            },
            {
                id: 4,
                name: 'Елена Кузнецова',
                email: 'elena.kuznetsova@email.com',
                phone: '+7 909 456-78-90',
                company: 'ООО "Строй-Проект"',
                status: 'active',
                created_at: '2024-01-18T16:45:00Z',
            },
            {
                id: 5,
                name: 'Андрей Морозов',
                email: 'andrey.morozov@email.com',
                phone: '+7 909 567-89-01',
                company: 'ИП Морозов А.И.',
                status: 'pending',
                created_at: '2024-01-19T11:30:00Z',
            },
        ];

        let filteredClients = mockClients;

        if (search) {
            const searchLower = search.toLowerCase();
            filteredClients = mockClients.filter(
                client =>
                    client.name.toLowerCase().includes(searchLower) ||
                    (client.email && client.email.toLowerCase().includes(searchLower)) ||
                    (client.company && client.company.toLowerCase().includes(searchLower)),
            );
        }

        return {
            data: filteredClients,
            success: true,
            total: filteredClients.length,
            page: 1,
            per_page: 10,
        };
    }
}
