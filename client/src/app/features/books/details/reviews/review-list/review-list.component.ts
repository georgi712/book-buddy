import { Component, computed, input, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { toSignal, toObservable } from '@angular/core/rxjs-interop';
import { switchMap, of } from 'rxjs';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService, ReviewService } from '../../../../../core/services';
import { Review } from '../../../../../core/models';
import { FieldValue, Timestamp } from '@angular/fire/firestore';
import { ReviewFormComponent } from '../review-form/review-form.component';

@Component({
  selector: 'app-reviews-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ReviewFormComponent],
  template: `
  <section class="bg-white rounded-2xl shadow p-6 md:p-8">
    <!-- Header -->
    <div class="flex items-center justify-between mb-4">
      <h2 class="text-2xl font-bold text-gray-900">Reviews</h2>

      @if (isLoggedIn()) {
        <button
          type="button"
          (click)="toggleForm()"
          class="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
        >
          {{ formOpen() ? 'Close' : 'Add Review' }}
        </button>
      }
    </div>

    <!-- Collapsible form -->
    @if (formOpen() && isLoggedIn()) {
      <div class="mb-6">
        <app-review-form
          [bookId]="bookId()"
          (submitted)="onFormSubmitted()"
        ></app-review-form>
      </div>
    }

    <!-- Empty state -->
    @if (!reviews() || reviews()!.length === 0) {
      <div class="rounded-xl border border-dashed border-gray-300 p-8 text-center text-gray-600">
        No reviews yet. Be the first to add one!
      </div>
    } @else {
      <!-- Reviews list -->
      <div class="space-y-5">
        @for (r of reviews(); track r.id) {
          <article class="rounded-xl border border-gray-200 bg-gray-50 p-5 shadow-sm hover:shadow-md transition">
            <div class="flex gap-4">
              <!-- Avatar -->
              <div class="flex-shrink-0">
                <div class="w-12 h-12 rounded-full overflow-hidden bg-gray-200">
                  <img *ngIf="isHttp(r.userPhoto)" [src]="r.userPhoto" class="w-full h-full object-cover" />
                </div>
              </div>

              <!-- Body -->
              <div class="flex-1 min-w-0">
                <div class="flex items-start justify-between gap-3">
                  <div class="min-w-0">
                    <h3 class="font-semibold text-gray-900 text-lg truncate">{{ r.userName || 'User' }}</h3>
                    <div class="mt-1 flex items-center">
                      <div class="flex">
                        @for (s of [1,2,3,4,5]; track s) {
                          <svg class="w-5 h-5"
                               [class.text-amber-400]="s <= (r.rating || 0)"
                               [class.text-gray-300]="s > (r.rating || 0)"
                               fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                          </svg>
                        }
                      </div>
                      <span class="ml-3 text-xs text-gray-500">{{ toDate(r.createdAt) | date:'mediumDate' }}</span>
                    </div>
                  </div>

                  @if (isOwner(r.userId)) {
                    <div class="flex items-center gap-2">
                      @if (editingId() !== r.id) {
                        <button class="px-3 py-1.5 rounded-md bg-white border border-gray-300 text-gray-800 text-sm hover:bg-gray-50" (click)="startEdit(r)">Edit</button>
                        <button class="px-3 py-1.5 rounded-md bg-red-600 text-white text-sm hover:bg-red-700 disabled:opacity-50"
                                [disabled]="busyId() === r.id"
                                (click)="remove(r)">Delete</button>
                      } @else {
                        <button class="px-3 py-1.5 rounded-md bg-white border border-gray-300 text-gray-800 text-sm hover:bg-gray-50" (click)="cancelEdit()">Cancel</button>
                      }
                    </div>
                  }
                </div>

                @if (editingId() !== r.id) {
                  <p class="mt-3 text-gray-800 whitespace-pre-line">{{ r.comment }}</p>
                } @else {
                  <form [formGroup]="editForm" (ngSubmit)="save(r)" class="mt-4 rounded-lg border p-4 bg-white">
                    <div class="mb-3">
                      <label class="block text-sm text-gray-700 mb-2">Your Rating</label>
                      <div class="flex items-center gap-1">
                        @for (s of stars; track s) {
                          <button type="button" class="p-1" (click)="setEditRating(s)" [attr.aria-pressed]="editForm.value.rating === s">
                            <svg class="h-6 w-6"
                                 [ngClass]="(editForm.value.rating || 0) >= s ? 'text-amber-400' : 'text-gray-300'"
                                 viewBox="0 0 20 20" fill="currentColor">
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                            </svg>
                          </button>
                        }
                      </div>
                    </div>

                    <div class="mb-3">
                      <label class="block text-sm text-gray-700 mb-2">Comment</label>
                      <textarea rows="3" formControlName="comment" class="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" placeholder="Update your review..."></textarea>
                      @if (editForm.controls.comment.invalid && (editForm.controls.comment.touched || editForm.controls.comment.dirty)) {
                        <p class="mt-2 text-sm text-red-600">Max 1000 characters.</p>
                      }
                    </div>

                    <div class="flex justify-end gap-3">
                      <button type="button" class="px-3 py-1.5 rounded-md border" (click)="cancelEdit()">Cancel</button>
                      <button type="submit" class="px-3 py-1.5 rounded-md bg-emerald-600 text-white disabled:opacity-50" [disabled]="editForm.invalid || busyId() === r.id">
                        {{ busyId() === r.id ? 'Saving…' : 'Save' }}
                      </button>
                    </div>
                  </form>
                }
              </div>
            </div>
          </article>
        }
      </div>
    }
  </section>
  `
})
export class ReviewsListComponent {
  private reviewService = inject(ReviewService);
  private auth = inject(AuthService);
  private fb = inject(FormBuilder);

