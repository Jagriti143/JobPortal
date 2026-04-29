import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap, switchMap, map, of, catchError } from 'rxjs';
import { Router } from '@angular/router';
import { ApiResponse, AuthResponse, LoginRequest, RegisterRequest, UserProfile } from '../models/index';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private base = `${environment.apiUrl}/auth`;

  private _user$ = new BehaviorSubject<UserProfile | null>(this.loadUser());
  user$ = this._user$.asObservable();

  get currentUser() { return this._user$.value; }
  get isLoggedIn() { return !!this.getToken(); }
  get role() { return this._user$.value?.role ?? ''; }

  login(req: LoginRequest): Observable<ApiResponse<AuthResponse>> {
    return this.http.post<ApiResponse<AuthResponse>>(`${this.base}/login`, req).pipe(
      switchMap(res => {
        if (res.success && res.data) {
          if (typeof localStorage !== 'undefined') {
            localStorage.setItem('access_token', res.data.accessToken);
            localStorage.setItem('refresh_token', res.data.refreshToken);
          }
          return this.http.get<ApiResponse<UserProfile>>(`${this.base}/me`).pipe(
            tap(profileRes => {
              if (profileRes.success && profileRes.data) {
                if (typeof localStorage !== 'undefined') {
                  localStorage.setItem('user_profile', JSON.stringify(profileRes.data));
                }
                this._user$.next(profileRes.data);
              }
            }),
            map(() => res)
          );
        }
        return of(res);
      })
    );
  }

  register(req: RegisterRequest): Observable<ApiResponse<{ userId: string }>> {
    return this.http.post<ApiResponse<{ userId: string }>>(`${this.base}/register`, req);
  }

  fetchProfile(): void {
    if(!this.isLoggedIn) return;
    this.http.get<ApiResponse<UserProfile>>(`${this.base}/me`).subscribe({
      next: res => {
        if (res.success && res.data) {
          if (typeof localStorage !== 'undefined') {
            localStorage.setItem('user_profile', JSON.stringify(res.data));
          }
          this._user$.next(res.data);
        }
      }
    });
  }

  logout(): void {
    if(this.isLoggedIn) this.http.post(`${this.base}/logout`, {}).subscribe();
    if (typeof localStorage !== 'undefined') {
      ['access_token', 'refresh_token', 'user_profile'].forEach(k => localStorage.removeItem(k));
    }
    this._user$.next(null);
    this.router.navigate(['/auth/login']);
  }

  verifyEmail(token: string) { return this.http.get<ApiResponse<any>>(`${this.base}/verify-email`, { params: { token } }); }
  forgotPassword(email: string) { return this.http.post<ApiResponse<any>>(`${this.base}/forgot-password`, { email }); }
  resetPassword(token: string, newPassword: string) { return this.http.post<ApiResponse<any>>(`${this.base}/reset-password`, { token, newPassword }); }
  getToken() { return typeof localStorage !== 'undefined' ? localStorage.getItem('access_token') : null; }

  refreshAccessToken(refreshToken: string) {
    return this.http.post<ApiResponse<AuthResponse>>(`${this.base}/refresh-token`, { refreshToken }).pipe(
      map(res => {
        if (res.success && res.data) {
          localStorage.setItem('access_token', res.data.accessToken);
          localStorage.setItem('refresh_token', res.data.refreshToken);
          return res.data.accessToken;
        }
        return null;
      }),
      catchError(() => of(null))
    );
  }

  private loadUser(): UserProfile | null { 
    if (typeof localStorage === 'undefined') return null;
    const r = localStorage.getItem('user_profile'); 
    return r ? JSON.parse(r) : null; 
  }
}
