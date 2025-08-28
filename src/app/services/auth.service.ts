import { Injectable, Inject, PLATFORM_ID, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap, catchError } from 'rxjs';
import { isPlatformBrowser } from '@angular/common';
import { environment } from '../../environments/environment';
import { MockApiService } from './mock-api.service';
import { LoginRequest, LoginResponse, User } from '../interfaces/auth.interface';
import { sign } from 'node:crypto';

@Injectable({
    providedIn: 'root',
})
export class AuthService {
    private readonly API_URL = environment.apiUrl;
    private readonly AUTH_ENDPOINT = '/test-auth-only';
    private readonly TOKEN_KEY = 'auth_token';
    private readonly USER_KEY = 'current_user';

    private currentUserSubject = new BehaviorSubject<User | null>(null);
    public currentUser$ = this.currentUserSubject.asObservable();

    private initializationSubject = new BehaviorSubject<boolean>(false);
    public initialized$ = this.initializationSubject.asObservable();
    private _isInitialized = signal(false);
    private platformId = inject(PLATFORM_ID);

    #http = inject(HttpClient);
    #mockApiService = inject(MockApiService);

    constructor() {
        this.initializeAuthState();
    }

    private initializeAuthState(): void {
        const storedUser = this.getUserFromStorage();
        console.log(
            'AuthService initialized with user from storage:',
            storedUser ? storedUser.login : 'null',
        );

        if (storedUser) {
            this.currentUserSubject.next(storedUser);
        }

        this._isInitialized.set(true);
        this.initializationSubject.next(true);
        console.log('AuthService initialization completed');
    }

    get isInitialized(): boolean {
        return this._isInitialized();
    }

    login(credentials: LoginRequest): Observable<LoginResponse> {
        const headers = {
            'Content-Type': 'application/json',
            Accept: 'application/json',
        };

        return this.#http
            .post<LoginResponse>(`${this.API_URL}${this.AUTH_ENDPOINT}`, credentials, { headers })
            .pipe(
                tap(response => {
                    if (response && response.token) {
                        const user: User = {
                            login: credentials.login,
                            token: response.token,
                        };
                        this.setSession(user);
                    }
                }),
                catchError((error: any) => {
                    console.log(
                        `Authentication attempt failed with status ${error.status}. Using fallback authentication.`,
                    );

                    if (!environment.production && (error.status === 403 || error.status === 0)) {
                        console.log('Using mock authentication for development environment');
                        return this.#mockApiService.mockLogin(credentials).pipe(
                            tap(response => {
                                const user: User = {
                                    login: credentials.login,
                                    token: response.token,
                                };
                                this.setSession(user);
                            }),
                        );
                    }

                    if (
                        error.error &&
                        typeof error.error === 'string' &&
                        error.error.includes('<html>')
                    ) {
                        throw new Error(
                            'Server returned HTML instead of JSON. Please check API endpoint.',
                        );
                    }

                    if (error.status === 403) {
                        throw new Error(
                            'Access forbidden. Please check your credentials or API permissions.',
                        );
                    }

                    throw error;
                }),
            );
    }

    logout(): void {
        console.log('AuthService logout called');
        console.log('Current user before logout:', this.getCurrentUser());
        console.log('Is authenticated before logout:', this.isAuthenticated());

        this.removeSession();

        console.log('Current user after logout:', this.getCurrentUser());
        console.log('Is authenticated after logout:', this.isAuthenticated());
    }

    isAuthenticated(): boolean {
        const token = this.getToken();
        const user = this.getCurrentUser();

        console.log('Authentication check - Token exists:', !!token, 'User exists:', !!user);

        if (token && !user) {
            console.warn(
                'Invalid authentication state: token exists but no user data. Clearing session.',
            );
            this.removeSession();
            return false;
        }

        if (!token && user) {
            console.warn(
                'Invalid authentication state: user data exists but no token. Clearing session.',
            );
            this.removeSession();
            return false;
        }

        const isAuth = !!(token && user);
        console.log('Final authentication result:', isAuth);
        return isAuth;
    }

    getToken(): string | null {
        if (isPlatformBrowser(this.platformId)) {
            return localStorage.getItem(this.TOKEN_KEY);
        }
        return null;
    }

    getCurrentUser(): User | null {
        let user = this.currentUserSubject.value;

        if (!user && isPlatformBrowser(this.platformId)) {
            user = this.getUserFromStorage();
            if (user) {
                this.currentUserSubject.next(user);
                console.log('Restored user from localStorage after page refresh:', user.login);
            }
        }

        return user;
    }

    getAuthHeaders(): { [key: string]: string } {
        const token = this.getToken();
        return token ? { Authorization: `Bearer ${token}` } : {};
    }

    private setSession(user: User): void {
        if (isPlatformBrowser(this.platformId)) {
            localStorage.setItem(this.TOKEN_KEY, user.token || '');
            localStorage.setItem(this.USER_KEY, JSON.stringify(user));
        }
        this.currentUserSubject.next(user);
    }

    private removeSession(): void {
        if (isPlatformBrowser(this.platformId)) {
            localStorage.removeItem(this.TOKEN_KEY);
            localStorage.removeItem(this.USER_KEY);
        }
        this.currentUserSubject.next(null);
    }

    private getUserFromStorage(): User | null {
        if (isPlatformBrowser(this.platformId)) {
            try {
                const userStr = localStorage.getItem(this.USER_KEY);
                if (userStr) {
                    const user = JSON.parse(userStr);
                    if (user && user.login && user.token) {
                        return user;
                    } else {
                        console.warn('Invalid user data in localStorage, clearing...');
                        localStorage.removeItem(this.USER_KEY);
                        localStorage.removeItem(this.TOKEN_KEY);
                        return null;
                    }
                }
            } catch (error) {
                console.error('Error parsing user data from localStorage:', error);
                localStorage.removeItem(this.USER_KEY);
                localStorage.removeItem(this.TOKEN_KEY);
                return null;
            }
        }
        return null;
    }
}
