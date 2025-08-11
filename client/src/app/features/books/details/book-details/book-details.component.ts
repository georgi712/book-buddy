import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map, filter, distinctUntilChanged, switchMap, catchError, of, startWith } from 'rxjs';
import { Book } from '../../../../core/models';
import { BookService, AuthService, UserService } from '../../../../core/services';
import { ReviewsListComponent } from '../reviews/review-list/review-list.component';

@Component({
  selector: 'app-book-details',
  standalone: true,
  imports: [CommonModule, RouterLink, ReviewsListComponent],
  templateUrl: './book-details.component.html',
})
export class BookDetailsComponent {
  private route = inject(ActivatedRoute);
  private bookService = inject(BookService);
  private auth = inject(AuthService);
  private userService = inject(UserService);

  // id$ -> filters out empty/null, emits only when changes
  private bookId$ = this.route.paramMap.pipe(
    map(p => p.get('id')),
    filter((id): id is string => !!id && id.trim().length > 0),
    distinctUntilChanged()
  );

  // loading & error as signals
  loading = signal(true);
  error = signal<string | null>(null);

  // book$ from id$
  private book$ = this.bookId$.pipe(
    switchMap(id => 
      this.bookService.getBookById(id).pipe(
        // set loading flags
        startWith('__loading__' as any),
        catchError(err => {
          this.error.set(err?.message || 'Failed to load book.');
          return of(undefined as Book | undefined);
        })
      )
    )
  );

  // turn to signals
  bookId = toSignal(this.bookId$, { initialValue: '' });
  book = toSignal(this.book$, { initialValue: undefined as Book | undefined });

  constructor() {
    // react to book changes to manage loading state
    // when stream emits the special token, show loading
    this.book$.subscribe(val => {
      if (val === '__loading__') {
        this.loading.set(true);
        this.error.set(null);
      } else {
        this.loading.set(false);
      }
    });
  }

  // auth-derived signals
  me = this.auth.user;
  isLoggedIn = computed(() => !!this.me());
  isOwner = computed(() => !!this.me()?.id && !!this.book()?.userId && this.me()!.id === this.book()!.userId);

  isInFavorites = computed(() => {
    const uid = this.me()?.id;
    const id = this.bookId();
    if (!uid || !id) return false;
    return (this.me()?.favorites ?? []).includes(id);
  });

  starsArray(n: number = 0) {
    const rating = Math.max(0, Math.min(5, Math.round(n)));
    return Array(5).fill(0).map((_, i) => i < rating);
  }

  async toggleFavorite() {
    if (!this.isLoggedIn() || !this.bookId()) return;
    const uid = this.me()!.id;
    const id = this.bookId();
    try {
      if (this.isInFavorites()) await this.userService.removeFavorite(uid, id);
      else await this.userService.addFavorite(uid, id);
    } catch (e: any) {
      console.error('Favorite toggle error:', e?.message || e);
    }
  }

  share() {
    const b = this.book();
    if (!b) return;
    const url = location.href;
    if (navigator.share) {
      navigator.share({ title: b.title, text: `Check out "${b.title}" by ${b.author}`, url }).catch(() => {});
    } else {
      navigator.clipboard.writeText(url).then(() => alert('Link copied to clipboard!'));
    }
  }
}