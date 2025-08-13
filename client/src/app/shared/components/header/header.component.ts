import { Component, computed, inject, signal, HostListener } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterLink, CommonModule],
  templateUrl: './header.component.html',
})
export class HeaderComponent {
  private auth = inject(AuthService);
  private router = inject(Router);

  user = this.auth.user;
  isLoggedIn = computed(() => !!this.user());
  authReady = this.auth.authReady;

  mobileOpen = signal(false);

  toggleMobile() { this.mobileOpen.update(v => !v); }
  closeMobile()  { this.mobileOpen.set(false); }

  async logout() {
    await this.auth.logout().toPromise?.();
    this.closeMobile();
  }

  constructor() {
    this.router.events.subscribe(() => this.closeMobile());
  }

  @HostListener('window:keydown.escape')
  onEsc() { this.closeMobile(); }
}