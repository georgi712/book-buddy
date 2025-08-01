import { Component } from '@angular/core';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent {
  registerForm = {
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  };

  onSubmit() {
    // Handle registration logic here
    console.log('Register form submitted', this.registerForm);
  }
} 