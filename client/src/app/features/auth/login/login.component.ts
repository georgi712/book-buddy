import { Component } from '@angular/core';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  loginForm = {
    email: '',
    password: ''
  };

  onSubmit() {
    // Handle login logic here
    console.log('Login form submitted', this.loginForm);
  }
} 