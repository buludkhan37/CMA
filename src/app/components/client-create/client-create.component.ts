import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
    FormBuilder,
    FormGroup,
    Validators,
    ReactiveFormsModule,
    AbstractControl,
    ValidationErrors,
} from '@angular/forms';
import { Router } from '@angular/router';
import { ClientService } from '../../services/client.service';
import { ClientCreateRequest } from '../../interfaces/client.interface';
import { CustomInputComponent } from '../shared/custom-input/custom-input.component';
import {
    CustomSelectComponent,
    SelectOption,
} from '../shared/custom-select/custom-select.component';

@Component({
    selector: 'app-client-create',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, CustomInputComponent, CustomSelectComponent],
    templateUrl: './client-create.component.html',
    styleUrl: './client-create.component.scss',
})
export class ClientCreateComponent implements OnInit {
    clientForm!: FormGroup;
    isLoading = signal(false);
    errorMessage = signal('');
    successMessage = signal('');
    #fb = inject(FormBuilder);
    #clientService = inject(ClientService);
    #router = inject(Router);

    statusOptions: SelectOption[] = [
        { value: 'active', label: 'Активен' },
        { value: 'inactive', label: 'Неактивен' },
        { value: 'pending', label: 'В ожидании' },
    ];

    ngOnInit() {
        this.initializeForm();
    }

    private phoneValidator(control: AbstractControl): ValidationErrors | null {
        if (!control.value) {
            return null;
        }

        const phoneValue = control.value.toString().trim();

        const cleanPhone = phoneValue.replace(/[^+\d]/g, '');

        if (cleanPhone.replace(/\+/g, '').length < 7) {
            return { phoneInvalid: true };
        }

        const phonePatterns = [
            /^\+7[0-9]{10}$/,
            /^8[0-9]{10}$/,
            /^7[0-9]{10}$/,
            /^\+7\s?\(?[0-9]{3}\)?[\s-]?[0-9]{3}[\s-]?[0-9]{2}[\s-]?[0-9]{2}$/,
        ];

        const isPhone = phonePatterns.some(pattern => pattern.test(phoneValue));

        const isPhoneClean = phonePatterns.some(pattern => pattern.test(cleanPhone));

        if (isPhone || isPhoneClean) {
            return null;
        }

        return { phoneInvalid: true };
    }

    private initializeForm() {
        this.clientForm = this.#fb.group({
            name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
            email: ['', [Validators.email, Validators.maxLength(150)]],
            phone: ['', [Validators.maxLength(20), this.phoneValidator.bind(this)]],
            company: ['', [Validators.maxLength(200)]],
            status: ['active', [Validators.required]],
            template: ['Тестовый', [Validators.required]],
        });

        console.log('Form initialized with status:', this.clientForm.get('status')?.value);
        console.log('Available status options:', this.statusOptions);
    }

    onSubmit() {
        if (this.clientForm.valid) {
            this.isLoading.set(true);
            this.errorMessage.set('');
            this.successMessage.set('');

            const formValue = this.clientForm.value;
            const clientData: ClientCreateRequest = {
                name: formValue.name.trim(),
                email: formValue.email && formValue.email.trim() ? formValue.email.trim() : '',
                phone: formValue.phone && formValue.phone.trim() ? formValue.phone.trim() : '',
                company:
                    formValue.company && formValue.company.trim() ? formValue.company.trim() : '',
                status: formValue.status || 'active',
            };

            const cleanClientData = Object.fromEntries(
                Object.entries(clientData).filter(([key, value]) => {
                    if (key === 'name' || key === 'status' || key === 'template') return true;
                    return value !== '';
                }),
            ) as ClientCreateRequest;

            console.log('Creating client with data:', cleanClientData);

            this.#clientService.createClient(cleanClientData).subscribe({
                next: (response: any) => {
                    console.log('Client created successfully:', response);
                    this.isLoading.set(false);
                    this.successMessage.set(
                        `Клиент "${cleanClientData.name}" успешно создан! Перенаправление...`,
                    );

                    setTimeout(() => {
                        this.clientForm.reset({
                            status: 'active',
                            template: 'Тестовый',
                        });
                        this.successMessage.set('');

                        console.log('Navigating back to client list...');
                        this.#router.navigate(['/dashboard/clients']).then(
                            success =>
                                console.log('Navigation to client list successful:', success),
                            error => console.error('Navigation to client list failed:', error),
                        );
                    }, 2000);
                },
                error: (error: any) => {
                    console.error('Error creating client:', error);
                    this.isLoading.set(false);
                    this.errorMessage =
                        error.error?.message || 'Ошибка при создании клиента. Попробуйте еще раз.';
                },
            });
        } else {
            this.markFormGroupTouched();
        }
    }

    private markFormGroupTouched() {
        Object.keys(this.clientForm.controls).forEach(key => {
            const control = this.clientForm.get(key);
            control?.markAsTouched();
        });
    }

    getFieldError(fieldName: string): string {
        const field = this.clientForm.get(fieldName);
        if (field?.errors && field?.touched) {
            if (field.errors['required']) {
                return 'Поле обязательно для заполнения';
            }
            if (field.errors['minlength']) {
                return `Минимальная длина ${field.errors['minlength'].requiredLength} символов`;
            }
            if (field.errors['maxlength']) {
                return `Максимальная длина ${field.errors['maxlength'].requiredLength} символов`;
            }
            if (field.errors['email']) {
                return 'Введите корректный email адрес';
            }
            if (field.errors['phoneInvalid']) {
                return 'Некорректный номер телефона';
            }
        }
        return '';
    }

    isFieldInvalid(fieldName: string): boolean {
        const field = this.clientForm.get(fieldName);
        return !!(field?.invalid && field?.touched);
    }

    onCancel() {
        this.#router.navigate(['/dashboard/clients']);
    }

    resetForm() {
        this.clientForm.reset({
            status: 'active',
            template: 'Тестовый',
        });
        this.errorMessage.set('');
        this.successMessage.set('');
        console.log('Form reset. Status value:', this.clientForm.get('status')?.value);
    }

    getCurrentStatusValue(): string {
        return this.clientForm.get('status')?.value || 'no-value';
    }

    onStatusChange(newStatus: string): void {
        this.clientForm.get('status')?.setValue(newStatus);
        console.log('Status manually changed to:', newStatus);
    }
}
