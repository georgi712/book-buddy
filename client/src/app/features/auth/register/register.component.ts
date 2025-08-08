import { Component, inject } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services';
import { getPasswordStrength, PasswordStrength } from '../../../utils/password-strenght.util';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-register',
  imports: [ReactiveFormsModule, RouterLink, CommonModule],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent {
  protected authService = inject(AuthService);
  private router = inject(Router);
  private formBuilder = inject(FormBuilder);

  registerForm: FormGroup;

  passwordStrength: PasswordStrength = 'weak';
  passwordStrengthMessage: string = '';

  constructor() {
    this.registerForm = this.formBuilder.group({
      username: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(30)]],
      email: ['', [Validators.required, Validators.email]],
      passwords: this.formBuilder.group({
        password: ['', [Validators.required, Validators.minLength(8), Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#^()_+={}\[\]:;"'<>,./\\|~-]).{8,}$/)]],
        rePassword: ['', [Validators.required]]
      }, { validators: this.passwordMatchValidator }),
      agreeTerms: [false, [Validators.requiredTrue]]
    });

    this.password?.valueChanges.subscribe(password => {
      const { strength, message } = getPasswordStrength(password);
      this.passwordStrength = strength;
      this.passwordStrengthMessage = message;
    });
}

  get username(): AbstractControl<any, any> | null {
    return this.registerForm.get('username');
  }

  get email(): AbstractControl<any, any> | null {
    return this.registerForm.get('email');
  }

  get passwords(): FormGroup<any> {
    return this.registerForm.get('passwords') as FormGroup;
  }

  get password(): AbstractControl<any, any> | null {
    return this.passwords.get('password');
  }

  get rePassword(): AbstractControl<any, any> | null {
    return this.passwords.get('rePassword');
  }

  get agreeTerms(): AbstractControl<any, any> | null {
    return this.registerForm.get('agreeTerms');
  }

  get isUsernameValid(): boolean {
    return this.username?.invalid && (this.username?.dirty || this.username?.touched) || false;
  }

  get isEmailValid(): boolean {
    return this.email?.invalid && (this.email?.dirty || this.email?.touched) || false;
  }

  get isPasswordValid(): boolean {
    return this.passwords?.invalid && (this.passwords?.dirty || this.passwords?.touched) || false;
  }

  get isTermsAgreed(): boolean {
    return this.agreeTerms?.invalid && (this.agreeTerms?.dirty || this.agreeTerms?.touched) || false;
  }

  get usernameErrorMessage(): string {
    if (this.username?.errors?.['required']) {
      return 'Username is required';
    }

    if (this.username?.errors?.['minlength']) {
      return 'Username should have atleast 3 symbols!';
    }

    if (this.username?.errors?.['maxlength']) {
      return "Username shouldn't exceed 30 symbols!";
    }

    return '';
  }

  get emailErrorMessage(): string {
    if (this.email?.errors?.['required']) {
      return 'Email is required';
    }

    if (this.email?.errors?.['email']) {
      return 'Email is not valid!';
    }

    return '';
  }

  get passwordErrorMessage(): string {
    if (this.password?.errors?.['required']) {
      return 'Password is required';
    }

    if (this.password?.errors?.['minlength']) {
      return 'Password must be atleast 8 characters!';
    }

    if (this.password?.errors?.['pattern']) {
      return 'Password is not valid!'
    }

    if (this.passwords?.errors?.['passwordMismatch']) {
      return 'Passwords mismatch!'
    }

    return ''
  }

  get rePasswordErrorMessage(): string {
    if (this.password?.errors?.['required']) {
      return 'Password is required';
    }

    if (this.password?.errors?.['minlength']) {
      return 'Password must be atleast 8 characters!';
    }

    if (this.passwords?.errors?.['passwordMismatch']) {
      return 'Passwords mismatch!'
    }

    return ''
  }

  get agreeTermsErrorMessage(): string {
    if (this.agreeTerms?.errors?.['required']) {
      return 'You must agree to the terms!'
    }

    return ''
  }


  isSubmitting = false;

onSubmit(): void {
  if (this.registerForm.valid) {
    this.isSubmitting = true;

    const { username, email } = this.registerForm.value;
    const { password } = this.registerForm.value.passwords;

    this.authService.register(email, password, username).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.registerForm.reset();
        this.router.navigate(['/']);
      },
      error: (err) => {
        this.isSubmitting = false;
        console.error('Registration error:', err.message);
      }
    });
  }
}

  private passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const password = control.get('password');
    const rePassword = control.get('rePassword');

    if (password && rePassword && password.value !== rePassword.value) {
      return { passwordMismatch: true} 
    }

    return null;
  }
} 
