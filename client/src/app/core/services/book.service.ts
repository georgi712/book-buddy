import { Injectable } from '@angular/core';
import { collectionData, docData, Firestore, collection, doc, addDoc, updateDoc, deleteDoc, CollectionReference } from '@angular/fire/firestore';
import { Book } from '../models';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class BookService {
  private booksRef: CollectionReference<Book>;

  constructor(private firestore: Firestore) {
    this.booksRef = collection(this.firestore, 'books') as CollectionReference<Book>;
  }

  getAllBooks(): Observable<Book[]> {
    return collectionData(this.booksRef, { idField: 'id' }).pipe(
      catchError((err) => throwError(() => new Error(`Error loading books: ${err.message}`)))
    );
  }

  getBookById(id: string): Observable<Book | undefined> {
    const bookDoc = doc(this.booksRef, id);
    return docData(bookDoc, { idField: 'id' }).pipe(
      catchError((err) => throwError(() => new Error(`Error getting book: ${err.message}`)))
    );
  }

  async createBook(book: Book): Promise<any> {
    try {
          return await addDoc(this.booksRef, book);
      } catch (err: any) {
          throw new Error(`Error creating book: ${err.message}`);
      }
  }

  async updateBook(id: string, data: Partial<Book>): Promise<void> {
    const bookDoc = doc(this.booksRef, id);
    try {
          return await updateDoc(bookDoc, data);
      } catch (err: any) {
          throw new Error(`Error updating book: ${err.message}`);
      }
  }

  async deleteBook(id: string): Promise<void> {
    const bookDoc = doc(this.booksRef, id);
    try {
          return await deleteDoc(bookDoc);
      } catch (err: any) {
          throw new Error(`Error deleting book: ${err.message}`);
      }
  }
}