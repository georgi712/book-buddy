import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map, filter, distinctUntilChanged, switchMap, catchError, of, startWith } from 'rxjs';
import { Book } from '../../../../core/models';
import { BookService, AuthService, UserService, NotificationService } from '../../../../core/services';
import { ReviewsListComponent } from '../reviews/review-list/review-list.component';

@Component({
  selector: 'app-book-details',
  imports: [CommonModule, RouterLink, ReviewsListComponent],
  templateUrl: './book-details.component.html',
})
export class BookDetailsComponent {
  private route = inject(ActivatedRoute);
  private bookService = inject(BookService);
  private auth = inject(AuthService);
  private userService = inject(UserService);
  private notify = inject(NotificationService);

  private bookId$ = this.route.paramMap.pipe(
    map(p => p.get('id')),
    filter((id): id is string => !!id && id.trim().length > 0),
    distinctUntilChanged()
  );

  loading = signal(true);
  error = signal<string | null>(null);
  toggling = signal(false);

  private book$ = this.bookId$.pipe(
    switchMap(id =>
      this.bookService.getBookById(id).pipe(
        startWith('__loading__' as any),
        catchError(err => {
          const msg = err?.message || 'Failed to load book.';
          this.error.set(msg);
          this.notify.error(msg, 'Load error');
          return of(undefined as Book | undefined);
        })
      )
    )
  );

  bookId = toSignal(this.bookId$, { initialValue: '' });
  book = toSignal(this.book$, { initialValue: undefined as Book | undefined });

  constructor() {
    this.book$.subscribe(val => {
      if (val === '__loading__') {
        this.loading.set(true);
        this.error.set(null);
      } else {
        this.loading.set(false);
      }
    });
  }

  me = this.auth.user;
  isLoggedIn = computed(() => !!this.me());
  isOwner = computed(() => !!this.me()?.id && !!this.book()?.userId && this.me()!.id === this.book()!.userId);

  isInFavorites = computed(() => {
    const id = this.bookId();
    return !!id && (this.me()?.favorites ?? []).includes(id);
  });

  starsArray(rating: number): ('full' | 'half' | 'empty')[] {
    const stars: ('full' | 'half' | 'empty')[] = [];
    const rounded = Math.floor(rating * 2) / 2;
    for (let i = 1; i <= 5; i++) {
      if (rounded >= i) stars.push('full');
      else if (rounded + 0.5 >= i && rounded < i) stars.push('half');
      else stars.push('empty');
    }
    return stars;
  }

  async toggleFavorite() {
    if (this.toggling()) return;

    const user = this.me();
    const id = this.bookId();
    if (!user?.id || !id) {
      this.notify.info('Please sign in to use favorites.');
      return;
    }

    this.toggling.set(true);

    const prev = user.favorites ?? [];
    const wasFav = prev.includes(id);
    const next = wasFav ? prev.filter(b => b !== id) : [...prev, id];

    this.auth.patchUser({ favorites: next });

    try {
      if (wasFav) {
        await this.userService.removeFavorite(user.id, id);
        this.notify.info('Removed from favorites', 'Favorites');
      } else {
        await this.userService.addFavorite(user.id, id);
        this.notify.success('Added to favorites', 'Favorites');
      }
    } catch (e: any) {
      this.auth.patchUser({ favorites: prev });
      this.notify.error(e?.message || 'Could not update favorites.', 'Favorites error');
      console.error('Favorite toggle error:', e?.message || e);
    } finally {
      this.toggling.set(false);
    }
  }

  share() {
    const b = this.book();
    if (!b) return;

    const url = location.href;
    if (navigator.share) {
      navigator
        .share({ title: b.title, text: `Check out "${b.title}" by ${b.author}`, url })
        .catch(() => {/* user cancelled; ignore */});
    } else {
      navigator.clipboard
        .writeText(url)
        .then(() => this.notify.success('Link copied to clipboard!', 'Share'))
        .catch(() => this.notify.error('Could not copy link. Please copy it manually.', 'Share'));
    }
  }
}