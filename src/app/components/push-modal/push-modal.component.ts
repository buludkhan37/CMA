import { Component, inject, input, OnInit, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ClientService } from '../../services/client.service';
import { Client, PushNotification } from '../../interfaces/client.interface';

@Component({
    selector: 'app-push-modal',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule],
    templateUrl: './push-modal.component.html',
    styleUrl: './push-modal.component.scss',
})
export class PushModalComponent implements OnInit {
    selectedClients = input<Client[]>([]);
    close = output<void>();
    pushSent = output<void>();

    pushForm!: FormGroup;
    isLoading = signal(false);
    errorMessage = signal('');
    successMessage = signal('');
    #fb = inject(FormBuilder);
    #clientService = inject(ClientService);

    ngOnInit() {
        this.initializeForm();
    }

    private initializeForm() {
        this.pushForm = this.#fb.group({
            title: ['', [Validators.required, Validators.maxLength(100)]],
            message: ['', [Validators.required, Validators.maxLength(500)]],
        });
    }

    onSubmit() {
        if (this.pushForm.valid) {
            this.isLoading.set(true);
            this.errorMessage.set('');
            this.successMessage.set('');

            const pushData: PushNotification = {
                title: this.pushForm.value.title,
                message: this.pushForm.value.message,
                client_ids: this.selectedClients().map(client => client.id!),
            };

            this.#clientService.sendPushNotification(pushData).subscribe({
                next: response => {
                    this.isLoading.set(false);
                    if (response.success) {
                        const isOfflineMode =
                            response.message && response.message.includes('offline mode');
                        if (isOfflineMode) {
                            this.successMessage.set(
                                `Push-уведомление отправлено в демо-режиме для ${response.sent_count || this.selectedClients.length} клиентов`,
                            );
                        } else {
                            this.successMessage.set(
                                `Push-уведомление успешно отправлено ${response.sent_count || this.selectedClients.length} клиентам`,
                            );
                        }
                        setTimeout(() => {
                            this.pushSent.emit();
                        }, 1500);
                    } else {
                        this.errorMessage.set(
                            response.message || 'Ошибка при отправке push-уведомления',
                        );
                    }
                },
                error: error => {
                    this.isLoading.set(false);
                    this.errorMessage.set(error.error?.message || 'Ошибка подключения к серверу');
                },
            });
        } else {
            this.markFormGroupTouched();
        }
    }

    private markFormGroupTouched() {
        Object.keys(this.pushForm.controls).forEach(key => {
            const control = this.pushForm.get(key);
            control?.markAsTouched();
        });
    }

    onClose() {
        if (!this.isLoading()) {
            this.close.emit();
        }
    }

    onOverlayClick(event: Event) {
        if (event.target === event.currentTarget) {
            this.onClose();
        }
    }

    getFieldError(fieldName: string): string {
        const field = this.pushForm.get(fieldName);
        if (field?.errors && field?.touched) {
            if (field.errors['required']) {
                return 'Поле обязательно для заполнения';
            }
            if (field.errors['maxlength']) {
                const maxLength = field.errors['maxlength'].requiredLength;
                return `Максимальная длина ${maxLength} символов`;
            }
        }
        return '';
    }

    isFieldInvalid(fieldName: string): boolean {
        const field = this.pushForm.get(fieldName);
        return !!(field?.invalid && field?.touched);
    }

    getSelectedClientsNames(): string {
        return this.selectedClients()
            .map(client => client.name)
            .join(', ');
    }

    getRemainingChars(fieldName: string, maxLength: number): number {
        const field = this.pushForm.get(fieldName);
        const currentLength = field?.value?.length || 0;
        return maxLength - currentLength;
    }
}
