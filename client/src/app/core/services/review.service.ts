import { Injectable } from '@angular/core';
import { collectionData, Firestore, collection, doc, addDoc, updateDoc, deleteDoc, CollectionReference } from '@angular/fire/firestore';
import { Review } from '../models';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class ReviewService {
  private reviewsRef: CollectionReference<Review>;

  constructor(private firestore: Firestore) {
    this.reviewsRef = collection(this.firestore, 'reviews') as CollectionReference<Review>;
  }

  getReviewsForBook(bookId: string): Observable<Review[]> {
    const bookReviewsRef = collection(this.firestore, `books/${bookId}/reviews`) as CollectionReference<Review>;
    return collectionData(bookReviewsRef, { idField: 'id' }).pipe(
      catchError((err) => throwError(() => new Error(`Error loading reviews: ${err.message}`)))
    );
  }

  async addReview(bookId: string, review: Review): Promise<any> {
    const bookReviewsRef = collection(this.firestore, `books/${bookId}/reviews`);
    try {
          return await addDoc(bookReviewsRef, review);
      } catch (err: any) {
          throw new Error(`Error adding review: ${err.message}`);
      }
  }

  async updateReview(bookId: string, reviewId: string, data: Partial<Review>): Promise<void> {
    const reviewDoc = doc(this.firestore, `books/${bookId}/reviews/${reviewId}`);
    try {
          return await updateDoc(reviewDoc, data);
      } catch (err: any) {
          throw new Error(`Error updating review: ${err.message}`);
      }
  }

  async deleteReview(bookId: string, reviewId: string): Promise<void> {
    const reviewDoc = doc(this.firestore, `books/${bookId}/reviews/${reviewId}`);
    try {
          return await deleteDoc(reviewDoc);
      } catch (err: any) {
          throw new Error(`Error deleting review: ${err.message}`);
      }
  }
}