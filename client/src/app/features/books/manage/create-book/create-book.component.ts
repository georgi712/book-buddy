import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder, FormGroup, ReactiveFormsModule,
  Validators, AbstractControl, ValidationErrors
} from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService, BookService } from '../../../../core/services';
import { ImageUploadComponent } from '../../../../shared/components/image-upload/image-upload.component';
import { serverTimestamp } from '@angular/fire/firestore';

@Component({
  selector: 'app-create-book',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ImageUploadComponent],
  templateUrl: './create-book.component.html',
})
export class CreateBookComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private bookService = inject(BookService);
  private router = inject(Router);

  genres = [
    'Fiction','Non-Fiction','Mystery','Romance','Science Fiction',
    'Fantasy','Biography','History','Self-Help','Poetry'
  ];

  isSubmitting = false;

  createBookForm: FormGroup = this.fb.group({
    title: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(120)]],
    author: ['', [Validators.required, Validators.maxLength(80)]],
    genre: ['', [Validators.required]],
    published: ['', [yearValidator(1800, new Date().getFullYear())]],
    numberOfPages: ['', [pagesValidator(1, 10000)]],
    description: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(1500)]],
    featured: [false],
    coverImage: [null, [fileRequiredValidator]] // now provided by <app-image-upload>
  });

  // getters
  get title(): AbstractControl | null { return this.createBookForm.get('title'); }
  get author(): AbstractControl | null { return this.createBookForm.get('author'); }
  get genre(): AbstractControl | null { return this.createBookForm.get('genre'); }
  get published(): AbstractControl | null { return this.createBookForm.get('publishedYear'); }
  get numberOfPages(): AbstractControl | null { return this.createBookForm.get('pages'); }
  get description(): AbstractControl | null { return this.createBookForm.get('description'); }
  get featured(): AbstractControl | null { return this.createBookForm.get('featured'); }
  get coverImage(): AbstractControl | null { return this.createBookForm.get('coverImage'); }

  get isTitleInvalid(): boolean { return !!(this.title?.invalid && (this.title?.dirty || this.title?.touched)); }
  get isAuthorInvalid(): boolean { return !!(this.author?.invalid && (this.author?.dirty || this.author?.touched)); }
  get isGenreInvalid(): boolean { return !!(this.genre?.invalid && (this.genre?.dirty || this.genre?.touched)); }
  get isYearInvalid(): boolean { return !!(this.published?.invalid && (this.published?.dirty || this.published?.touched)); }
  get isPagesInvalid(): boolean { return !!(this.numberOfPages?.invalid && (this.numberOfPages?.dirty || this.numberOfPages?.touched)); }
  get isDescriptionInvalid(): boolean { return !!(this.description?.invalid && (this.description?.dirty || this.description?.touched)); }
  get isCoverInvalid(): boolean { return !!(this.coverImage?.invalid && (this.coverImage?.dirty || this.coverImage?.touched)); }

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
  get coverError(): string {
    if (this.coverImage?.errors?.['fileRequired']) return 'Cover image is required';
    return '';
  }

  async onSubmit(): Promise<void> {
    if (this.createBookForm.invalid) {
      this.markFormGroupTouched();
      return;
    }

    const me = this.authService.user();
    if (!me?.id) {
      console.error('You must be logged in');
      return;
    }

    const { coverImage, ...data } = this.createBookForm.value;
    const file = coverImage as File | null;
    if (!file) { 
      this.coverImage?.setErrors({ fileRequired: true });
      return;
    }

    this.isSubmitting = true;
    try {
      const newId = await this.bookService.createBook(
        me.id,
        {
          title: data.title,
          author: data.author,
          description: data.description,
          genre: data.genre,
          publishedYear: data.publishedYear || null,
          pages: data.pages || null,
          featured: !!data.featured,
          titleLower: data.title.toLowerCase(),
          createdAt: serverTimestamp(),
        } as any,
        file
      );
      this.createBookForm.reset();
      this.router.navigate(['/books/details', newId]);
    } catch (err: any) {
      console.error('Create book error:', err?.message || err);
    } finally {
      this.isSubmitting = false;
    }
  }

  onCancel(): void {
    this.router.navigate(['/books']);
  }

  private markFormGroupTouched(): void {
    Object.keys(this.createBookForm.controls).forEach(key => {
      const control = this.createBookForm.get(key);
      control?.markAsTouched();
      control?.markAsDirty();
    });
  }
}

// validators
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
export function fileRequiredValidator(control: AbstractControl): ValidationErrors | null {
  const file = control.value as File | null;
  return file ? null : { fileRequired: true };
}