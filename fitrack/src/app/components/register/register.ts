import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth'; // Explicitly tracks your custom auth.ts path signature

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './register.html',
  styleUrls: ['./register.css']
})
export class RegisterComponent {
  registerForm: FormGroup;
  errorMessage: string | null = null;
  isSubmitting = false;

  // Strategic transactional currencies list
  currencies: string[] = ['INR', 'USD', 'EUR', 'GBP', 'AED', 'SGD', 'JPY'];

  // Global operating timezones selection array
  timezones: string[] = [
    'Asia/Kolkata',
    'UTC',
    'Asia/Singapore',
    'Europe/London',
    'America/New_York',
    'America/Los_Angeles',
    'Australia/Sydney'
  ];

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    // Structural configuration rules defaulting natively to India locale settings
    this.registerForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      base_currency: ['INR', [Validators.required]], // Sets INR as the default form state
      timezone: ['Asia/Kolkata', [Validators.required]] // Sets Indian Standard Time as the baseline
    });
  }

  onSubmit(): void {
    if (this.registerForm.invalid) {
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = null;

    this.authService.register(this.registerForm.value).subscribe({
      next: (response) => {
        if (response.success) {
          this.router.navigate(['/login']);
        } else {
          this.errorMessage = response.error || 'Registration processing encountered an issue.';
        }
        this.isSubmitting = false;
      },
      error: (err) => {
        this.errorMessage = err.error?.error || 'A remote transaction processing error occurred.';
        this.isSubmitting = false;
      }
    });
  }
}