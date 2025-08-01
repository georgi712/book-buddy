import { Component } from '@angular/core';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent {
  featuredBooks = [
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
    }
  ];
} 