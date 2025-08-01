import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-review-card',
  imports: [CommonModule],
  templateUrl: './review-card.component.html',
})
export class ReviewCardComponent {
  @Input() review = {
    id: 1,
    username: 'Sarah Johnson',
    avatar: 'assets/images/avatar1.jpg',
    rating: 5,
    comment: 'A masterpiece of American literature. Fitzgerald\'s prose is absolutely beautiful and the story is timeless.',
    date: '2024-01-15'
  };
} 