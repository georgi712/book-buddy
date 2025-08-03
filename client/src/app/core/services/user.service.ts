import { Injectable } from "@angular/core";
import { CollectionReference, DocumentReference, Firestore, collection, doc, getDoc, setDoc, updateDoc } from "@angular/fire/firestore";
import { User } from "../models";
import { catchError, from, map, Observable, throwError } from 'rxjs';


@Injectable({
    providedIn: 'root'
})
export class UserService {
    private usersRef: CollectionReference<User>
    
    constructor(private firestore: Firestore) {
        this.usersRef = collection(this.firestore, 'users') as CollectionReference<User>;
    } 

    getUser(id: string): Observable<User | undefined> {
        const userDoc = doc(this.usersRef, id);
        return from(getDoc(userDoc)).pipe(
            map(snapshot => snapshot.exists() ? snapshot.data() as User : undefined),
            catchError((err) =>
              throwError(() => new Error(`Error getting user: ${err.message}`))
            )
        );
    }

    createUser(user: User): Observable<void> {
        if (!user.id) {
          return throwError(() => new Error('User ID is required to create user document.'));
        }
    
        const userDocRef: DocumentReference<User> = doc(this.usersRef, user.id);
        const userToSave: User = {
          ...user,
          createdAt: user.createdAt ?? new Date(),
          favorites: user.favorites ?? [],
        };
    
        return from(setDoc(userDocRef, userToSave)).pipe(
          catchError((err) => throwError(() => new Error(`Failed to create user: ${err.message}`)))
        );
      }

      updateUser(id: string, updates: Partial<User>): Observable<void> {
        const userDocRef = doc(this.usersRef, id);
        
        return from(updateDoc(userDocRef, { ...updates })).pipe(
          catchError((err) => throwError(() => new Error(`Failed to update user: ${err.message}`)))
        );
      }
}