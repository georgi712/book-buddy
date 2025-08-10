import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { BookService } from '../../../core/services/book.service';
import { Book } from '../../../core/models';

@Component({
  selector: 'app-catalog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './catalog.component.html',
})
export class CatalogComponent {
  private bookService = inject(BookService);

  genres = ['All','Fiction','Non-Fiction','Mystery','Romance','Science Fiction','Fantasy','Biography','History','Self-Help','Poetry'];
  searchCtrl = new FormControl<string>('', { nonNullable: true });
  genreCtrl = new FormControl<string>('All', { nonNullable: true });

  pageSize = signal(12);
  items = signal<Book[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);

  private cursorStack: any[] = []; 
  private currentCursor: any = null; 
  private nextCursor: any = null;    

  isFirstPage = computed(() => this.cursorStack.length === 0);
  hasNextPage = computed(() => !!this.nextCursor);

  constructor() {
    this.searchCtrl.valueChanges.pipe(debounceTime(250), distinctUntilChanged()).subscribe(() => this.resetAndLoad());
    this.genreCtrl.valueChanges.subscribe(() => this.resetAndLoad());

    this.resetAndLoad();
  }

  private async resetAndLoad() {
    this.cursorStack = [];
    this.currentCursor = null;
    await this.loadPage('reset');
  }

  async loadPage(direction: 'reset' | 'next' | 'prev' = 'reset') {
    this.loading.set(true);
    this.error.set(null);

    try {
      if (direction === 'next' && this.nextCursor) {
        if (this.currentCursor) this.cursorStack.push(this.currentCursor);
        this.currentCursor = this.nextCursor;
      }

      if (direction === 'prev' && this.cursorStack.length > 0) {
        this.currentCursor = this.cursorStack.pop();
      }

      const { items, nextCursor } = await this.bookService.queryBooks({
        genre: this.genreCtrl.value,
        search: this.searchCtrl.value,
        pageSize: this.pageSize(),
        cursor: this.currentCursor
      });

      this.items.set(items);
      this.nextCursor = nextCursor ?? null;
    } catch (e: any) {
      this.error.set(e?.message || 'Failed to load books');
    } finally {
      this.loading.set(false);
    }
  }

  next() { if (this.hasNextPage()) this.loadPage('next'); }
  prev() { if (!this.isFirstPage()) this.loadPage('prev'); }

  starsArray(n: number = 0) {
    const rating = Math.max(0, Math.min(5, Math.round(n)));
    return Array(5).fill(0).map((_, i) => i < rating);
  }
}