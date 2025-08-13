import { Component, inject, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { firstValueFrom, of, switchMap } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { AuthService, UserService } from '../../core/services';
import { BookService } from '../../core/services/book.service';
import { Book } from '../../core/models';
import { NotificationService } from '../../core/services/notification.service';
import { UserProfileEditComponent } from './user-profile-edit/user-profile-edit.component';

@Component({
  selector: 'app-user-profile',
  imports: [CommonModule, ReactiveFormsModule, RouterLink, UserProfileEditComponent,],
  templateUrl: './user-profile.component.html'
})
export class UserProfileComponent {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private users = inject(UserService);
  private books = inject(BookService);
  private notify = inject(NotificationService); 

  me = this.auth.user;
  editMode = signal(false);

  profileForm = this.fb.group({
    displayName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(40)]],
    email: [{ value: '', disabled: true }],
    bio: ['', [Validators.maxLength(300)]],
    avatar: [null as File | null]
  });

  constructor() {
    effect(() => {
      const ids = this.me()?.favorites ?? [];
      this.loadFavoriteBooks(ids).catch(() => {
        this.notify.error('Failed to load favorite books.');
      });
    });

    effect(() => {
      const u = this.me();
      if (!u) return;
      this.profileForm.patchValue(
        {
          displayName: u.displayName || '',
          email: u.email || '',
          bio: (u as any).bio || ''
        },
        { emitEvent: false }
      );
    });
  }

  bioText(): string { return (this.me()?.bio ?? '').trim(); }
  createdAtDate = computed(() => {
    const v = this.me()?.createdAt as any;
    if (!v) return null;
    return typeof v.toDate === 'function' ? v.toDate() : (v instanceof Date ? v : null);
  });

  favoriteBooks = signal<Book[]>([]);

  myBooks = toSignal(
    of(null).pipe(
      switchMap(() => {
        const uid = this.me()?.id;
        if (!uid) return of([] as Book[]);
        return this.books.getBooksByUser(uid);
      })
    ),
    { initialValue: [] as Book[] }
  );

  toggleEdit() {
    const u = this.me();
    if (!u?.id) {
      this.notify.error('You must be logged in to edit your profile.');
      return;
    }
    this.editMode.update(v => !v);
  }

  async removeFavorite(bookId: string) {
    const cur = this.me();
    const uid = cur?.id;
    if (!uid) {
      this.notify.error('You must be logged in.');
      return;
    }

    const prevUser = cur ? { ...cur, favorites: [...(cur.favorites ?? [])] } : null;
    const prevFavBooks = this.favoriteBooks();

    const nextFavorites = (cur?.favorites ?? []).filter(id => id !== bookId);
    this.auth.patchUser({ favorites: nextFavorites });
    this.favoriteBooks.set(prevFavBooks.filter(b => b.id !== bookId));

    try {
      await this.users.removeFavorite(uid, bookId);
      this.auth.refreshUserFromServer().catch(() => {});
      this.notify.success('Removed from favorites.');
    } catch (e) {
      if (prevUser) this.auth.setUser(prevUser);
      this.favoriteBooks.set(prevFavBooks);
      this.notify.error('Failed to remove from favorites.');
      console.error('Failed to remove favorite:', e);
    }
  }

  private async loadFavoriteBooks(ids: string[]) {
    if (!ids.length) {
      this.favoriteBooks.set([]);
      return;
    }
    const results = await Promise.all(ids.map(id => firstValueFrom(this.books.getBookById(id))));
    this.favoriteBooks.set(results.filter(Boolean) as Book[]);
  }

  onEditSaved() {
    this.notify.success('Profile updated successfully.');
    this.editMode.set(false);
  }
  onEditCancelled() {
    this.editMode.set(false);
  }
}