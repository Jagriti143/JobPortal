import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const auth = inject(AuthService);
  if (auth.isLoggedIn) return true;
  inject(Router).navigate(['/auth/login'], { queryParams: { returnUrl: state.url } });
  return false;
};

export const roleGuard = (...roles: string[]): CanActivateFn => () => {
  const auth = inject(AuthService);
  if (auth.isLoggedIn && roles.includes(auth.role)) return true;
  inject(Router).navigate(['/']);
  return false;
};
