import { inject, Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { Observable, map, take, filter } from 'rxjs';
import { AuthService } from '../services/auth.service';

@Injectable({
    providedIn: 'root',
})
export class AuthGuard implements CanActivate {
    #auth = inject(AuthService);
    #router = inject(Router);

    canActivate(): Observable<boolean> | boolean {
        console.log('AuthGuard: Checking authentication...');

        if (!this.#auth.isInitialized) {
            console.log('AuthGuard: Waiting for auth service initialization...');
            return this.#auth.initialized$.pipe(
                filter(initialized => initialized),
                take(1),
                map(() => {
                    const isAuthenticated = this.#auth.isAuthenticated();
                    console.log(
                        'AuthGuard: Authentication result after initialization:',
                        isAuthenticated,
                    );

                    if (isAuthenticated) {
                        console.log('AuthGuard: Access granted');
                        return true;
                    } else {
                        console.log('AuthGuard: Access denied, redirecting to login');
                        this.#router.navigate(['/login']);
                        return false;
                    }
                }),
            );
        }

        const isAuthenticated = this.#auth.isAuthenticated();
        console.log('AuthGuard: Authentication result (immediate):', isAuthenticated);

        if (isAuthenticated) {
            console.log('AuthGuard: Access granted');
            return true;
        } else {
            console.log('AuthGuard: Access denied, redirecting to login');
            this.#router.navigate(['/login']);
            return false;
        }
    }
}
