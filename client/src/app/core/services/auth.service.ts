import { Injectable, signal, computed } from '@angular/core';
import { User } from '../models';
import { UserService } from './user.service';
import {
  Auth, onAuthStateChanged, createUserWithEmailAndPassword, updateProfile,
  signInWithEmailAndPassword, signOut, User as FirebaseUser, setPersistence,
  browserLocalPersistence
} from '@angular/fire/auth';
import { from, switchMap, throwError, Observable, tap } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private firebaseUserSignal = signal<FirebaseUser | null>(null);
  private appUserSignal = signal<User | null>(null);

  user = computed(() => this.appUserSignal());
  isLoggedIn = computed(() => !!this.appUserSignal());
  authReady = signal(false);

  constructor(private auth: Auth, private userService: UserService) {
    setPersistence(this.auth, browserLocalPersistence).catch(() => {});
    this.listenToAuthChanges();
  }

  register(email: string, password: string, displayName: string): Observable<void> {
    return from(createUserWithEmailAndPassword(this.auth, email, password)).pipe(
      switchMap(async (cred) => {
        if (!cred.user) throw new Error('No user returned');
        await updateProfile(cred.user, { displayName });
        const newUser: User = {
          id: cred.user.uid,
          displayName,
          email: cred.user.email ?? '',
          imageUrl: cred.user.photoURL ?? '',
          favorites: [],
          createdAt: new Date(),
        };
        this.firebaseUserSignal.set(cred.user);
        this.appUserSignal.set(newUser);
        this.authReady.set(true);
        await this.userService.createUser(newUser).toPromise();
        const fetched = await this.userService.getUser(cred.user.uid).toPromise();
        if (fetched) this.appUserSignal.set(fetched);
      }),
      switchMap(() => from(Promise.resolve()))
    );
  }

  login(email: string, password: string): Observable<User | undefined> {
    return from(signInWithEmailAndPassword(this.auth, email, password)).pipe(
      switchMap((cred) => {
        if (!cred.user) return throwError(() => new Error('No user found.'));
        return this.userService.getUser(cred.user.uid).pipe(
          tap(user => {
            this.firebaseUserSignal.set(cred.user);
            this.appUserSignal.set(user ?? null);
            this.authReady.set(true);
          })
        );
      })
    );
  }

  logout(): Observable<void> {
    this.firebaseUserSignal.set(null);
    this.appUserSignal.set(null);
    this.authReady.set(true);
    return from(signOut(this.auth));
  }

  private listenToAuthChanges() {
    onAuthStateChanged(this.auth, async (fbUser) => {
      if (fbUser) {
        this.firebaseUserSignal.set(fbUser);
        try {
          const u = await this.userService.getUser(fbUser.uid).toPromise();
          this.appUserSignal.set(u ?? null);
        } catch {
          this.appUserSignal.set(null);
        } finally {
          this.authReady.set(true);
        }
      } else {
        this.firebaseUserSignal.set(null);
        this.appUserSignal.set(null);
        this.authReady.set(true);
      }
    });
  }

  getFirebaseUser(): FirebaseUser | null {
    return this.firebaseUserSignal();
  }
}