import { Component, EventEmitter, Input, Output, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { AuthService, ReviewService } from '../../../../../core/services';

@Component({
  selector: 'app-review-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
  <form [formGroup]="form" (ngSubmit)="submit()"
        class="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
    <!-- Rating -->
    <div class="mb-4">
      <label class="block text-sm font-medium text-gray-700 mb-2">Your Rating</label>
      <div class="flex items-center gap-1">
        @for (s of stars; track s) {
          <button type="button"
                  (click)="setRating(s)"
                  class="p-1">
            <svg class="h-6 w-6"
                 [ngClass]="ratingValue >= s ? 'text-amber-400' : 'text-gray-300'"
                 viewBox="0 0 20 20" fill="currentColor">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
            </svg>
          </button>
        }
      </div>
    </div>

    <!-- Comment -->
    <div class="mb-4">
      <label class="block text-sm font-medium text-gray-700 mb-2">Comment</label>
      <textarea formControlName="comment"
                rows="4"
                class="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="Share your thoughts…"></textarea>
      @if (form.controls.comment.invalid && (form.controls.comment.dirty || form.controls.comment.touched)) {
        <p class="mt-2 text-sm text-red-600">Max 1000 characters.</p>
      }
    </div>

    <!-- Actions -->
    <div class="flex justify-end gap-3">
      <button type="submit"
              [disabled]="form.invalid || loading"
              class="px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 disabled:opacity-50">
        {{ loading ? 'Saving…' : 'Save Review' }}
      </button>
    </div>
  </form>
  `
})
export class ReviewFormComponent {
  @Input({ required: true }) bookId!: string;
  @Output() submitted = new EventEmitter<void>();

  private fb = inject(FormBuilder);
  private reviewService = inject(ReviewService);
  private auth = inject(AuthService);

  loading = false;
  stars = [1, 2, 3, 4, 5];

  form = this.fb.group({
    rating: [5, [Validators.required, Validators.min(1), Validators.max(5)]],
    comment: ['', [Validators.maxLength(1000)]],
  });

  get ratingValue() { return this.form.value.rating ?? 0; }

  setRating(v: number) {
    this.form.controls.rating.setValue(v);
    this.form.controls.rating.markAsDirty();
  }

  async submit() {
    if (this.form.invalid) return;
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
      this.form.reset({ rating: 5, comment: '' });
    } finally {
      this.loading = false;
    }
  }
}