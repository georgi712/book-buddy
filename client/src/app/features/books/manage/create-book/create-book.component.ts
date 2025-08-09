import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService, BookService } from '../../../../core/services';

@Component({
  selector: 'app-create-book',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './create-book.component.html',
})
export class CreateBookComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private bookService = inject(BookService);
  private router = inject(Router);

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

  isSubmitting = false;
  selectedFile: File | null = null;

  createBookForm: FormGroup = this.fb.group({
    title: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(120)]],
    author: ['', [Validators.required, Validators.maxLength(80)]],
    genre: ['', [Validators.required]],
    publishedYear: [
      '',
      [yearValidator(1800, new Date().getFullYear())]
    ],
    pages: [
      '',
      [pagesValidator(1, 10000)]
    ],
    description: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(1500)]],
    featured: [false],
    coverImage: [null, [fileRequiredValidator]]
  });

  get title(): AbstractControl | null { return this.createBookForm.get('title'); }
  get author(): AbstractControl | null { return this.createBookForm.get('author'); }
  get genre(): AbstractControl | null { return this.createBookForm.get('genre'); }
  get publishedYear(): AbstractControl | null { return this.createBookForm.get('publishedYear'); }
  get pages(): AbstractControl | null { return this.createBookForm.get('pages'); }
  get description(): AbstractControl | null { return this.createBookForm.get('description'); }
  get featured(): AbstractControl | null { return this.createBookForm.get('featured'); }
  get coverImage(): AbstractControl | null { return this.createBookForm.get('coverImage'); }

  get isTitleInvalid(): boolean { return !!(this.title?.invalid && (this.title?.dirty || this.title?.touched)); }
  get isAuthorInvalid(): boolean { return !!(this.author?.invalid && (this.author?.dirty || this.author?.touched)); }
  get isGenreInvalid(): boolean { return !!(this.genre?.invalid && (this.genre?.dirty || this.genre?.touched)); }
  get isYearInvalid(): boolean { return !!(this.publishedYear?.invalid && (this.publishedYear?.dirty || this.publishedYear?.touched)); }
  get isPagesInvalid(): boolean { return !!(this.pages?.invalid && (this.pages?.dirty || this.pages?.touched)); }
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
    if (this.publishedYear?.errors?.['yearRange']) {
      const { min, max } = this.publishedYear.errors['yearRange'];
      return `Year must be between ${min} and ${max}`;
    }
    return '';
  }

  get pagesError(): string {
    if (this.pages?.errors?.['minPages']) {
      const { min } = this.pages.errors['minPages'];
      return `Pages must be at least ${min}`;
    }
    if (this.pages?.errors?.['maxPages']) {
      const { max } = this.pages.errors['maxPages'];
      return `Pages must be at most ${max}`;
    }
    if (this.pages?.errors?.['notInteger']) return 'Pages must be a whole number';
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

  onFileChange(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] || null;
    this.selectedFile = file;
    this.coverImage?.setValue(file);
    this.coverImage?.markAsDirty();
    this.coverImage?.markAsTouched();
    this.coverImage?.updateValueAndValidity();
  }

  async onSubmit(): Promise<void> {
    if (this.createBookForm.invalid || !this.selectedFile) {
      this.markFormGroupTouched();
      return;
    }

    const me = this.authService.user();
    if (!me?.id) {
      console.error('You must be logged in');
      return;
    }

    this.isSubmitting = true;
    try {
      const { coverImage, ...data } = this.createBookForm.value;

      const newId = await this.bookService.createBook(
        me.id,
        {
          title: data.title,
          author: data.author,
          description: data.description,
          genre: data.genre,
          publishedYear: data.publishedYear || null,
          pages: data.pages || null,
          featured: !!data.featured
        } as any,
        this.selectedFile
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
  if (!file) return { fileRequired: true };
  return null;
}