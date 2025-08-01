import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

@Component({
  selector: 'app-my-books',
  imports: [CommonModule],
  templateUrl: './my-books.component.html',
  styleUrls: ['./my-books.component.css']
})
export class MyBooksComponent {
  myBooks = [
    {
      id: 1,
      title: 'The Great Gatsby',
      author: 'F. Scott Fitzgerald',
      cover: 'assets/images/book1.jpg',
      rating: 4.5,
      status: 'Read',
      dateAdded: '2024-01-15'
    },
    {
      id: 2,
      title: 'To Kill a Mockingbird',
      author: 'Harper Lee',
      cover: 'assets/images/book2.jpg',
      rating: 4.8,
      status: 'Reading',
      dateAdded: '2024-01-10'
    },
    {
      id: 3,
      title: '1984',
      author: 'George Orwell',
      cover: 'assets/images/book3.jpg',
      rating: 4.3,
      status: 'Want to Read',
      dateAdded: '2024-01-05'
    },
    {
      id: 4,
      title: 'Pride and Prejudice',
      author: 'Jane Austen',
      cover: 'assets/images/book4.jpg',
      rating: 4.6,
      status: 'Read',
      dateAdded: '2023-12-20'
    }
  ];

  onEdit(bookId: number) {
    console.log('Edit book:', bookId);
  }

  onDelete(bookId: number) {
    console.log('Delete book:', bookId);
  }
} 