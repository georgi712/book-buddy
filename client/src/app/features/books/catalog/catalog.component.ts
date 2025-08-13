// catalog.component.ts
import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { BookService } from '../../../core/services/book.service';
import { Book } from '../../../core/models';

@Component({
  selector: 'app-catalog',
  
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './catalog.component.html',
})
export class CatalogComponent {
  private bookService = inject(BookService);

  genres = ['All','Fiction','Non-Fiction','Mystery','Romance','Science Fiction','Fantasy','Biography','History','Self-Help','Poetry'];
  searchCtrl = new FormControl<string>('', { nonNullable: true });
  genreCtrl  = new FormControl<string>('All', { nonNullable: true });

  pageSize   = signal(10);
  pageIndex  = signal(0); 
  items   = signal<Book[]>([]);
  loading = signal(false);
  error   = signal<string | null>(null);

  private pageCursors: any[] = [null];     // cursor to fetch page i (page 0 uses null)
  private nextCursorCache: any[] = [];     // next cursor returned after fetching page i

  isFirstPage  = computed(() => this.pageIndex() === 0);
  hasNextPage  = computed(() => !!this.nextCursorCache[this.pageIndex()]);
  pageDisplay  = computed(() => this.pageIndex() + 1); // for "Page X"

  constructor() {
    this.searchCtrl.valueChanges.pipe(debounceTime(250), distinctUntilChanged()).subscribe(() => this.resetAndLoad());
    this.genreCtrl.valueChanges.subscribe(() => this.resetAndLoad());
    this.resetAndLoad();
  }

  private async resetAndLoad() {
    this.pageIndex.set(0);
    this.pageCursors = [null];
    this.nextCursorCache = [];
    await this.loadPageAt(0);
  }

  async loadPageAt(index: number) {
    this.loading.set(true);
    this.error.set(null);

    try {
      const cursor = this.pageCursors[index] ?? null;
      const { items, nextCursor } = await this.bookService.queryBooks({
        genre: this.genreCtrl.value,
        search: this.searchCtrl.value,
        pageSize: this.pageSize(),
        cursor
      });

      this.items.set(items);
      this.pageIndex.set(index);

      this.nextCursorCache[index] = nextCursor ?? null;

      
      this.pageCursors[index + 1] = nextCursor ?? null;
    } catch (e: any) {
      this.error.set(e?.message || 'Failed to load books');
    } finally {
      this.loading.set(false);
    }
  }

  next() {
    if (!this.hasNextPage()) return;
    const i = this.pageIndex();
    this.loadPageAt(i + 1);
  }

  prev() {
    const i = this.pageIndex();
    if (i === 0) return;
    this.loadPageAt(i - 1);
  }

  starsArray(rating: number): ('full' | 'half' | 'empty')[] {
    const stars: ('full' | 'half' | 'empty')[] = [];
    const rounded = Math.floor(rating * 2) / 2;
    
    for (let i = 1; i <= 5; i++) {
      if (rounded >= i) {
        stars.push('full');
      } else if (rounded + 0.5 >= i && rounded < i) {
        stars.push('half');
      } else {
        stars.push('empty');
      }
    }
    
    return stars;
  }
}