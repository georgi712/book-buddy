import { Component, inject } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { finalize, take } from 'rxjs/operators';
import { AuthService, NotificationService } from '../../../core/services';
import { getPasswordStrength, PasswordStrength } from '../../../utils/password-strenght.util';

@Component({
  selector: 'app-register',
  imports: [ReactiveFormsModule, RouterLink, CommonModule],
  templateUrl: './register.component.html'
})
export class RegisterComponent {
  private auth = inject(AuthService);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private notify = inject(NotificationService);

  registerForm: FormGroup = this.fb.group({
    username: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(30)]],
    email: ['', [Validators.required, Validators.email]],
    passwords: this.fb.group(
      {
        password: [
          '',
          [
            Validators.required,
            Validators.minLength(8),
            Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#^()_+={}\[\]:;"'<>,./\\|~-]).{8,}$/)
          ]
        ],
        rePassword: ['', [Validators.required]]
      },
      { validators: this.passwordMatchValidator }
    ),
    agreeTerms: [false, [Validators.requiredTrue]]
  });

  passwordStrength: PasswordStrength = 'weak';
  passwordStrengthMessage = '';
  isSubmitting = false;
  isGoogleLoading = false;

  constructor() {
    this.password?.valueChanges.subscribe((pwd: string) => {
      const { strength, message } = getPasswordStrength(pwd || '');
      this.passwordStrength = strength;
      this.passwordStrengthMessage = message;
    });
  }

  // getters
  get username() { return this.registerForm.get('username'); }
  get email() { return this.registerForm.get('email'); }
  get passwords(): FormGroup { return this.registerForm.get('passwords') as FormGroup; }
  get password() { return this.passwords.get('password'); }
  get rePassword() { return this.passwords.get('rePassword'); }
  get agreeTerms() { return this.registerForm.get('agreeTerms'); }

  // ui helpers
  get isUsernameValid(): boolean { return !!(this.username?.invalid && (this.username?.dirty || this.username?.touched)); }
  get isEmailValid(): boolean { return !!(this.email?.invalid && (this.email?.dirty || this.email?.touched)); }
  get isPasswordValid(): boolean { return !!(this.passwords?.invalid && (this.passwords?.dirty || this.passwords?.touched)); }
  get isTermsAgreed(): boolean { return !!(this.agreeTerms?.invalid && (this.agreeTerms?.dirty || this.agreeTerms?.touched)); }

  get usernameErrorMessage(): string {
    if (this.username?.errors?.['required']) return 'Username is required';
    if (this.username?.errors?.['minlength']) return 'Username should have at least 3 characters';
    if (this.username?.errors?.['maxlength']) return "Username shouldn't exceed 30 characters";
    return '';
  }
  get emailErrorMessage(): string {
    if (this.email?.errors?.['required']) return 'Email is required';
    if (this.email?.errors?.['email']) return 'Email is not valid';
    return '';
  }
  get passwordErrorMessage(): string {
    if (this.password?.errors?.['required']) return 'Password is required';
    if (this.password?.errors?.['minlength']) return 'Password must be at least 8 characters';
    if (this.password?.errors?.['pattern']) return 'Password is not strong enough';
    if (this.passwords?.errors?.['passwordMismatch']) return 'Passwords do not match';
    return '';
  }
  get rePasswordErrorMessage(): string {
    if (this.rePassword?.errors?.['required']) return 'Please confirm your password';
    if (this.passwords?.errors?.['passwordMismatch']) return 'Passwords do not match';
    return '';
  }
  get agreeTermsErrorMessage(): string {
    if (this.agreeTerms?.errors?.['requiredTrue']) return 'You must agree to the terms';
    return '';
  }

  onSubmit(): void {
    if (this.isSubmitting || this.registerForm.invalid) return;

    this.isSubmitting = true;
    const username = this.username?.value as string;
    const email = this.email?.value as string;
    const password = this.password?.value as string;

    this.auth.register(email, password, username).pipe(
      take(1),
      finalize(() => (this.isSubmitting = false))
    ).subscribe({
      next: () => {
        this.notify.success('Your account was created. Welcome!', 'Registration successful');
        this.registerForm.reset();
        this.router.navigate(['/']);
      },
      error: (err) => {
        this.notify.error(this.mapAuthError(err), 'Registration failed');
      }
    });
  }

  continueWithGoogle(): void {
    if (this.isGoogleLoading) return;
    this.isGoogleLoading = true;

    this.auth.loginWithGoogle().pipe(
      take(1),
      finalize(() => (this.isGoogleLoading = false))
    ).subscribe({
      next: () => {
        this.notify.success('Welcome to BookBuddy!', 'Signed in with Google');
        this.router.navigate(['/']);
      },
      error: (err) => {
        this.notify.error(this.mapAuthError(err), 'Google sign-in failed');
      }
    });
  }

  private passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const password = control.get('password')?.value;
    const rePassword = control.get('rePassword')?.value;
    return password && rePassword && password !== rePassword ? { passwordMismatch: true } : null;
  }

  private mapAuthError(err: any): string {
    const code = err?.code ?? '';
    switch (code) {
      case 'auth/email-already-in-use': return 'That email is already in use.';
      case 'auth/invalid-email': return 'That email address looks invalid.';
      case 'auth/weak-password': return 'Password is too weak.';
      case 'auth/popup-closed-by-user': return 'The sign-in popup was closed.';
      case 'auth/cancelled-popup-request': return 'Another popup was opened. Try again.';
      case 'auth/network-request-failed': return 'Network error. Check your connection.';
      default: return err?.message || 'Something went wrong. Please try again.';
    }
  }
}