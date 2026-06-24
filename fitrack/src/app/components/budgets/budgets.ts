import { Component, OnInit, signal } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { BudgetService } from '../../services/budget';
import { BudgetProgress, Budget } from '../../models/budget.model';

@Component({
  selector: 'app-budgets',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, DecimalPipe],
  templateUrl: './budgets.html'
})
export class BudgetsComponent implements OnInit {
  getPercentageWidth(percentage: number): number {
    return Math.min(percentage, 100);
  }
  budgets = signal<BudgetProgress[]>([]);
  isLoading = signal(true);
  showModal = signal(false);
  editingId = signal<string | null>(null);
  deleteConfirmId = signal<string | null>(null);
  isSubmitting = signal(false);
  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);

  categories = ['Salary', 'Groceries', 'Utilities', 'Investments', 'Dining', 'Rent', 'Transport', 'Shopping', 'Healthcare', 'Entertainment', 'Cash', 'Other'];

  form!: FormGroup;

  constructor(private budgetService: BudgetService, private fb: FormBuilder) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      category: ['Groceries', Validators.required],
      amount_limit: ['', [Validators.required, Validators.min(1)]],
      period: ['monthly', Validators.required],
      start_date: [new Date().toISOString().split('T')[0], Validators.required]
    });
    this.load();
  }

  load(): void {
    this.isLoading.set(true);
    this.budgetService.getBudgets().subscribe({
      next: (res) => { if (res.success) this.budgets.set(res.data); this.isLoading.set(false); },
      error: () => this.isLoading.set(false)
    });
  }

  openAdd(): void {
    this.editingId.set(null);
    this.form.reset({ category: 'Groceries', period: 'monthly', start_date: new Date().toISOString().split('T')[0] });
    this.errorMessage.set(null);
    this.showModal.set(true);
  }

  openEdit(b: BudgetProgress): void {
    this.editingId.set(b.id!);
    this.form.patchValue({ category: b.category, amount_limit: b.amount_limit, period: b.period, start_date: b.start_date });
    this.errorMessage.set(null);
    this.showModal.set(true);
  }

  closeModal(): void { this.showModal.set(false); }

  submit(): void {
    if (this.form.invalid) return;
    this.isSubmitting.set(true);
    const id = this.editingId();
    const obs = id
      ? this.budgetService.updateBudget(id, this.form.value)
      : this.budgetService.createBudget(this.form.value);

    obs.subscribe({
      next: (res) => {
        if (res.success) { this.load(); this.closeModal(); this.showSuccess(id ? 'Budget updated.' : 'Budget created.'); }
        else this.errorMessage.set(res.error || 'Something went wrong.');
        this.isSubmitting.set(false);
      },
      error: (err) => { this.errorMessage.set(err.error?.error || 'Server error.'); this.isSubmitting.set(false); }
    });
  }

  confirmDelete(id: string): void { this.deleteConfirmId.set(id); }
  cancelDelete(): void { this.deleteConfirmId.set(null); }

  doDelete(): void {
    const id = this.deleteConfirmId();
    if (!id) return;
    this.budgetService.deleteBudget(id).subscribe({
      next: () => { this.budgets.update(list => list.filter(b => b.id !== id)); this.deleteConfirmId.set(null); this.showSuccess('Budget deleted.'); }
    });
  }

  statusColor(b: BudgetProgress): string {
    if (b.percentage >= 100) return 'bg-rose-500';
    if (b.percentage >= 75) return 'bg-amber-400';
    return 'bg-emerald-500';
  }

  private showSuccess(msg: string): void {
    this.successMessage.set(msg);
    setTimeout(() => this.successMessage.set(null), 3000);
  }
}
