import { Injectable } from '@angular/core';
import {
  Firestore, collection, doc, addDoc, updateDoc, deleteDoc,
  CollectionReference, collectionData, query, orderBy, serverTimestamp,
  runTransaction,
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

  async addReview(bookId: string, review: Omit<Review, 'id' | 'createdAt'>) {
    const bookDoc = doc(this.firestore, `books/${bookId}`);
    const reviewsCol = this.bookReviewsRef(bookId);
  
    const reviewRef = await addDoc(reviewsCol, {
      ...review,
      createdAt: serverTimestamp() as any,
    } as Review);
  
    await runTransaction(this.firestore, async (tx) => {
      const snap = await tx.get(bookDoc);
      const data = snap.data() as any || {};
      const ratingCount = (data.ratingCount || 0) + 1;
      const ratingSum = (data.ratingSum || 0) + review.rating;
      const avgRating = ratingSum / ratingCount;

      tx.update(bookDoc, { ratingCount, ratingSum,  avgRating});
    });
  
    return reviewRef.id;
  }

async updateReview(
  bookId: string,
  reviewId: string,
  data: Partial<Review>
): Promise<void> {
  const bookDoc = doc(this.firestore, `books/${bookId}`);
  const reviewDoc = doc(this.firestore, `books/${bookId}/reviews/${reviewId}`);

  await runTransaction(this.firestore, async (tx) => {
    const revSnap = await tx.get(reviewDoc);
    if (!revSnap.exists()) throw new Error('Review not found');
    const current = revSnap.data() as Review;

    const bookSnap = await tx.get(bookDoc);
    if (!bookSnap.exists()) throw new Error('Book not found');
    const b = (bookSnap.data() as any) || {};

    const ratingBefore = current.rating ?? 0;
    const ratingAfter = data.rating ?? ratingBefore;

    let ratingSum = b.ratingSum || 0;
    const ratingCount = b.ratingCount || 0;

    if (ratingAfter !== ratingBefore) {
      ratingSum = ratingSum + (ratingAfter - ratingBefore);
    }
    const avgRating = ratingCount ? ratingSum / ratingCount : 0;

    tx.update(reviewDoc, data as any);
    if (ratingAfter !== ratingBefore) {
      tx.update(bookDoc, { ratingSum, avgRating });
    }
  });
}

async deleteReview(bookId: string, reviewId: string): Promise<void> {
  const bookDoc = doc(this.firestore, `books/${bookId}`);
  const reviewDoc = doc(this.firestore, `books/${bookId}/reviews/${reviewId}`);

  await runTransaction(this.firestore, async (tx) => {
    const revSnap = await tx.get(reviewDoc);
    if (!revSnap.exists()) return; 
    const rating = (revSnap.data() as Review).rating ?? 0;

    const bookSnap = await tx.get(bookDoc);
    if (!bookSnap.exists()) throw new Error('Book not found');

    const b = (bookSnap.data() as any) || {};
    const prevCount = b.ratingCount || 0;
    const prevSum = b.ratingSum || 0;

    const ratingCount = Math.max(0, prevCount - 1);
    const ratingSum = Math.max(0, prevSum - rating);
    const avgRating = ratingCount ? ratingSum / ratingCount : 0;

    tx.delete(reviewDoc);
    tx.update(bookDoc, { ratingCount, ratingSum, avgRating });
  });
}
}