import { Injectable } from "@angular/core";
import {
  CollectionReference, DocumentReference, Firestore,
  collection, doc, getDoc, setDoc, updateDoc,
  arrayUnion, arrayRemove, docData, serverTimestamp
} from "@angular/fire/firestore";
import { User } from "../models";
import { catchError, from, map, Observable, throwError } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class UserService {
  private usersRef: CollectionReference<User>;

  constructor(private firestore: Firestore) {
    this.usersRef = collection(this.firestore, 'users') as CollectionReference<User>;
  }

  getUser(id: string): Observable<User | undefined> {
    const userDoc = doc(this.usersRef, id);
    return from(getDoc(userDoc)).pipe(
      map(snap => snap.exists() ? (snap.data() as User) : undefined),
      catchError(err => throwError(() => new Error(`Error getting user: ${err.message}`)))
    );
  }

  getUser$(id: string): Observable<User | undefined> {
    const ref = doc(this.usersRef, id);
    return docData(ref, { idField: 'id' }) as Observable<User | undefined>;
  }

  createUser(user: User): Observable<void> {
    if (!user.id) {
      return throwError(() => new Error('User ID is required to create user.'));
    }
    const ref: DocumentReference<User> = doc(this.usersRef, user.id);
    const toSave: User = {
      ...user,
      favorites: user.favorites ?? [],
      createdAt: (user.createdAt as any) ?? (serverTimestamp() as any),
    };
    return from(setDoc(ref, toSave)).pipe(
      catchError(err => throwError(() => new Error(`Failed to create user: ${err.message}`)))
    );
  }

  updateUser(id: string, updates: Partial<User>): Observable<void> {
    const ref = doc(this.usersRef, id);
    return from(updateDoc(ref, { ...updates } as any)).pipe(
      catchError(err => throwError(() => new Error(`Failed to update user: ${err.message}`)))
    );
  }

  addFavorite(userId: string | undefined, bookId: string): Promise<void> {
    const ref = doc(this.usersRef, userId);
    return updateDoc(ref, { favorites: arrayUnion(bookId) });
  }

  removeFavorite(userId: string | undefined, bookId: string): Promise<void> {
    const ref = doc(this.usersRef, userId);
    return updateDoc(ref, { favorites: arrayRemove(bookId) });
  }

  async toggleFavorite(userId: string, bookId: string): Promise<'added' | 'removed'> {
    const docRef = doc(this.usersRef, userId);
    const snap = await getDoc(docRef);
    const favs = (snap.data()?.favorites ?? []) as string[];
    if (favs.includes(bookId)) {
      await updateDoc(docRef, { favorites: arrayRemove(bookId) });
      return 'removed';
    } else {
      await updateDoc(docRef, { favorites: arrayUnion(bookId) });
      return 'added';
    }
  }

  async isFavorite(userId: string, bookId: string): Promise<boolean> {
    const snap = await getDoc(doc(this.usersRef, userId));
    const favs = (snap.data()?.favorites ?? []) as string[];
    return favs.includes(bookId);
  }
}