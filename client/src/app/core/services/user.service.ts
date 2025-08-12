import { Injectable } from "@angular/core";
import {
  CollectionReference, DocumentReference, Firestore,
  collection, doc, getDoc, setDoc, updateDoc,
  arrayUnion, arrayRemove, docData, serverTimestamp
} from "@angular/fire/firestore";
import { ref, uploadBytes, getDownloadURL, deleteObject, Storage } from "@angular/fire/storage";
import { User } from "../models";
import { catchError, from, map, Observable, throwError } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class UserService {
  private usersRef: CollectionReference<User>;

  constructor(private firestore: Firestore, private storage: Storage) {
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
    const refDoc = doc(this.usersRef, id);
    return docData(refDoc, { idField: 'id' }) as Observable<User | undefined>;
  }

  createUser(user: User): Observable<void> {
    if (!user.id) return throwError(() => new Error('User ID is required to create user.'));
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
    const refDoc = doc(this.usersRef, id);
    return from(updateDoc(refDoc, { ...updates } as any)).pipe(
      catchError(err => throwError(() => new Error(`Failed to update user: ${err.message}`)))
    );
  }

  addFavorite(userId: string | undefined, bookId: string): Promise<void> {
    const refDoc = doc(this.usersRef, userId);
    return updateDoc(refDoc, { favorites: arrayUnion(bookId) });
  }

  removeFavorite(userId: string | undefined, bookId: string): Promise<void> {
    const refDoc = doc(this.usersRef, userId);
    return updateDoc(refDoc, { favorites: arrayRemove(bookId) });
  }

  async toggleFavorite(userId: string, bookId: string): Promise<'added' | 'removed'> {
    const refDoc = doc(this.usersRef, userId);
    const snap = await getDoc(refDoc);
    const favs = (snap.data()?.favorites ?? []) as string[];
    if (favs.includes(bookId)) {
      await updateDoc(refDoc, { favorites: arrayRemove(bookId) });
      return 'removed';
    } else {
      await updateDoc(refDoc, { favorites: arrayUnion(bookId) });
      return 'added';
    }
  }

  async isFavorite(userId: string, bookId: string): Promise<boolean> {
    const snap = await getDoc(doc(this.usersRef, userId));
    const favs = (snap.data()?.favorites ?? []) as string[];
    return favs.includes(bookId);
  }

  async uploadAvatar(userId: string, file: File): Promise<{ imageUrl: string; imagePath: string }> {
    const ext = file.name.split('.').pop() || 'jpg';
    const fileName = `avatar_${Date.now()}.${ext}`;
    const path = `users/${userId}/${fileName}`;
    const storageRef = ref(this.storage, path);
    await uploadBytes(storageRef, file);
    const imageUrl = await getDownloadURL(storageRef);
    return { imageUrl, imagePath: path };
  }

  async replaceAvatar(userId: string, file: File, oldPath?: string): Promise<{ imageUrl: string; imagePath: string }> {
    const uploaded = await this.uploadAvatar(userId, file);
    if (oldPath) {
      try { await deleteObject(ref(this.storage, oldPath)); } catch { /* ignore */ }
    }
    await updateDoc(doc(this.usersRef, userId), {
      imageUrl: uploaded.imageUrl,
      imagePath: uploaded.imagePath
    } as any);
    return uploaded;
  }
}