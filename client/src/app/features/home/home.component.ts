import { Component, computed, inject, signal, effect } from '@angular/core';
import { AuthService } from '../../core/services';
import { BookService } from '../../core/services/book.service';
import { Book } from '../../core/models';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-home',
  imports: [RouterLink],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent {
  private authService = inject(AuthService);
  private bookService = inject(BookService);

  user = this.authService.user;
  isLoggedIn = computed(() => !!this.user());
  authReady = this.authService.authReady;

  featuredBooks = toSignal(this.bookService.getFeaturedBooks(), { initialValue: [] });
  latestBooks = toSignal(this.bookService.getLatestBooks(), { initialValue: [] });

}