import { Component, computed, inject, signal, effect } from '@angular/core';
import { AuthService } from '../../core/services';
import { BookService } from '../../core/services/book.service';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { DecimalPipe } from '@angular/common';

@Component({
  selector: 'app-home',
  imports: [RouterLink, DecimalPipe],
  templateUrl: './home.component.html'
})
export class HomeComponent {
  private authService = inject(AuthService);
  private bookService = inject(BookService);

  user = this.authService.user;
  isLoggedIn = computed(() => !!this.user());
  authReady = this.authService.authReady;

  featuredBooks = toSignal(this.bookService.getFeaturedBooks(), { initialValue: [] });
  latestBooks = toSignal(this.bookService.getLatestBooks(), { initialValue: [] });

  safeRating(b: any): number {
    const r = (b?.avgRating ?? b?.avgRaiting ?? 0);
    return typeof r === 'number' ? r : 0;
  }

  ratingCount(b: any): number {
    return typeof b?.ratingCount === 'number' ? b.ratingCount : 0;
  }

  starsParts(rating: number): ('full'|'half'|'empty')[] {
    const parts: ('full'|'half'|'empty')[] = [];
    const rounded = Math.floor(Math.max(0, Math.min(5, rating)) * 2) / 2; // nearest 0.5 down
    for (let i = 1; i <= 5; i++) {
      if (rounded >= i) parts.push('full');
      else if (rounded + 0.5 >= i && rounded < i) parts.push('half');
      else parts.push('empty');
    }
    return parts;
  }
}