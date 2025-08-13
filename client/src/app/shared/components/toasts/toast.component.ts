import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-toasts',
  imports: [CommonModule],
  template: `
  <div class="fixed inset-0 pointer-events-none flex flex-col items-end gap-2 p-4 sm:p-6">
    @for (t of notify.toasts(); track t.id) {
      <div class="pointer-events-auto w-full max-w-sm rounded-xl shadow-lg ring-1 ring-black/5 p-4
                  text-sm text-white"
           [class.bg-emerald-600]="t.type==='success'"
           [class.bg-red-600]="t.type==='error'"
           [class.bg-slate-800]="t.type==='info'">
        <div class="flex items-start gap-3">
          <div class="flex-1">
            @if (t.title) { <div class="font-semibold">{{ t.title }}</div> }
            <div class="opacity-95">{{ t.message }}</div>
          </div>
          <button class="opacity-80 hover:opacity-100" (click)="notify.dismiss(t.id)">✕</button>
        </div>
      </div>
    }
  </div>
  `
})
export class ToastsComponent {
  notify = inject(NotificationService);
}