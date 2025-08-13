import { Injectable, signal } from '@angular/core';

export type Toast = { id: number; type: 'success'|'error'|'info'; title?: string; message: string; timeout?: number };

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private _toasts = signal<Toast[]>([]);
  toasts = this._toasts.asReadonly();
  private seq = 0;

  private push(t: Omit<Toast, 'id'>) {
    const toast: Toast = { id: ++this.seq, timeout: 4000, ...t };
    this._toasts.update(list => [...list, toast]);
    if (toast.timeout && toast.timeout > 0) {
      setTimeout(() => this.dismiss(toast.id), toast.timeout);
    }
  }

  success(message: string, title?: string) { this.push({ type:'success', message, title }); }
  error(message: string, title?: string)   { this.push({ type:'error',   message, title, timeout: 6000 }); }
  info(message: string, title?: string)    { this.push({ type:'info',    message, title }); }

  dismiss(id: number) {
    this._toasts.update(list => list.filter(t => t.id !== id));
  }
}