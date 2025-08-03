import { Injectable } from "@angular/core";
import { BehaviorSubject, from, Observable, switchMap, throwError } from "rxjs";
import { User } from "../models";
import { UserService } from "./user.service";
import { 
    Auth, 
    onAuthStateChanged,
    User as FirebaseUser,
    createUserWithEmailAndPassword,
    updateProfile,
    signInWithEmailAndPassword,
    signOut, 
} from "@angular/fire/auth";

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    private currentUserSubject = new BehaviorSubject<User | null>(null);
    public currentUser$ = this.currentUserSubject.asObservable();

    constructor(private auth: Auth, private userService: UserService) {
        this.listenToAuthChanges();
    }

    register(email: string, password: string, displayName: string): Observable<void> {
        return from(createUserWithEmailAndPassword(this.auth, email, password)).pipe(
          switchMap((cred) => {
            if (!cred.user) return throwError(() => new Error('No user returned'));
            return from(updateProfile(cred.user, { displayName })).pipe(
              switchMap(() => {
                const newUser: User = {
                  id: cred.user.uid,
                  displayName,
                  email: cred.user.email ?? '',
                  imageUrl: cred.user.photoURL ?? '',
                  favorites: [],
                  createdAt: new Date()
                };
                return this.userService.createUser(newUser);
              })
            );
          })
        );
      }

    login(email: string, password: string): Observable<User | undefined> {
        return from(signInWithEmailAndPassword(this.auth, email, password)).pipe(
          switchMap((cred) => {
            if (!cred.user) return throwError(() => new Error('No user found.'));
            return this.userService.getUser(cred.user.uid);
          })
        );
      }
    
    logout(): Observable<void> {
        return from(signOut(this.auth));
      }

    private listenToAuthChanges() {
        onAuthStateChanged(this.auth, (firebaseUser: FirebaseUser | null) => {
            if (firebaseUser) {
                this.userService.getUser(firebaseUser.uid).subscribe((user) => {
                    this.currentUserSubject.next(user ?? null);
                });
            } else {
                this.currentUserSubject.next(null);
            }
        })
    }

    getFirabaseUser(): FirebaseUser | null {
        return this.auth.currentUser;
    }
}