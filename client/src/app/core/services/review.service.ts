import { Injectable } from '@angular/core';
import {
  Firestore, collection, doc, addDoc, updateDoc, deleteDoc,
  CollectionReference, collectionData, query, orderBy, serverTimestamp
} from '@angular/fire/firestore';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Review } from '../models';

@Injectable({ providedIn: 'root' })
export class ReviewService {
  constructor(private firestore: Firestore) {}

  private bookReviewsRef(bookId: string): CollectionReference<Review> {
    return collection(this.firestore, `books/${bookId}/reviews`) as CollectionReference<Review>;
  }

  getReviewsForBook(bookId: string): Observable<Review[]> {
    const q = query(this.bookReviewsRef(bookId), orderBy('createdAt', 'desc'));
    return collectionData(q, { idField: 'id' }).pipe(
      catchError(err => throwError(() => new Error(`Error loading reviews: ${err.message}`)))
    ) as Observable<Review[]>;
  }

  async addReview(bookId: string, review: Omit<Review, 'id' | 'createdAt'>): Promise<string> {
    const ref = await addDoc(this.bookReviewsRef(bookId), {
      ...review,
      createdAt: serverTimestamp() as any,
    } as Review);
    return ref.id;
  }

  async updateReview(bookId: string, reviewId: string, data: Partial<Review>): Promise<void> {
    const reviewDoc = doc(this.firestore, `books/${bookId}/reviews/${reviewId}`);
    await updateDoc(reviewDoc, data as any);
  }

  async deleteReview(bookId: string, reviewId: string): Promise<void> {
    const reviewDoc = doc(this.firestore, `books/${bookId}/reviews/${reviewId}`);
    await deleteDoc(reviewDoc);
  }
}