import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { ClientService } from '../../services/client.service';
import { Client } from '../../interfaces/client.interface';
import { PushModalComponent } from '../push-modal/push-modal.component';

@Component({
    selector: 'app-client-list',
    standalone: true,
    imports: [CommonModule, FormsModule, PushModalComponent],
    templateUrl: './client-list.component.html',
    styleUrl: './client-list.component.scss',
})
export class ClientListComponent implements OnInit {
    clients = signal<Client[]>([]);
    filteredClients = signal<Client[]>([]);
    selectedClients = signal<Client[]>([]);

    isLoading = signal(false);
    searchTerm = signal('');
    sortColumn = signal('');
    sortDirection = signal<'asc' | 'desc'>('asc');
    showPushModal = signal(false);
    errorMessage = signal('');
    isOfflineMode = signal(false);
    #clientService = inject(ClientService);
    #router = inject(Router);

    columns = [
        { key: 'name', label: 'Имя', sortable: true },
        { key: 'email', label: 'Email', sortable: true },
        { key: 'phone', label: 'Телефон', sortable: false },
        { key: 'company', label: 'Компания', sortable: true },
        { key: 'status', label: 'Статус', sortable: true },
        { key: 'created_at', label: 'Дата создания', sortable: true },
    ];

    ngOnInit() {
        this.loadClients();

        this.#router.events
            .pipe(filter(event => event instanceof NavigationEnd))
            .subscribe((event: NavigationEnd) => {
                if (
                    event.url === '/dashboard/clients' &&
                    event.urlAfterRedirects === '/dashboard/clients'
                ) {
                    console.log('Detected navigation back to client list, refreshing data...');
                    this.loadClients();
                }
            });
    }

    loadClients() {
        this.isLoading.set(true);
        this.errorMessage.set('');
        console.log('Loading clients...');

        this.#clientService
            .getClients(1, this.searchTerm(), this.sortColumn(), this.sortDirection())
            .subscribe({
                next: (response: any) => {
                    this.clients.set(response.data || response.clients || []);
                    console.log('Loaded clients:', this.clients.length, 'total clients');
                    this.applyFilters();
                    this.isLoading.set(false);

                    if (this.clients.length > 0) {
                        this.isOfflineMode.set(true);
                    }
                },
                error: (error: any) => {
                    console.error('Error loading clients:', error);
                    this.errorMessage.set(
                        'Подключение к серверу недоступно. Показаны демонстрационные данные.',
                    );
                    this.isOfflineMode.set(true);
                    this.isLoading.set(false);

                    if (this.clients.length === 0) {
                        this.clients.set(this.getFallbackClients());
                        this.applyFilters();
                    }
                },
            });
    }

    refreshClients() {
        console.log('Manual refresh requested');
        this.loadClients();
    }

    onSearch() {
        this.applyFilters();
    }

    applyFilters() {
        let filtered = [...this.clients()];

        if (this.searchTerm().trim()) {
            const searchLower = this.searchTerm().toLowerCase();
            filtered = filtered.filter(
                client =>
                    client.name.toLowerCase().includes(searchLower) ||
                    (client.email && client.email.toLowerCase().includes(searchLower)) ||
                    (client.company && client.company.toLowerCase().includes(searchLower)) ||
                    (client.phone && client.phone.includes(searchLower)),
            );
        }

        this.filteredClients.set(filtered);
    }

    sortBy(column: string) {
        if (!this.isColumnSortable(column)) return;

        if (this.sortColumn() === column) {
            this.sortDirection.set(this.sortDirection() === 'asc' ? 'desc' : 'asc');
        } else {
            this.sortColumn.set(column);
            this.sortDirection.set('asc');
        }

        this.filteredClients().sort((a, b) => {
            const aValue = this.getColumnValue(a, column);
            const bValue = this.getColumnValue(b, column);

            let comparison = 0;
            if (aValue > bValue) {
                comparison = 1;
            } else if (aValue < bValue) {
                comparison = -1;
            }

            return this.sortDirection() === 'asc' ? comparison : -comparison;
        });
    }

    private getColumnValue(client: Client, column: string): any {
        switch (column) {
            case 'name':
                return client.name || '';
            case 'email':
                return client.email || '';
            case 'company':
                return client.company || '';
            case 'status':
                return client.status || '';
            case 'created_at':
                return new Date(client.created_at || 0);
            default:
                return '';
        }
    }

    isColumnSortable(columnKey: string): boolean {
        const column = this.columns.find(col => col.key === columnKey);
        return column ? column.sortable : false;
    }

    getSortIcon(columnKey: string): string {
        if (!this.isColumnSortable(columnKey) || this.sortColumn() !== columnKey) {
            return '';
        }
        return this.sortDirection() === 'asc' ? '↑' : '↓';
    }

    toggleClientSelection(client: Client) {
        const index = this.selectedClients().findIndex(c => c.id === client.id);
        if (index > -1) {
            this.selectedClients().splice(index, 1);
        } else {
            this.selectedClients().push(client);
        }
    }

    isClientSelected(client: Client): boolean {
        return this.selectedClients().some(c => c.id === client.id);
    }

    selectAllClients() {
        if (this.selectedClients().length === this.filteredClients().length) {
            this.selectedClients.set([]);
        } else {
            this.selectedClients.set([...this.filteredClients()]);
        }
    }

    isAllSelected(): boolean {
        return (
            this.filteredClients().length > 0 &&
            this.selectedClients().length === this.filteredClients().length
        );
    }

    isIndeterminate(): boolean {
        return (
            this.selectedClients().length > 0 &&
            this.selectedClients().length < this.filteredClients().length
        );
    }

    openPushModal() {
        if (this.selectedClients().length === 0) {
            alert('Выберите клиентов для отправки push-уведомления');
            return;
        }
        this.showPushModal.set(true);
    }

    closePushModal() {
        this.showPushModal.set(false);
    }

    onPushSent() {
        this.selectedClients.set([]);
        this.closePushModal();
    }

    formatDate(dateString: string | undefined): string {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('ru-RU');
    }

    getStatusClass(status: string | undefined): string {
        switch (status) {
            case 'active':
                return 'status-active';
            case 'inactive':
                return 'status-inactive';
            case 'pending':
                return 'status-pending';
            default:
                return 'status-default';
        }
    }

    getStatusLabel(status: string | undefined): string {
        switch (status) {
            case 'active':
                return 'Активен';
            case 'inactive':
                return 'Неактивен';
            case 'pending':
                return 'В ожидании';
            default:
                return status || '-';
        }
    }

    trackByClientId(index: number, client: Client): any {
        return client.id;
    }

    private getFallbackClients(): Client[] {
        return [
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
    }
}
