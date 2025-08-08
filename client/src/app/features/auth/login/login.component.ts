import { Component, inject } from '@angular/core';
import { AuthService } from '../../../core/services';
import { Router, RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})

export class LoginComponent {
  protected authService = inject(AuthService);
  private router = inject(Router);
  private formBuilder = inject(FormBuilder);

  loginForm: FormGroup

  constructor() {
    this.loginForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8), Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#^()_+={}\[\]:;"'<>,./\\|~-]).{8,}$/)]]
    });
  }

  get email() {
    return this.loginForm.get('email');
  }

  get password() {
    return this.loginForm.get('password')
  }

  get isEmailValid(): boolean {
    return this.email?.invalid && (this.email?.dirty || this.email?.touched) || false;
  }

  get isPasswordValid(): boolean {
    return this.password?.invalid && (this.password?.dirty || this.password?.touched) || false;
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
      return "The password isn't valid";
    }

    return ''
  }

  isLoading: boolean = false;

  onSubmit(): void {
    if (this.loginForm.invalid) return;
  
    this.isLoading = true;
    const { email, password } = this.loginForm.value;
  
    this.authService.login(email, password).subscribe({
      next: (user) => {
        this.isLoading = false;
        this.loginForm.reset();
        this.router.navigate(['/']);
      },
      error: (err) => {
        this.isLoading = false;
        console.error('Login error:', err.message);
      }
    });
  }
} 