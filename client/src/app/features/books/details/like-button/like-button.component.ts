import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-like-button',
  templateUrl: './like-button.component.html',
})
export class LikeButtonComponent {
  @Input() isLiked = false;
  @Input() likeCount = 0;

  toggleLike() {
    this.isLiked = !this.isLiked;
    this.likeCount += this.isLiked ? 1 : -1;
    console.log('Like toggled:', this.isLiked);
  }
} 