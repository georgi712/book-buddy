import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize, take } from 'rxjs/operators';
import { AuthService, NotificationService } from '../../../core/services';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './login.component.html',
})
export class LoginComponent {
  private auth = inject(AuthService);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private notify = inject(NotificationService)

  isLoading = false;
  isLoadingGoogle = false;

  loginForm: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: [
      '',
      [
        Validators.required,
        Validators.minLength(8),
        Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#^()_+={}\[\]:;"'<>,./\\|~-]).{8,}$/)
      ]
    ]
  });

  get email() { return this.loginForm.get('email'); }
  get password() { return this.loginForm.get('password'); }

  onSubmit(): void {
    if (this.isLoading || this.loginForm.invalid) return;

    this.isLoading = true;
    const email = this.email?.value as string;
    const password = this.password?.value as string;

    this.auth.login(email, password).pipe(
      take(1),
      finalize(() => (this.isLoading = false))
    ).subscribe({
      next: () => {
        this.notify.success('Welcome back!', 'Logged in');
        this.loginForm.reset();
        this.router.navigate(['/']);
      },
      error: (err) => {
        this.notify.error(this.mapAuthError(err), 'Login failed');
      }
    });
  }

  signInWithGoogle(): void {
    if (this.isLoadingGoogle) return;
    this.isLoadingGoogle = true;
    this.auth.loginWithGoogle().pipe(
      take(1),
      finalize(() => (this.isLoadingGoogle = false))
    ).subscribe({
      next: () => {
        this.notify.success('Welcome!', 'Signed in with Google');
        this.router.navigate(['/']);
      },
      error: (err) => {
        this.notify.error(this.mapAuthError(err), 'Google sign-in failed');
      }
    });
  }

  private mapAuthError(err: any): string {
    const code = err?.code ?? '';
    switch (code) {
      case 'auth/popup-closed-by-user': return 'Sign-in window was closed.';
      case 'auth/cancelled-popup-request': return 'Sign-in already in progress.';
      case 'auth/popup-blocked': return 'Popup was blocked by your browser.';
      case 'auth/invalid-email': return 'That email address looks invalid.';
      case 'auth/user-disabled': return 'This account has been disabled.';
      case 'auth/user-not-found':
      case 'auth/invalid-credential': return 'Email or password is incorrect.';
      case 'auth/wrong-password': return 'Incorrect password.';
      case 'auth/too-many-requests': return 'Too many attempts. Try again later.';
      case 'auth/network-request-failed': return 'Network error. Check your connection.';
      default: return err?.message || 'Something went wrong. Please try again.';
    }
  }

  get isEmailValid(): boolean {
    return !!(this.email?.invalid && (this.email?.dirty || this.email?.touched));
  }
  get isPasswordValid(): boolean {
    return !!(this.password?.invalid && (this.password?.dirty || this.password?.touched));
  }
  get emailErrorMessage(): string {
    if (this.email?.errors?.['required']) return 'Email is required';
    if (this.email?.errors?.['email']) return 'Email is not valid!';
    return '';
  }
  get passwordErrorMessage(): string {
    if (this.password?.errors?.['required']) return 'Password is required';
    if (this.password?.errors?.['minlength']) return 'Password must be at least 8 characters!';
    if (this.password?.errors?.['pattern']) return 'The password is not strong enough.';
    return '';
  }
}