import { Component, signal } from '@angular/core';
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
  errorMessage = signal<string | null>(null);
  isSubmitting = signal<boolean>(false);

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

    this.isSubmitting.set(true);
    this.errorMessage.set(null);

    this.authService.register(this.registerForm.value).subscribe({
      next: (response) => {
        if (response.success) {
          this.router.navigate(['/login']);
        } else {
          this.errorMessage.set(response.error || 'Registration failed.');
        }
        this.isSubmitting.set(false);
      },
      error: (err) => {
        this.errorMessage.set(err.error?.error || 'A server error occurred. Please try again.');
        this.isSubmitting.set(false);
      }
    });
  }
}