  bookId = input.required<string>();

  // Firestore live stream only (no optimistic layer)
  reviews = toSignal(
    toObservable(this.bookId).pipe(
      switchMap(id => id ? this.reviewService.getReviewsForBook(id) : of<Review[]>([]))
    ),
    { initialValue: [] as Review[] }
  );

  formOpen = signal(false);
  toggleForm() { this.formOpen.update(v => !v); }
  onFormSubmitted() { this.formOpen.set(false); }

  isLoggedIn = computed(() => !!this.auth.user());
  isOwner = (uid?: string | null) => this.auth.user()?.id && uid && this.auth.user()!.id === uid;

  stars = [1,2,3,4,5];
  editingId = signal<string | null>(null);
  busyId = signal<string | null>(null);

  editForm = this.fb.group({
    rating: [5, [Validators.required, Validators.min(1), Validators.max(5)]],
    comment: ['', [Validators.maxLength(1000)]],
  });

  startEdit(r: Review) {
    this.editingId.set(r.id!);
    this.editForm.reset({
      rating: r.rating ?? 5,
      comment: r.comment ?? ''
    });
  }

  cancelEdit() {
    this.editingId.set(null);
    this.editForm.reset();
  }

  setEditRating(v: number) {
    this.editForm.controls.rating.setValue(v);
    this.editForm.controls.rating.markAsDirty();
  }

  async save(r: Review) {
    if (this.editForm.invalid || !this.bookId()) return;
    const id = r.id!;
    this.busyId.set(id);
    try {
      await this.reviewService.updateReview(this.bookId(), id, {
        rating: this.editForm.value.rating!,
        comment: this.editForm.value.comment || ''
      });
      this.cancelEdit();            // Live stream will reflect the change
    } catch (e) {
      console.error('Update review error:', e);
    } finally {
      this.busyId.set(null);
    }
  }

  async remove(r: Review) {
    if (!this.bookId() || !r.id) return;
    const ok = confirm('Delete this review?');
    if (!ok) return;
    this.busyId.set(r.id);
    try {
      await this.reviewService.deleteReview(this.bookId(), r.id);
      // Live stream will drop the item when Firestore confirms deletion
    } catch (e) {
      console.error('Delete review error:', e);
    } finally {
      this.busyId.set(null);
    }
  }

  toDate(value: Timestamp | FieldValue | Date | undefined): Date | null {
    if (!value) return null;
    if (value instanceof Date) return value;
    if (typeof (value as any).toDate === 'function') return (value as any).toDate();
    return null;
  }

  isHttp = (v?: string | null) => !!v && /^https?:\/\//i.test(v);
}