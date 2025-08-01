import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

@Component({
  selector: 'app-create-book',
  imports: [CommonModule],
  templateUrl: './create-book.component.html',
})
export class CreateBookComponent {
  bookForm = {
    title: '',
    author: '',
    genre: '',
    description: '',
    publishedYear: '',
    pages: '',
    coverImage: null as File | null
  };

  genres = [
    'Fiction',
    'Non-Fiction',
    'Mystery',
    'Romance',
    'Science Fiction',
    'Fantasy',
    'Biography',
    'History',
    'Self-Help',
    'Poetry'
  ];

  onSubmit() {
    // Handle book creation logic here
    console.log('Book form submitted', this.bookForm);
  }

  onCancel() {
    // Handle cancel logic here
    console.log('Form cancelled');
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.bookForm.coverImage = file;
    }
  }
} 