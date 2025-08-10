import { DocumentData } from '@angular/fire/firestore';
import { Book } from './book.model';

export interface BookQuery {
  genre?: string;
  search?: string;
  pageSize?: number;
  cursor?: DocumentData | null;
}

export interface BookPage<T = Book> {
  items: T[];
  nextCursor: DocumentData | null;
}