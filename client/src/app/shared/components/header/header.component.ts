import { Component, computed, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-header',
  
  imports: [RouterLink, CommonModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css'
})
export class HeaderComponent {
  private authService = inject(AuthService);
  private router = inject(Router)

  user = this.authService.user;
  isLoggedIn = computed(() => !!this.user());
  authReady = this.authService.authReady;

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/'])
  }
}