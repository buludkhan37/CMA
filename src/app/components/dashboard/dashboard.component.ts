import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { User } from '../../interfaces/auth.interface';

@Component({
    selector: 'app-dashboard',
    standalone: true,
    imports: [CommonModule, RouterModule],
    templateUrl: './dashboard.component.html',
    styleUrl: './dashboard.component.scss',
})
export class DashboardComponent implements OnInit, OnDestroy {
    currentUser = signal<User | null>(null);
    activeRoute = signal('clients');
    sidebarCollapsed = signal(false);
    #auth = inject(AuthService);
    #router = inject(Router);

    private subscriptions = new Subscription();

    ngOnInit() {
        this.subscriptions.add(
            this.#auth.currentUser$.subscribe(user => {
                this.currentUser.set(user);
            }),
        );

        this.subscriptions.add(
            this.#router.events.subscribe(() => {
                const currentUrl = this.#router.url;
                if (currentUrl.includes('/clients')) {
                    this.activeRoute.set('clients');
                } else if (currentUrl.includes('/create-client')) {
                    this.activeRoute.set('create-client');
                }
            }),
        );

        const currentUrl = this.#router.url;
        if (currentUrl.includes('/clients')) {
            this.activeRoute.set('clients');
        } else if (currentUrl.includes('/create-client')) {
            this.activeRoute.set('create-client');
        }
    }

    ngOnDestroy() {
        this.subscriptions.unsubscribe();
    }

    logout() {
        console.log('Logout initiated');

        this.#auth.logout();

        setTimeout(() => {
            console.log('Navigating to login page');
            this.#router.navigate(['/login']).then(
                success => {
                    console.log('Navigation to login successful:', success);
                },
                error => {
                    console.error('Navigation to login failed:', error);
                },
            );
        }, 100);
    }

    setActiveRoute(route: string) {
        this.activeRoute.set(route);
        this.#router.navigate(['/dashboard', route]);
    }

    isActiveRoute(route: string): boolean {
        return this.activeRoute() === route;
    }

    toggleSidebar() {
        this.sidebarCollapsed.set(!this.sidebarCollapsed());
    }
}
