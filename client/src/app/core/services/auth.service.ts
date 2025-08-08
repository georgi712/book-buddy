import { Injectable, computed, signal } from '@angular/core';
import { User } from '../models';
import { UserService } from './user.service';
import {
  Auth,
  onAuthStateChanged,
  User as FirebaseUser,
  createUserWithEmailAndPassword,
  updateProfile,
  signInWithEmailAndPassword,
  signOut
} from '@angular/fire/auth';
import { from, Observable, switchMap, throwError } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private firebaseUserSignal = signal<FirebaseUser | null>(null);
  private appUserSignal = signal<User | null>(null);

  user = computed(() => this.appUserSignal());
  isLoggedIn = computed(() => !!this.appUserSignal());
  authReady = signal(false);

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

            // Firebase will trigger onAuthStateChanged after this
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
    onAuthStateChanged(this.auth, (firebaseUser) => {
      this.firebaseUserSignal.set(firebaseUser);

      if (firebaseUser) {
        this.userService.getUser(firebaseUser.uid).subscribe({
          next: (user) => {
            this.appUserSignal.set(user ?? null);
            this.authReady.set(true);
          },
          error: () => {
            this.appUserSignal.set(null);
            this.authReady.set(true);
          }
        });
      } else {
        this.appUserSignal.set(null);
        this.authReady.set(true);
      }
    });
  }

  getFirebaseUser(): FirebaseUser | null {
    return this.firebaseUserSignal();
  }
}