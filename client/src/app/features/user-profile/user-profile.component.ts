import { Component, inject, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { combineLatest, firstValueFrom, map, of, switchMap } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { AuthService, UserService } from '../../core/services';
import { BookService } from '../../core/services/book.service';
import { ImageUploadComponent } from '../../shared/components/image-upload/image-upload.component';
import { Book } from '../../core/models';

@Component({
  selector: 'app-user-profile',
  imports: [CommonModule, ReactiveFormsModule, ImageUploadComponent, RouterLink],
  templateUrl: './user-profile.component.html'
})
export class UserProfileComponent {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private users = inject(UserService);
  private books = inject(BookService);

  me = this.auth.user;
  isSaving = signal(false);
  saveError = signal<string | null>(null);
  success = signal(false);
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
      this.loadFavoriteBooks(ids);
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

  get displayName() { return this.profileForm.controls.displayName; }
  get bio() { return this.profileForm.controls.bio; }
  get avatarCtrl() { return this.profileForm.controls.avatar; }

  displayNameError(): string {
    if (this.displayName.hasError('required')) return 'Display name is required';
    if (this.displayName.hasError('minlength')) return 'At least 2 characters';
    if (this.displayName.hasError('maxlength')) return 'At most 40 characters';
    return '';
  }

  bioLeft = computed(() => 300 - (this.bio.value?.length ?? 0));
  bioText(): string { return (this.me()?.bio ?? '').trim(); }
  hasBio(): boolean { return !!this.bioText(); }

  createdAtDate = computed(() => {
    const v = this.me()?.createdAt as any;
    if (!v) return null;
    return typeof v.toDate === 'function' ? v.toDate() : (v instanceof Date ? v : null);
  });

  // Writable so we can set optimistically and when loading
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
    if (!this.editMode()) {
      const u = this.me();
      if (u) {
        this.profileForm.patchValue(
          {
            displayName: u.displayName || '',
            email: u.email || '',
            bio: (u as any).bio || ''
          },
          { emitEvent: false }
        );
        this.avatarCtrl.reset(null);
      }
    }
    this.editMode.update(v => !v);
    this.success.set(false);
    this.saveError.set(null);
  }

  async save() {
    this.success.set(false);
    this.saveError.set(null);
    if (this.profileForm.invalid) {
      this.displayName.markAsTouched();
      this.bio.markAsTouched();
      return;
    }
    const u = this.me();
    if (!u?.id) { this.saveError.set('Not authenticated.'); return; }

    this.isSaving.set(true);
    try {
      const file = this.avatarCtrl.value;
      if (file) {
        await this.users.replaceAvatar(u.id, file as File, u.imagePath);
      }

      await firstValueFrom(this.users.updateUser(u.id, {
        displayName: this.displayName.value || '',
        bio: this.bio.value || ''
      }));

      const refreshed = await this.auth.refreshUserFromServer();
      if (refreshed) this.auth.setUser(refreshed);

      this.success.set(true);
      this.avatarCtrl.reset(null);
      this.editMode.set(false);
    } catch (e: any) {
      this.saveError.set(e?.message || 'Failed to save profile.');
    } finally {
      this.isSaving.set(false);
    }
  }

  async removeFavorite(bookId: string) {
    const cur = this.me();
    const uid = cur?.id;
    if (!uid) return;

    const prevUser = cur ? { ...cur, favorites: [...(cur.favorites ?? [])] } : null;
    const prevFavBooks = this.favoriteBooks();

    const nextFavorites = (cur?.favorites ?? []).filter(id => id !== bookId);
    this.auth.patchUser({ favorites: nextFavorites });
    this.favoriteBooks.set(prevFavBooks.filter(b => b.id !== bookId));

    try {
      await this.users.removeFavorite(uid, bookId);
      this.auth.refreshUserFromServer().catch(() => {});
    } catch (e) {
      if (prevUser) this.auth.setUser(prevUser);
      this.favoriteBooks.set(prevFavBooks);
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
}