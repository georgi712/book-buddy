// features/books/details/reviews/reviews-form.component.ts
import { Component, EventEmitter, Input, Output, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { AuthService, ReviewService } from '../../../../../core/services';

@Component({
  selector: 'app-review-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
  <div class="w-full max-w-xl">
    <!-- Toggle button -->
    <button
      (click)="toggle()"
      class="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold
             bg-emerald-600 text-white hover:bg-emerald-700 transition focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
    >
      <svg class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
        <path d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"/>
      </svg>
      {{ open ? 'Close' : 'Add Review' }}
    </button>

    <!-- Card -->
    @if (open) {
      <form
        [formGroup]="form"
        (ngSubmit)="submit()"
        class="mt-4 rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
      >
        <!-- Rating -->
        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-700 mb-2">Your Rating</label>
          <div class="flex items-center gap-1">
            @for (s of stars; track s) {
              <button
                type="button"
                (click)="setRating(s)"
                (keydown.enter)="setRating(s)"
                [attr.aria-pressed]="form.value.rating === s"
                class="p-1 rounded focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-400"
              >
                <svg
                  class="h-6 w-6 transition"
                  [ngClass]="ratingValue >= s ? 'text-amber-400' : 'text-gray-300'"
                  viewBox="0 0 20 20" fill="currentColor"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                </svg>
              </button>
            }
          </div>
          @if (form.controls.rating.invalid && (form.controls.rating.dirty || form.controls.rating.touched)) {
            <p class="mt-2 text-sm text-red-600">Please choose a rating from 1 to 5.</p>
          }
        </div>

        <!-- Comment -->
        <div class="mb-1">
          <label class="block text-sm font-medium text-gray-700 mb-2">Comment</label>
          <textarea
            rows="4"
            formControlName="comment"
            class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm placeholder-gray-400
                   focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            placeholder="Share your thoughts…"
          ></textarea>
        </div>
        <div class="mb-4 flex items-center justify-between text-xs text-gray-500">
          <span>Optional, up to 1000 characters.</span>
          <span [class.text-red-600]="remaining() < 0">{{ remaining() }} left</span>
        </div>
        @if (form.controls.comment.invalid && (form.controls.comment.dirty || form.controls.comment.touched)) {
          <p class="mt-1 text-sm text-red-600">Comment is too long (max 1000 characters).</p>
        }

        <!-- Actions -->
        <div class="mt-5 flex items-center justify-end gap-3">
          <button
            type="button"
            (click)="toggle(false)"
            class="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700
                   hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-300"
          >
            Cancel
          </button>

          <button
            type="submit"
            [disabled]="form.invalid || loading || remaining() < 0"
            class="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white
                   hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500
                   disabled:opacity-50 disabled:cursor-not-allowed"
          >
            @if (loading) {
              <svg class="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
              </svg>
              Saving…
            } @else { Save Review }
          </button>
        </div>
      </form>
    }
  </div>
  `
})
export class ReviewFormComponent {
  @Input({ required: true }) bookId!: string;
  @Output() submitted = new EventEmitter<void>();

  private fb = inject(FormBuilder);
  private reviewService = inject(ReviewService);
  private auth = inject(AuthService);

  open = false;
  loading = false;

  stars = [1, 2, 3, 4, 5];

  form = this.fb.group({
    rating: [5, [Validators.required, Validators.min(1), Validators.max(5)]],
    comment: ['', [Validators.maxLength(1000)]],
  });

  remaining = computed(() => 1000 - (this.form.value.comment?.length ?? 0));

  toggle(force?: boolean) {
    this.open = force ?? !this.open;
  }

  setRating(v: number) {
    this.form.controls.rating.setValue(v);
    this.form.controls.rating.markAsDirty();
  }

  get ratingValue(): number {
    return this.form.controls.rating.value ?? 0;
  }

  async submit() {
    if (this.form.invalid || this.remaining() < 0) return;

    const me = this.auth.user();
    if (!me?.id) return;

    this.loading = true;
    try {
      await this.reviewService.addReview(this.bookId, {
        userId: me.id,
        userName: me.displayName,
        userPhoto: me.imageUrl,
        rating: Number(this.form.value.rating),
        comment: this.form.value.comment || ''
      } as any);

      this.submitted.emit();
      this.toggle(false);
      this.form.reset({ rating: 5, comment: '' });
    } catch (e) {
      console.error('Add review error:', e);
    } finally {
      this.loading = false;
    }
  }
}