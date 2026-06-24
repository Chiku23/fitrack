import { Component, signal } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth'; // Matches your custom flat file naming convention

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, RouterModule],
  templateUrl: './login.html',
  styleUrls: ['./login.css']
})
export class LoginComponent {
  loginForm: FormGroup;
  errorMessage = signal<string | null>(null);
  isSubmitting = signal<boolean>(false);

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]]
    });
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set(null);

    this.authService.login(this.loginForm.value).subscribe({
      next: (response) => {
        if (response.success) {
          this.router.navigate(['/dashboard']);
        } else {
          this.errorMessage.set(response.error || 'Login failed.');
          this.isSubmitting.set(false);
        }
      },
      error: (err) => {
        this.isSubmitting.set(false); 
        
        // Extract the explicit server error message if it exists in the backend response body
        if (err.error && err.error.error) {
          this.errorMessage.set(err.error.error);
        } else if (err.status === 401) {
          this.errorMessage.set('Invalid email or password.');
        } else if (err.status === 404) {
          this.errorMessage.set('Account not found.');
        } else {
          this.errorMessage.set('A network error occurred. Please try again.');
        }
      }
    });
  }
}