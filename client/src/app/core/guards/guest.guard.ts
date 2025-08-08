import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const guestGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.authReady()) {
    return new Promise(resolve => {
      const check = setInterval(() => {
        if (authService.authReady()) {
          clearInterval(check);
          resolve(authService.user() ? router.createUrlTree(['/']) : true);
        }
      }, 50); 
    });
  }

  return authService.user() ? router.createUrlTree(['/']) : true;
};