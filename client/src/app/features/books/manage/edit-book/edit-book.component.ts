import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

@Component({
  selector: 'app-edit-book',
  imports: [CommonModule],
  templateUrl: './edit-book.component.html',
})
export class EditBookComponent {
  bookForm = {
    title: 'The Great Gatsby',
    author: 'F. Scott Fitzgerald',
    genre: 'Fiction',
    description: 'Set in the Jazz Age on Long Island, near New York City, the novel depicts first-person narrator Nick Carraway\'s interactions with mysterious millionaire Jay Gatsby and Gatsby\'s obsession to reunite with his former lover, the beautiful former debutante Daisy Buchanan.',
    publishedYear: '1925',
    pages: '180',
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
    // Handle book update logic here
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