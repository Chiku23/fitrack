import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ProfileService } from '../../services/profile';
import { UserProfile } from '../../models/profile.model';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './profile.html'
})
export class ProfileComponent implements OnInit {
  profile = signal<UserProfile | null>(null);
  isLoading = signal(true);
  isSaving = signal(false);
  isChangingPw = signal(false);
  successMessage = signal<string | null>(null);
  errorMessage = signal<string | null>(null);
  pwError = signal<string | null>(null);
  pwSuccess = signal<string | null>(null);

  profileForm!: FormGroup;
  pwForm!: FormGroup;

  currencies = ['INR', 'USD', 'EUR', 'GBP', 'AED', 'SGD', 'JPY', 'AUD', 'CAD'];
  timezones = ['Asia/Kolkata', 'UTC', 'America/New_York', 'America/Los_Angeles', 'Europe/London', 'Europe/Berlin', 'Asia/Singapore', 'Asia/Tokyo', 'Australia/Sydney'];

  constructor(private profileService: ProfileService, private fb: FormBuilder) {}

  ngOnInit(): void {
    this.profileForm = this.fb.group({
      display_name: [''],
      base_currency: ['INR', Validators.required],
      timezone: ['Asia/Kolkata', Validators.required]
    });
    this.pwForm = this.fb.group({
      current_password: ['', [Validators.required, Validators.minLength(8)]],
      new_password: ['', [Validators.required, Validators.minLength(8)]]
    });
    this.load();
  }

  load(): void {
    this.profileService.getProfile().subscribe({
      next: (res) => {
        if (res.success) {
          this.profile.set(res.data);
          this.profileForm.patchValue({ display_name: res.data.display_name || '', base_currency: res.data.base_currency, timezone: res.data.timezone });
        }
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
  }

  saveProfile(): void {
    if (this.profileForm.invalid) return;
    this.isSaving.set(true);
    this.errorMessage.set(null);
    this.profileService.updateProfile(this.profileForm.value).subscribe({
      next: (res) => {
        if (res.success) { this.profile.set(res.data); this.showSuccess('Profile updated successfully.'); }
        else this.errorMessage.set(res.error || 'Update failed.');
        this.isSaving.set(false);
      },
      error: (err) => { this.errorMessage.set(err.error?.error || 'Server error.'); this.isSaving.set(false); }
    });
  }

  changePassword(): void {
    if (this.pwForm.invalid) return;
    this.isChangingPw.set(true);
    this.pwError.set(null);
    this.profileService.changePassword(this.pwForm.value).subscribe({
      next: (res) => {
        if (res.success) { this.pwForm.reset(); this.pwSuccess.set('Password changed successfully.'); setTimeout(() => this.pwSuccess.set(null), 3000); }
        else this.pwError.set(res.error || 'Failed to change password.');
        this.isChangingPw.set(false);
      },
      error: (err) => { this.pwError.set(err.error?.error || 'Server error.'); this.isChangingPw.set(false); }
    });
  }

  private showSuccess(msg: string): void {
    this.successMessage.set(msg);
    setTimeout(() => this.successMessage.set(null), 3000);
  }
}
