import { Component, EventEmitter, forwardRef, Input, OnDestroy, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
  selector: 'app-image-upload',
  standalone: true,
  imports: [CommonModule],
  providers: [{
    provide: NG_VALUE_ACCESSOR,
    useExisting: forwardRef(() => ImageUploadComponent),
    multi: true
  }],
  template: `
  <div class="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-md transition-colors"
       [class.border-blue-500]="dragOver"
       [class.border-gray-300]="!dragOver"
       (dragover)="onDragOver($event)" (dragleave)="onDragLeave($event)" (drop)="onDrop($event)">
    @if (previewUrl || existingUrl) {
      <div class="w-full">
        <div class="flex items-center gap-4">
          <img [src]="previewUrl || existingUrl" alt="preview" class="h-24 w-24 object-cover rounded-md shadow" />
          <div class="flex-1">
            <p class="text-sm text-gray-800 font-medium truncate">{{ fileInfo }}</p>
            <p class="text-xs text-gray-500">Click “Change” to select a different image.</p>
            <div class="mt-2 flex gap-2">
              <label class="inline-flex items-center px-3 py-1.5 text-sm font-medium bg-white border border-gray-300 rounded-md shadow-sm cursor-pointer hover:bg-gray-50">
                Change
                <input type="file" class="sr-only" accept="image/*" (change)="onFileChange($event)" />
              </label>
              <button type="button" (click)="removeFile()"
                class="inline-flex items-center px-3 py-1.5 text-sm font-medium text-red-600 bg-red-50 border border-red-200 rounded-md hover:bg-red-100">
                Remove
              </button>
            </div>
            @if (errorText) {
              <p class="mt-2 text-sm text-red-600">{{ errorText }}</p>
            }
          </div>
        </div>
      </div>
    } @else {
      <div class="space-y-2 text-center">
        <svg class="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
          <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <div class="flex items-center justify-center gap-2 text-sm text-gray-600">
          <label class="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 px-2 py-1 border border-gray-300">
            <span>Upload a file</span>
            <input type="file" accept="image/*" class="sr-only" (change)="onFileChange($event)" />
          </label>
          <span>or drag and drop</span>
        </div>
        <p class="text-xs text-gray-500">PNG, JPG, GIF up to {{maxSizeMb}}MB</p>
        @if (errorText) {
          <p class="mt-1 text-sm text-red-600">{{ errorText }}</p>
        }
      </div>
    }
  </div>
  `,
})
export class ImageUploadComponent implements ControlValueAccessor, OnDestroy {
  @Input() existingUrl: string | null = null; // for edit screens
  @Input() maxSizeMb = 10;
  @Input() allowedTypes = ['image/png','image/jpeg','image/jpg','image/gif'];

  @Output() fileSelected = new EventEmitter<File | null>(); // optional, if parent wants to react

  file: File | null = null;
  previewUrl: string | null = null;
  dragOver = false;
  errorText = '';

  private onChange: (value: File | null) => void = () => {};
  private onTouched: () => void = () => {};

  get fileInfo(): string {
    if (!this.file) return '';
    const sizeMb = (this.file.size / (1024*1024)).toFixed(2);
    return `${this.file.name} • ${sizeMb} MB`;
  }

  writeValue(value: File | null): void {
    this.file = value;
    this.setPreview(value);
  }
  registerOnChange(fn: any): void { this.onChange = fn; }
  registerOnTouched(fn: any): void { this.onTouched = fn; }
  setDisabledState?(isDisabled: boolean): void {}

  // events
  onFileChange(evt: Event) {
    const input = evt.target as HTMLInputElement;
    const file = input.files?.[0] || null;
    if (file) this.acceptFile(file);
  }
  onDragOver(e: DragEvent) { e.preventDefault(); this.dragOver = true; }
  onDragLeave(e: DragEvent) { e.preventDefault(); this.dragOver = false; }
  onDrop(e: DragEvent) {
    e.preventDefault();
    this.dragOver = false;
    const file = e.dataTransfer?.files?.[0] || null;
    if (file) this.acceptFile(file);
  }

  removeFile() {
    this.setError('');
    this.file = null;
    this.setPreview(null);
    this.onChange(null);
    this.fileSelected.emit(null);
  }

  private acceptFile(file: File) {
    if (!this.allowedTypes.includes(file.type)) {
      this.setError('Only PNG, JPG or GIF images are allowed');
      return;
    }
    if (file.size > this.maxSizeMb*1024*1024) {
      this.setError(`Image must be ≤ ${this.maxSizeMb}MB`);
      return;
    }
    this.setError('');
    this.file = file;
    this.setPreview(file);
    this.onChange(file);
    this.onTouched();
    this.fileSelected.emit(file);
  }

  private setPreview(file: File | null) {
    if (this.previewUrl) URL.revokeObjectURL(this.previewUrl);
    this.previewUrl = file ? URL.createObjectURL(file) : null;
  }

  private setError(msg: string) { this.errorText = msg; }

  ngOnDestroy(): void {
    if (this.previewUrl) URL.revokeObjectURL(this.previewUrl);
  }
}