import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
    providedIn: 'root',
})
export class ApiTestService {
    #http = inject(HttpClient);

    testConnection(): Observable<any> {
        return this.#http.get(`${environment.apiUrl}/test-auth-only`, {
            headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json',
            },
        });
    }
}
