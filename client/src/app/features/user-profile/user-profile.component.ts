import { Component } from '@angular/core';

@Component({
  selector: 'app-user-profile',
  templateUrl: './user-profile.component.html',
  styleUrls: ['./user-profile.component.css']
})
export class UserProfileComponent {
  userProfile = {
    username: 'booklover123',
    email: 'user@example.com',
    avatar: 'assets/images/avatar.jpg',
    bio: 'Passionate reader and book collector. Love discovering new authors and sharing recommendations.',
    joinDate: '2023-06-15'
  };

  profileForm = {
    username: this.userProfile.username,
    email: this.userProfile.email,
    bio: this.userProfile.bio,
    avatar: null as File | null
  };

  onSubmit() {
    // Handle profile update logic here
    console.log('Profile form submitted', this.profileForm);
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.profileForm.avatar = file;
    }
  }
} 