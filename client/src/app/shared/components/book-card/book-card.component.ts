import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-book-card',
  imports: [CommonModule],
  templateUrl: './book-card.component.html',
})
export class BookCardComponent {
  @Input() book = {
    id: 1,
    title: 'The Great Gatsby',
    author: 'F. Scott Fitzgerald',
    cover: 'assets/images/book1.jpg',
    rating: 4.5
  };

  onViewDetails() {
    console.log('View details for book:', this.book.id);
  }
} 