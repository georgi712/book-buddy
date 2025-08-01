import { Component } from '@angular/core';

@Component({
  selector: 'app-review-form',
  templateUrl: './review-form.component.html',
})
export class ReviewFormComponent {
  reviewForm = {
    rating: 0,
    comment: ''
  };

  onSubmit() {
    // Handle review submission logic here
    console.log('Review form submitted', this.reviewForm);
  }

  setRating(rating: number) {
    this.reviewForm.rating = rating;
  }
} 