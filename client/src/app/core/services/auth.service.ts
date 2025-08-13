// core/services/auth.service.ts
import { Injectable, signal, computed } from '@angular/core';
import { User } from '../models';
import { UserService } from './user.service';
import {
  Auth,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  updateProfile,
  signInWithEmailAndPassword,
  signOut,
  User as FirebaseUser,
  setPersistence,
  browserLocalPersistence,
  GoogleAuthProvider,
  signInWithPopup,
} from '@angular/fire/auth';
import { from, switchMap, throwError, Observable, tap, firstValueFrom, of } from 'rxjs';
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
          imageUrl: cred.user.photoURL ?? '',
          imagePath: '',
          bio: '',
          favorites: [],
          createdAt: serverTimestamp(),
        };

        this.firebaseUserSignal.set(cred.user);
        this.appUserSignal.set(newUser);
        this.authReady.set(true);

        await firstValueFrom(this.userService.createUser(newUser));

        const fetched = await firstValueFrom(this.userService.getUser(cred.user.uid));
        if (fetched) this.appUserSignal.set(fetched);
      }),
      switchMap(() => of(void 0))
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

  loginWithGoogle(): Observable<void> {
    const provider = new GoogleAuthProvider();
  
    return from(signInWithPopup(this.auth, provider)).pipe(
      switchMap(async (cred) => {
        const fbUser = cred.user;
        if (!fbUser) throw new Error('No user returned');
  
        this.firebaseUserSignal.set(fbUser);
  
        let appUser = await firstValueFrom(this.userService.getUser(fbUser.uid));
        if (!appUser) {
          const newUser: User = {
            id: fbUser.uid,
            displayName: fbUser.displayName ?? 'User',
            email: fbUser.email ?? '',
            imageUrl: fbUser.photoURL ?? '',
            imagePath: '',              // no custom upload yet
            bio: '',
            favorites: [],
            createdAt: serverTimestamp(),
          };
          await firstValueFrom(this.userService.createUser(newUser));
          appUser = newUser;
        }
  
        const hasCustomUpload = !!appUser.imagePath;
        if (!hasCustomUpload && fbUser.photoURL && fbUser.photoURL !== appUser.imageUrl) {
          await firstValueFrom(
            this.userService.updateUser(fbUser.uid, { imageUrl: fbUser.photoURL })
          );
          appUser = { ...appUser, imageUrl: fbUser.photoURL };
        }
  
        this.appUserSignal.set(appUser);
        this.authReady.set(true);
      }),
      switchMap(() => of(void 0))
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
          let u: User | null | undefined = await firstValueFrom(this.userService.getUser(fbUser.uid));
          u = await this.syncProviderPhotoIfNeeded(fbUser, u ?? null);
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

  private async syncProviderPhotoIfNeeded(
    fbUser: FirebaseUser,
    appUser: User | null
  ): Promise<User | null> {
    if (!fbUser?.uid || !appUser) return appUser;
  
    const hasCustomUpload = !!appUser.imagePath;
  
    if (!hasCustomUpload && fbUser.photoURL && appUser.imageUrl !== fbUser.photoURL) {
      await firstValueFrom(
        this.userService.updateUser(fbUser.uid, { imageUrl: fbUser.photoURL })
      );
      return { ...appUser, imageUrl: fbUser.photoURL };
    }
  
    return appUser;
  }
}