import { Component, computed, input, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { toSignal, toObservable } from '@angular/core/rxjs-interop';
import { switchMap, of } from 'rxjs';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ReviewFormComponent } from '../review-form/review-form.component';
import { AuthService, ReviewService } from '../../../../../core/services';
import { Review } from '../../../../../core/models';
import { FieldValue, Timestamp } from '@angular/fire/firestore';

@Component({
  selector: 'app-reviews-list',
  imports: [CommonModule, ReactiveFormsModule, ReviewFormComponent],
  template: `
  <div class="bg-white rounded-lg shadow-lg p-8">
    <div class="flex justify-between items-center mb-6">
      <h2 class="text-2xl font-bold text-gray-800">Reviews</h2>
      @if (isLoggedIn()) {
        <app-review-form [bookId]="bookId()" (submitted)="noop()" />
      }
    </div>

    @if (!reviews() || reviews()!.length === 0) {
      <p class="text-gray-600">No reviews yet. Be the first to add one!</p>
    } @else {
      <div class="space-y-6">
        @for (r of reviews(); track r.id) {
          <div class="border-b border-gray-200 pb-6 last:border-b-0">
            <div class="flex items-start gap-4">
              <div class="w-12 h-12 rounded-full bg-gray-200 overflow-hidden">
                <img *ngIf="r.userPhoto" [src]="r.userPhoto" class="w-full h-full object-cover" />
              </div>

              <div class="flex-1">
                <div class="flex items-center justify-between mb-2">
                  <h3 class="font-semibold text-gray-800">{{ r.userName || 'User' }}</h3>
                  <span class="text-sm text-gray-500">{{ toDate(r.createdAt) | date:'mediumDate' }}</span>
                </div>

                <!-- VIEW MODE -->
                @if (editingId() !== r.id) {
                  <div class="flex items-center mb-3">
                    <div class="flex">
                      @for (s of [1,2,3,4,5]; track s) {
                        <svg class="w-4 h-4"
                             [class.text-yellow-400]="s <= (r.rating || 0)"
                             [class.text-gray-300]="s > (r.rating || 0)"
                             fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                        </svg>
                      }
                    </div>
                  </div>

                  <p class="text-gray-700 mb-3 whitespace-pre-line">{{ r.comment }}</p>

                  @if (isOwner(r.userId)) {
                    <div class="flex gap-3">
                      <button class="px-3 py-1.5 rounded bg-gray-100 hover:bg-gray-200 text-gray-800 text-sm"
                              (click)="startEdit(r)">Edit</button>
                      <button class="px-3 py-1.5 rounded bg-red-600 hover:bg-red-700 text-white text-sm"
                              [disabled]="busyId() === r.id"
                              (click)="remove(r)">Delete</button>
                    </div>
                  }
                }

                <!-- EDIT MODE -->
                @if (editingId() === r.id) {
                  <form [formGroup]="editForm" (ngSubmit)="save(r)" class="rounded border p-4 bg-gray-50">
                    <div class="mb-3">
                      <label class="block text-sm text-gray-700 mb-2">Your Rating</label>
                      <div class="flex items-center gap-1">
                        @for (s of stars; track s) {
                          <button type="button" class="p-1"
                                  (click)="setEditRating(s)"
                                  [attr.aria-pressed]="editForm.value.rating === s">
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
                      <textarea rows="3" formControlName="comment"
                                class="w-full rounded border px-3 py-2 text-sm"
                                placeholder="Update your review..."></textarea>
                      @if (editForm.controls.comment.invalid && (editForm.controls.comment.touched || editForm.controls.comment.dirty)) {
                        <p class="mt-2 text-sm text-red-600">Max 1000 characters.</p>
                      }
                    </div>

                    <div class="flex gap-3 justify-end">
                      <button type="button" class="px-3 py-1.5 rounded border" (click)="cancelEdit()">Cancel</button>
                      <button type="submit"
                              class="px-3 py-1.5 rounded bg-emerald-600 text-white"
                              [disabled]="editForm.invalid || busyId() === r.id">
                        {{ busyId() === r.id ? 'Saving…' : 'Save' }}
                      </button>
                    </div>
                  </form>
                }
              </div>
            </div>
          </div>
        }
      </div>
    }
  </div>
  `
})
export class ReviewsListComponent {
  private reviewService = inject(ReviewService);
  private auth = inject(AuthService);
  private fb = inject(FormBuilder);

  bookId = input.required<string>();

  reviews = toSignal(
    toObservable(this.bookId).pipe(
      switchMap(id => id ? this.reviewService.getReviewsForBook(id) : of<Review[]>([]))
    ),
    { initialValue: [] as Review[] }
  );

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
    this.busyId.set(r.id!);
    try {
      await this.reviewService.updateReview(this.bookId(), r.id!, {
        rating: this.editForm.value.rating!,
        comment: this.editForm.value.comment || ''
      });
      this.cancelEdit();
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
    } catch (e) {
      console.error('Delete review error:', e);
    } finally {
      this.busyId.set(null);
    }
  }

  toDate(value: Timestamp | FieldValue | Date | undefined): Date | null {
    if (!value) return null;
    if (value instanceof Date) return value;
    if (typeof (value as any).toDate === 'function') {
      return (value as any).toDate();
    }
    return null;
  }

  noop() {}
}