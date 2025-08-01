import { Component } from '@angular/core';

@Component({
  selector: 'app-catalog',
  templateUrl: './catalog.component.html',
})
export class CatalogComponent {
  books = [
    {
      id: 1,
      title: 'The Great Gatsby',
      author: 'F. Scott Fitzgerald',
      cover: 'assets/images/book1.jpg',
      rating: 4.5
    },
    {
      id: 2,
      title: 'To Kill a Mockingbird',
      author: 'Harper Lee',
      cover: 'assets/images/book2.jpg',
      rating: 4.8
    },
    {
      id: 3,
      title: '1984',
      author: 'George Orwell',
      cover: 'assets/images/book3.jpg',
      rating: 4.3
    },
    {
      id: 4,
      title: 'Pride and Prejudice',
      author: 'Jane Austen',
      cover: 'assets/images/book4.jpg',
      rating: 4.6
    },
    {
      id: 5,
      title: 'The Hobbit',
      author: 'J.R.R. Tolkien',
      cover: 'assets/images/book5.jpg',
      rating: 4.7
    },
    {
      id: 6,
      title: 'The Catcher in the Rye',
      author: 'J.D. Salinger',
      cover: 'assets/images/book6.jpg',
      rating: 4.2
    }
  ];
} 