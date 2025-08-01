import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

@Component({
  imports:[CommonModule],
  selector: 'app-book-details',
  templateUrl: './book-details.component.html',
})
export class BookDetailsComponent {
  book = {
    id: 1,
    title: 'The Great Gatsby',
    author: 'F. Scott Fitzgerald',
    cover: 'assets/images/book1.jpg',
    description: 'Set in the Jazz Age on Long Island, near New York City, the novel depicts first-person narrator Nick Carraway\'s interactions with mysterious millionaire Jay Gatsby and Gatsby\'s obsession to reunite with his former lover, the beautiful former debutante Daisy Buchanan.',
    rating: 4.5,
    genre: 'Fiction',
    publishedYear: 1925,
    pages: 180
  };

  reviews = [
    {
      id: 1,
      username: 'Sarah Johnson',
      avatar: 'assets/images/avatar1.jpg',
      rating: 5,
      comment: 'A masterpiece of American literature. Fitzgerald\'s prose is absolutely beautiful and the story is timeless.',
      date: '2024-01-15'
    },
    {
      id: 2,
      username: 'Mike Chen',
      avatar: 'assets/images/avatar2.jpg',
      rating: 4,
      comment: 'Great book with complex characters. The symbolism throughout is really well done.',
      date: '2024-01-10'
    },
    {
      id: 3,
      username: 'Emma Davis',
      avatar: 'assets/images/avatar3.jpg',
      rating: 5,
      comment: 'One of my all-time favorites. The way Fitzgerald captures the American Dream is brilliant.',
      date: '2024-01-05'
    }
  ];
} 