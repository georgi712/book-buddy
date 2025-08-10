import {
  collectionData,
  docData,
  Firestore,
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  CollectionReference,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  getDoc,
  startAfter,
  endAt,
  QueryConstraint,
  getDocs,
  startAt
} from '@angular/fire/firestore';

import {
  Storage,
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject
} from '@angular/fire/storage';

import { Injectable } from '@angular/core';
import { Book, BookPage, BookQuery } from '../models';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class BookService {
  private booksRef: CollectionReference<Book>;

  constructor(private firestore: Firestore, private storage: Storage) {
    this.booksRef = collection(this.firestore, 'books') as CollectionReference<Book>;
  }

  getAllBooks(): Observable<Book[]> {
    return collectionData(this.booksRef, { idField: 'id' }).pipe(
      catchError(err => throwError(() => new Error(`Error loading books: ${err?.message || err}`)))
    );
  }

  getBookById(id: string): Observable<Book | undefined> {
    const bookDoc = doc(this.booksRef, id);
    return docData(bookDoc, { idField: 'id' }).pipe(
      catchError(err => throwError(() => new Error(`Error getting book: ${err?.message || err}`)))
    );
  }

  getFeaturedBooks(): Observable<Book[]> {
    const q = query(this.booksRef, where('featured', '==', true));
    return collectionData(q, { idField: 'id' }).pipe(
      catchError(err => throwError(() => new Error(`Error getting featured books: ${err?.message || err}`)))
    );
  }

  getLatestBooks(limitCount = 4): Observable<Book[]> {
    const q = query(this.booksRef, orderBy('createdAt', 'desc'), limit(limitCount));
    return collectionData(q, { idField: 'id' }).pipe(
      catchError(err => throwError(() => new Error(`Error getting latest books: ${err?.message || err}`)))
    );
  }

  async queryBooks(params: BookQuery): Promise<BookPage<Book>> {
    const { genre, search, pageSize = 12, cursor = null } = params;
  
    const qc: QueryConstraint[] = [];
  
    if (genre && genre !== 'All') {
      qc.push(where('genre', '==', genre));
    }
  
    const hasSearch = !!(search && search.trim());
    if (hasSearch) {
      const term = search!.trim().toLowerCase();
  
      qc.push(orderBy('titleLower'));
      qc.push(startAt(term));
      qc.push(endAt(term + '\uf8ff'));// inclusive range
  
      if (cursor) qc.push(startAfter(cursor));
  
    } else {
      qc.push(orderBy('createdAt', 'desc'));
      if (cursor) qc.push(startAfter(cursor));
    }
  
    qc.push(limit(pageSize));
  
    const qRef = query(this.booksRef, ...qc);
    const snap = await getDocs(qRef);
  
    const items = snap.docs.map(d => ({ id: d.id, ...(d.data() as Book) }));
    const nextCursor = snap.docs.length === pageSize ? snap.docs[snap.docs.length - 1] : null;
  
    return { items, nextCursor };
  }

  private async uploadCover(file: File, userId: string): Promise<{ imageUrl: string; imagePath: string }> {
    if (!file) throw new Error('No cover file provided.');
    if (!userId) throw new Error('User ID is required for upload.');

    const ext = file.name.split('.').pop() || 'jpg';
    const fileName = `${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
    const imagePath = `books/${userId}/${fileName}`;
    const storageRef = ref(this.storage, imagePath);
    await uploadBytes(storageRef, file);
    const imageUrl = await getDownloadURL(storageRef);
    return { imageUrl, imagePath };
  }


  async createBook(
    userId: string,
    book: Omit<Book, 'id' | 'createdAt' | 'imageUrl' | 'imagePath' | 'userId'>,
    coverFile: File
  ): Promise<string> {
    try {
      if (!userId) throw new Error('User ID is required.');
      if (!coverFile) throw new Error('Cover image is required.');

      const { imageUrl, imagePath } = await this.uploadCover(coverFile, userId);

      const docRef = await addDoc(this.booksRef, {
        ...book,
        userId,
        imageUrl,
        imagePath,
        createdAt: serverTimestamp() as any,
      } as Book);

      return docRef.id;
    } catch (err: any) {
      throw new Error(`Error creating book: ${err?.message || err}`);
    }
  }


  async updateBook(
    id: string,
    userId: string,
    data: Partial<Book>,
    newCoverFile?: File
  ): Promise<void> {
    try {
      if (!id) throw new Error('Book ID is required.');
      if (!userId) throw new Error('User ID is required.');

      const bookDocRef = doc(this.booksRef, id);
      const snap = await getDoc(bookDocRef as any);
      if (!snap.exists()) throw new Error('Book not found.');

      const existing = snap.data() as Book;
      if (existing.userId !== userId) {
        throw new Error('You are not allowed to edit this book.');
      }

      const patch: Partial<Book> = { ...data };

      if (newCoverFile) {
        const { imageUrl, imagePath } = await this.uploadCover(newCoverFile, userId);
        patch.imageUrl = imageUrl;
        if (existing.imagePath) {
          try {
            await deleteObject(ref(this.storage, existing.imagePath));
          } catch {
          }
        }
        patch.imagePath = imagePath;
      }

      await updateDoc(bookDocRef, patch as any);
    } catch (err: any) {
      throw new Error(`Error updating book: ${err?.message || err}`);
    }
  }

  
  async deleteBook(id: string, userId: string): Promise<void> {
    try {
      if (!id) throw new Error('Book ID is required.');
      if (!userId) throw new Error('User ID is required.');

      const bookDocRef = doc(this.booksRef, id);
      const snap = await getDoc(bookDocRef as any);
      if (!snap.exists()) throw new Error('Book not found.');

      const existing = snap.data() as Book;
      if (existing.userId !== userId) {
        throw new Error('You are not allowed to delete this book.');
      }

      await deleteDoc(bookDocRef);
      if (existing.imagePath) {
        try {
          await deleteObject(ref(this.storage, existing.imagePath));
        } catch {
        }
      }
    } catch (err: any) {
      throw new Error(`Error deleting book: ${err?.message || err}`);
    }
  }
}