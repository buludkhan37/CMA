import { Routes, Router } from '@angular/router';
import { AuthGuard } from './guards/auth.guard';
import { LoginComponent } from './components/login/login.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { ClientListComponent } from './components/client-list/client-list.component';
import { ClientCreateComponent } from './components/client-create/client-create.component';
import { inject, Component, effect } from '@angular/core';
import { AuthService } from './services/auth.service';
import { filter, take } from 'rxjs';

@Component({
    selector: 'app-root-redirect',
    template:
        '<div class="app-loading"><div class="loading-spinner"></div><p>Загрузка...</p></div>',
    styles: [
        `
            .app-loading {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                height: 100vh;
                background-color: #f8f9fa;
            }
            .loading-spinner {
                width: 40px;
                height: 40px;
                border: 4px solid #e9ecef;
                border-top: 4px solid #007bff;
                border-radius: 50%;
                animation: spin 1s linear infinite;
                margin-bottom: 16px;
            }
            @keyframes spin {
                0% {
                    transform: rotate(0deg);
                }
                100% {
                    transform: rotate(360deg);
                }
            }
        `,
    ],
    standalone: true,
})
class RootRedirectComponent {
    #auth = inject(AuthService);
    #router = inject(Router);

    initAuthRedirect = effect(() => {
        this.#auth.initialized$
            .pipe(
                filter(initialized => initialized),
                take(1),
            )
            .subscribe(() => {
                const isAuthenticated = this.#auth.isAuthenticated();
                console.log('Root redirect: User authenticated:', isAuthenticated);

                if (isAuthenticated) {
                    this.#router.navigate(['/dashboard/clients']);
                } else {
                    this.#router.navigate(['/login']);
                }
            });
    });
}

export const routes: Routes = [
    {
        path: '',
        component: RootRedirectComponent,
        pathMatch: 'full',
    },

    {
        path: 'login',
        component: LoginComponent,
    },

    {
        path: 'dashboard',
        component: DashboardComponent,
        canActivate: [AuthGuard],
        children: [
            {
                path: '',
                redirectTo: 'clients',
                pathMatch: 'full',
            },
            {
                path: 'clients',
                component: ClientListComponent,
            },
            {
                path: 'create-client',
                component: ClientCreateComponent,
            },
        ],
    },

    {
        path: '**',
        redirectTo: '/login',
    },
];
