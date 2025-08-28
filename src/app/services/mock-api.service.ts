import { Injectable, signal } from '@angular/core';
import { Observable, of, delay } from 'rxjs';
import { LoginRequest, LoginResponse } from '../interfaces/auth.interface';
import {
    Client,
    ClientListResponse,
    PushNotificationResponse,
    PushNotification,
} from '../interfaces/client.interface';

@Injectable({
    providedIn: 'root',
})
export class MockApiService {
    private createdClients = signal<Client[]>([]);

    mockLogin(credentials: LoginRequest): Observable<LoginResponse> {
        const response: LoginResponse = {
            token: `mock-token-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            success: true,
            message: 'Mock authentication successful',
        };

        return of(response).pipe(delay(500));
    }

    mockGetClients(): Observable<ClientListResponse> {
        const staticMockClients: Client[] = [
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

        const allClients = [...staticMockClients, ...this.createdClients()];

        const response: ClientListResponse = {
            data: allClients,
            success: true,
            total: allClients.length,
            page: 1,
            per_page: 10,
        };

        return of(response).pipe(delay(300));
    }

    mockSendPush(pushData: PushNotification): Observable<PushNotificationResponse> {
        const response: PushNotificationResponse = {
            success: true,
            message: 'Push notification sent successfully (mock)',
            sent_count: pushData.client_ids.length,
        };

        return of(response).pipe(delay(400));
    }

    mockCreateClient(clientData: any): Observable<Client> {
        const newId = Date.now() + Math.floor(Math.random() * 1000);

        const newClient: Client = {
            id: newId,
            name: clientData.name,
            email: clientData.email || '',
            phone: clientData.phone || '',
            company: clientData.company || '',
            status: clientData.status || 'active',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        };

        this.createdClients().push(newClient);
        console.log('Mock client created and stored:', newClient);
        console.log('Total created clients in memory:', this.createdClients.length);

        return of(newClient).pipe(delay(300));
    }
}
