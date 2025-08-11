import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
  FormBuilder, FormGroup, ReactiveFormsModule,
  Validators, AbstractControl, ValidationErrors
} from '@angular/forms';
import { AuthService, BookService } from '../../../../core/services';
import { Book } from '../../../../core/models';
import { ImageUploadComponent } from '../../../../shared/components/image-upload/image-upload.component';

@Component({
  selector: 'app-edit-book',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ImageUploadComponent],
  templateUrl: './edit-book.component.html',
})
export class EditBookComponent {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private auth = inject(AuthService);
  private books = inject(BookService);

  genres = [
    'Fiction','Non-Fiction','Mystery','Romance','Science Fiction',
    'Fantasy','Biography','History','Self-Help','Poetry'
  ];

  isSubmitting = false;
  bookId = this.route.snapshot.paramMap.get('id') ?? '';
  currentBook: Book | null = null;

  previewUrl = signal<string | null>(null);

  editBookForm: FormGroup = this.fb.group({
    title: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(120)]],
    author: ['', [Validators.required, Validators.maxLength(80)]],
    genre: ['', [Validators.required]],
    published: ['', [yearValidator(1800, new Date().getFullYear())]],
    numberOfPages: ['', [pagesValidator(1, 10000)]],
    description: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(1500)]],
    featured: [false],
    coverImage: [null] // optional on edit
  });

  get title(): AbstractControl | null { return this.editBookForm.get('title'); }
  get author(): AbstractControl | null { return this.editBookForm.get('author'); }
  get genre(): AbstractControl | null { return this.editBookForm.get('genre'); }
  get published(): AbstractControl | null { return this.editBookForm.get('publishedYear'); }
  get numberOfPages(): AbstractControl | null { return this.editBookForm.get('pages'); }
  get description(): AbstractControl | null { return this.editBookForm.get('description'); }
  get featured(): AbstractControl | null { return this.editBookForm.get('featured'); }
  get coverImage(): AbstractControl | null { return this.editBookForm.get('coverImage'); }

  get isTitleInvalid(): boolean { return !!(this.title?.invalid && (this.title?.dirty || this.title?.touched)); }
  get isAuthorInvalid(): boolean { return !!(this.author?.invalid && (this.author?.dirty || this.author?.touched)); }
  get isGenreInvalid(): boolean { return !!(this.genre?.invalid && (this.genre?.dirty || this.genre?.touched)); }
  get isYearInvalid(): boolean { return !!(this.published?.invalid && (this.published?.dirty || this.published?.touched)); }
  get isPagesInvalid(): boolean { return !!(this.numberOfPages?.invalid && (this.numberOfPages?.dirty || this.numberOfPages?.touched)); }
  get isDescriptionInvalid(): boolean { return !!(this.description?.invalid && (this.description?.dirty || this.description?.touched)); }

  get titleError(): string {
    if (this.title?.errors?.['required']) return 'Title is required';
    if (this.title?.errors?.['minlength']) return 'Title must be at least 2 characters';
    if (this.title?.errors?.['maxlength']) return 'Title must be at most 120 characters';
    return '';
  }
  get authorError(): string {
    if (this.author?.errors?.['required']) return 'Author is required';
    if (this.author?.errors?.['maxlength']) return 'Author must be at most 80 characters';
    return '';
  }
  get genreError(): string {
    if (this.genre?.errors?.['required']) return 'Genre is required';
    return '';
  }
  get yearError(): string {
    if (this.published?.errors?.['yearRange']) {
      const { min, max } = this.published.errors['yearRange'];
      return `Year must be between ${min} and ${max}`;
    }
    return '';
  }
  get pagesError(): string {
    if (this.numberOfPages?.errors?.['minPages']) return `Pages must be at least ${this.numberOfPages.errors['minPages'].min}`;
    if (this.numberOfPages?.errors?.['maxPages']) return `Pages must be at most ${this.numberOfPages.errors['maxPages'].max}`;
    if (this.numberOfPages?.errors?.['notInteger']) return 'Pages must be a whole number';
    return '';
  }
  get descriptionError(): string {
    if (this.description?.errors?.['required']) return 'Description is required';
    if (this.description?.errors?.['minlength']) return 'Description must be at least 10 characters';
    if (this.description?.errors?.['maxlength']) return 'Description must be at most 1500 characters';
    return '';
  }

  constructor() {
    if (!this.bookId) {
      this.router.navigate(['/books']);
      return;
    }

    this.books.getBookById(this.bookId).subscribe({
      next: (b) => {
        if (!b) { this.router.navigate(['/books']); return; }
        this.currentBook = b;
        this.editBookForm.patchValue({
          title: b.title,
          author: b.author,
          genre: b.genre,
          published: b.published ?? '',
          numberOfPages: b.numberOfPages ?? '',
          description: b.description,
          featured: !!b.featured,
          coverImage: null
        });
        this.previewUrl.set(b.imageUrl || null);

        const me = this.auth.user();
        if (me?.id && b.userId && me.id !== b.userId) {
          this.router.navigate(['/books/details', this.bookId]);
        }
      },
      error: () => this.router.navigate(['/books'])
    });
  }

  async onSubmit(): Promise<void> {
    if (this.editBookForm.invalid || !this.currentBook) {
      this.markFormGroupTouched();
      return;
    }
  
    const me = this.auth.user();
    if (!me?.id) return;
  
    const value = this.editBookForm.value;
    const newFile = value.coverImage as File | null;
  
    const patch: Partial<Book> = {
      title: value.title,
      titleLower: value.title?.toLowerCase?.() ?? '',
      author: value.author,
      description: value.description,
      genre: value.genre,
      published: value.published || null,
      numberOfPages: value.numberOfPages || null,
      featured: !!value.featured,
      userId: this.currentBook.userId,
      imagePath: this.currentBook.imagePath,
    };
  
    this.isSubmitting = true;
    try {
      await this.books.updateBook(
        this.bookId,         
        me.id,               
        patch,               
        newFile || undefined 
      );
      this.router.navigate(['/books/details', this.bookId]);
    } catch (err: any) {
      console.error('Update book error:', err?.message || err);
    } finally {
      this.isSubmitting = false;
    }
  }

  onCancel(): void {
    if (this.bookId) this.router.navigate(['/books/details', this.bookId]);
    else this.router.navigate(['/books']);
  }

  private markFormGroupTouched(): void {
    Object.keys(this.editBookForm.controls).forEach(key => {
      const c = this.editBookForm.get(key);
      c?.markAsTouched();
      c?.markAsDirty();
    });
  }
}

export function yearValidator(min: number, max: number) {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;
    if (value === null || value === '' || value === undefined) return null;
    const year = Number(value);
    if (Number.isNaN(year)) return { yearRange: { min, max } };
    if (year < min || year > max) return { yearRange: { min, max } };
    return null;
  };
}

export function pagesValidator(min: number, max: number) {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;
    if (value === null || value === '' || value === undefined) return null;
    const n = Number(value);
    if (!Number.isInteger(n)) return { notInteger: true };
    if (n < min) return { minPages: { min } };
    if (n > max) return { maxPages: { max } };
    return null;
  };
}