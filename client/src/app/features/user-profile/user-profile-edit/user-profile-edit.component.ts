import { Component, Input, Output, EventEmitter, inject, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { ImageUploadComponent } from '../../../shared/components/image-upload/image-upload.component';
import { AuthService, NotificationService, UserService } from '../../../core/services';
import { User } from '../../../core/models';


@Component({
  selector: 'app-user-profile-edit',
  
  imports: [CommonModule, ReactiveFormsModule, ImageUploadComponent],
  template: `
  <form class="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6" (ngSubmit)="save()" [formGroup]="form">
    <div>
      <label class="block text-sm font-medium text-gray-700">Display name</label>
      <input formControlName="displayName"
             class="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
             [class.border-red-500]="displayNameInvalid()">
      @if (displayNameInvalid()) {
        <p class="text-sm text-red-600 mt-1">
          {{ displayNameError() }}
        </p>
      }
    </div>

    <div>
      <label class="block text-sm font-medium text-gray-700">Email</label>
      <input formControlName="email" [disabled]="true"
             class="mt-1 w-full rounded-lg border border-gray-200 bg-gray-100 px-3 py-2 text-gray-600">
    </div>

    <div class="md:col-span-2">
      <div class="flex items-center justify-between">
        <label class="block text-sm font-medium text-gray-700">Bio</label>
        <span class="text-xs text-gray-500">{{ bioLeft() }} left</span>
      </div>
      <textarea rows="4" formControlName="bio"
                class="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"></textarea>
    </div>

    <div class="md:col-span-2">
      <label class="block text-sm font-medium text-gray-700 mb-2">Profile picture</label>
      <app-image-upload formControlName="avatar" [existingUrl]="user?.imageUrl || null"></app-image-upload>
    </div>

    <div class="md:col-span-2 flex items-center justify-end gap-3">
      <button type="button"
              (click)="cancel()"
              class="px-4 py-2 rounded-lg border border-gray-300 bg-white font-semibold text-gray-700 hover:bg-gray-50">
        Cancel
      </button>
      <button type="submit"
              [disabled]="isSaving || form.invalid"
              class="px-4 py-2 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:opacity-50">
        @if (isSaving) { Saving… } @else { Save changes }
      </button>
    </div>
  </form>
  `
})
export class UserProfileEditComponent {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private users = inject(UserService);
  private notify = inject(NotificationService);

  @Input() user: User | null = null;
  @Output() saved = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  isSaving = false;

  form = this.fb.group({
    displayName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(40)]],
    email: [{ value: '', disabled: true }],
    bio: ['', [Validators.maxLength(300)]],
    avatar: [null as File | null]
  });

  constructor() {
    // react to input user
    effect(() => {
      const u = this.user;
      if (!u) return;
      this.form.patchValue({
        displayName: u.displayName || '',
        email: u.email || '',
        bio: (u as any).bio || '',
        avatar: null
      }, { emitEvent: false });
    });
  }

  displayNameInvalid() {
    const c = this.form.controls.displayName;
    return c.invalid && (c.dirty || c.touched);
  }
  displayNameError(): string {
    const c = this.form.controls.displayName;
    if (c.hasError('required')) return 'Display name is required';
    if (c.hasError('minlength')) return 'At least 2 characters';
    if (c.hasError('maxlength')) return 'At most 40 characters';
    return '';
  }
  bioLeft = computed(() => 300 - (this.form.controls.bio.value?.length ?? 0));

  async save() {
    if (this.form.invalid) return;

    const me = this.auth.user();
    if (!me?.id) {
      this.notify.error('Not authenticated.');
      return;
    }

    this.isSaving = true;
    try {
      const file = this.form.controls.avatar.value;
      if (file) {
        await this.users.replaceAvatar(me.id, file as File, (this.user as any)?.imagePath);
      }

      await firstValueFrom(this.users.updateUser(me.id, {
        displayName: this.form.controls.displayName.value || '',
        bio: this.form.controls.bio.value || ''
      }));

      const refreshed = await this.auth.refreshUserFromServer();
      if (refreshed) this.auth.setUser(refreshed);

      this.notify.success('Profile saved.');
      this.form.controls.avatar.reset(null);
      this.saved.emit();
    } catch (e: any) {
      this.notify.error(e?.message || 'Failed to save profile.');
    } finally {
      this.isSaving = false;
    }
  }

  cancel() {
    this.cancelled.emit();
  }
}