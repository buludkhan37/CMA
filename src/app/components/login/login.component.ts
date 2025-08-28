import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { LoginRequest } from '../../interfaces/auth.interface';

@Component({
    selector: 'app-login',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule],
    templateUrl: './login.component.html',
    styleUrl: './login.component.scss',
})
export class LoginComponent implements OnInit, OnDestroy {
    loginForm!: FormGroup;
    isLoading = signal(false);
    errorMessage = signal('');
    #fb = inject(FormBuilder);
    #auth = inject(AuthService);
    #router = inject(Router);

    private subscription = new Subscription();

    ngOnInit() {
        console.log('LoginComponent initialized');
        this.initializeForm();

        if (this.#auth.isAuthenticated()) {
            console.log('User already authenticated, redirecting to dashboard');
            this.#router.navigate(['/dashboard/clients']);
        }
    }

    ngOnDestroy() {
        this.subscription.unsubscribe();
    }

    private initializeForm() {
        this.loginForm = this.#fb.group({
            login: ['', [Validators.required, Validators.minLength(3)]],
            password: ['', [Validators.required, Validators.minLength(3)]],
        });
    }

    onSubmit() {
        if (this.loginForm.valid) {
            this.isLoading.set(true);
            this.errorMessage.set('');

            const credentials: LoginRequest = this.loginForm.value;

            this.#auth.login(credentials).subscribe({
                next: (response: any) => {
                    this.isLoading.set(false);
                    if (response.token) {
                        this.#router.navigate(['/dashboard']);
                    } else {
                        this.errorMessage = response.message || 'Ошибка авторизации';
                    }
                },
                error: (error: any) => {
                    this.isLoading.set(false);
                    console.error('Login error:', error);

                    if (error.status === 200 && !error.ok) {
                        this.errorMessage.set(
                            'External API returned invalid response format. Using development mode - you can proceed with any credentials.',
                        );
                    } else if (error.message && error.message.includes('Mock authentication')) {
                        this.errorMessage.set(
                            'External API unavailable. Using development mode - you can proceed with any credentials.',
                        );
                    } else if (error.message) {
                        this.errorMessage.set(error.message);
                    } else {
                        this.errorMessage.set(
                            error.error?.message ||
                                'Network error. Please check your connection and try again.',
                        );
                    }
                },
            });
        } else {
            this.markFormGroupTouched();
        }
    }

    private markFormGroupTouched() {
        Object.keys(this.loginForm.controls).forEach(key => {
            const control = this.loginForm.get(key);
            control?.markAsTouched();
        });
    }

    getFieldError(fieldName: string): string {
        const field = this.loginForm.get(fieldName);
        if (field?.errors && field?.touched) {
            if (field.errors['required']) {
                return 'Поле обязательно для заполнения';
            }
            if (field.errors['minlength']) {
                return `Минимальная длина ${field.errors['minlength'].requiredLength} символов`;
            }
        }
        return '';
    }

    isFieldInvalid(fieldName: string): boolean {
        const field = this.loginForm.get(fieldName);
        return !!(field?.invalid && field?.touched);
    }
}
