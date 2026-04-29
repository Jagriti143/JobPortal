import { HttpInterceptorFn, HttpRequest, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

let isRefreshing = false;

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);

  return next(addToken(req, auth.getToken())).pipe(
    catchError((err: HttpErrorResponse) => {
      // Only attempt refresh on 401, not on network errors (0) or gateway down
      if (
        err.status === 401 &&
        !isRefreshing &&
        !req.url.includes('/auth/refresh-token') &&
        !req.url.includes('/auth/login') &&
        !req.url.includes('/auth/register')
      ) {
        const refreshToken = localStorage.getItem('refresh_token');
        if (refreshToken) {
          isRefreshing = true;
          return auth.refreshAccessToken(refreshToken).pipe(
            switchMap(newToken => {
              isRefreshing = false;
              if (newToken) return next(addToken(req, newToken));
              auth.logout();
              return throwError(() => err);
            }),
            catchError(refreshErr => {
              isRefreshing = false;
              // Only logout if it's an actual auth failure, not a network error
              if (refreshErr?.status === 401 || refreshErr?.status === 400) {
                auth.logout();
              }
              return throwError(() => refreshErr);
            })
          );
        }
      }
      return throwError(() => err);
    })
  );
};

function addToken(req: HttpRequest<any>, token: string | null): HttpRequest<any> {
  if (!token) return req;
  return req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
}
