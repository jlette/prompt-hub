import { inject, Injectable, signal } from '@angular/core'
import { HttpClient } from '@angular/common/http'
import { environment } from '../../environments/environment'
import { CurrentUser } from './current-user.model'
import { catchError, delay, of, tap } from 'rxjs'

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  httpclient = inject(HttpClient)
  baseUrl = environment.apiUrl + 'auth'

  currentUser = signal<CurrentUser | undefined>(undefined)
  loadCurrentUser() {
    return this.httpclient.get<CurrentUser>(`${this.baseUrl}/me`)
      .pipe(
      tap((currentUser) => this.currentUser.set(currentUser)),
      catchError(() => {
        this.currentUser.set(undefined)
        return of(undefined)
      }),
    )
  }
  login(username: string, password: string) {
    return this.httpclient
      .post<CurrentUser>(`${this.baseUrl}/login`, { username, password })
      .pipe(tap((currentUser) => this.currentUser.set(currentUser)),delay(3000))
  }

  register(username: string, password: string) {
    return this.httpclient
      .post<CurrentUser>(`${this.baseUrl}/register`, { username, password })
      .pipe(tap((currentUser) => this.currentUser.set(currentUser)))
  }

  logout() {
    return this.httpclient
      .post<CurrentUser>(`${this.baseUrl}/logout`, {})
      .pipe(tap((currentUser) => this.currentUser.set(undefined)))
  }
}
