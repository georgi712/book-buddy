import { Injectable, signal, computed } from '@angular/core';
import { User } from '../models';
import { UserService } from './user.service';
import {
  Auth, onAuthStateChanged, createUserWithEmailAndPassword, updateProfile,
  signInWithEmailAndPassword, signOut, User as FirebaseUser, setPersistence,
  browserLocalPersistence
} from '@angular/fire/auth';
import { from, switchMap, throwError, Observable, tap, firstValueFrom } from 'rxjs';
import { serverTimestamp } from '@angular/fire/firestore';

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
          imagePath: cred.user.photoURL ?? '',
          bio: '',
          favorites: [],
          createdAt: serverTimestamp()
        };
  
        this.firebaseUserSignal.set(cred.user);
        this.appUserSignal.set(newUser);
        this.authReady.set(true);
  
        await firstValueFrom(this.userService.createUser(newUser));
  
        const fetched = await firstValueFrom(this.userService.getUser(cred.user.uid));
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
          const u = await firstValueFrom(this.userService.getUser(fbUser.uid));
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

  setUser(user: User | null) {
    this.appUserSignal.set(user);
  }
  
  patchUser(patch: Partial<User>) {
    const cur = this.appUserSignal();
    if (!cur) return;
    this.appUserSignal.set({ ...cur, ...patch });
  }
  
  async refreshUserFromServer(): Promise<User | null> {
    const fb = this.firebaseUserSignal();
    if (!fb?.uid) return null;
    const fresh = await firstValueFrom(this.userService.getUser(fb.uid));
    this.appUserSignal.set(fresh ?? null);
    return fresh ?? null;
  }
}