import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { guestGuard } from './core/guards/guest.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./features/home/home.component').then(c => c.HomeComponent)
  },
  {
    path: 'books',
    loadComponent: () => import('./features/books/catalog/catalog.component').then(c => c.CatalogComponent)
  },
  {
    path: 'books/details/:id',
    loadComponent: () => import('./features/books/details/book-details/book-details.component').then(c => c.BookDetailsComponent)
  },
  {
    path: 'books/edit/:id',
    canActivate: [authGuard],
    loadComponent: () => import('./features/books/manage/edit-book/edit-book.component').then(c => c.EditBookComponent)
  },
  {
    path: 'books/create',
    canActivate: [authGuard],
    loadComponent: () => import('./features/books/manage/create-book/create-book.component').then(c => c.CreateBookComponent)
  },
  {
    path: 'profile',
    canActivate: [authGuard],
    loadComponent: () => import('./features/user-profile/user-profile.component').then(c => c.UserProfileComponent)
  },
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () => import('./features/auth/login/login.component').then(c => c.LoginComponent)
  },
  {
    path: 'register',
    canActivate: [guestGuard],
    loadComponent: () => import('./features/auth/register/register.component').then(c => c.RegisterComponent)
  },
  {
    path: '**',
    loadComponent: () => import('./features/not-found/not-found.component').then(c => c.NotFoundComponent)
  }
];
