// features/books/details/reviews/reviews-list.component.ts
import { Component, Input, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { ReviewFormComponent } from '../review-form/review-form.component';
import { AuthService, ReviewService } from '../../../../../core/services';
import { Review } from '../../../../../core/models';

@Component({
  selector: 'app-reviews-list',
  standalone: true,
  imports: [CommonModule, ReviewFormComponent],
  template: `
  <div class="bg-white rounded-lg shadow-lg p-8">
    <div class="flex justify-between items-center mb-6">
      <h2 class="text-2xl font-bold text-gray-800">Reviews</h2>
      @if (isLoggedIn()) {
        <app-review-form [bookId]="bookId" (submitted)="refresh()" />
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
                  <span class="text-sm text-gray-500">{{ r.createdAt?.toDate() | date:'mediumDate' }}</span>
                </div>
                <div class="flex items-center mb-3">
                  <div class="flex">
                    @for (let of [1,2,3,4,5]; track $index) {
                      <svg class="w-4 h-4" [class.text-yellow-400]="$index < (r.rating || 0)" [class.text-gray-300]="$index >= (r.rating || 0)" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                      </svg>
                    }
                  </div>
                </div>
                <p class="text-gray-700">{{ r.comment }}</p>
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

  @Input({ required: true }) bookId!: string;

  reviews = toSignal(this.reviewService.getReviewsForBook(this.bookId), { initialValue: [] as Review[] });
  isLoggedIn = computed(() => !!this.auth.user());

  refresh() {}
}