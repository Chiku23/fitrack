import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { TransactionService } from '../../services/transaction';
import { Transaction } from '../../models/transaction.model';

@Component({
  selector: 'app-transactions',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, DecimalPipe],
  templateUrl: './transactions.html'
})
export class TransactionsComponent implements OnInit {
  transactions = signal<Transaction[]>([]);
  isLoading = signal(true);
  showModal = signal(false);
  editingId = signal<string | null>(null);
  deleteConfirmId = signal<string | null>(null);
  isSubmitting = signal(false);
  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);

  selectedIds = signal<Set<string>>(new Set());

  filterType = signal('');
  filterCategory = signal('');
  filterFrom = signal('');
  filterTo = signal('');

  categories = ['Salary', 'Groceries', 'Utilities', 'Investments', 'Dining', 'Rent', 'Transport', 'Shopping', 'Healthcare', 'Entertainment', 'Cash', 'Income', 'Other'];
  paymentMethods = ['UPI', 'Cash', 'Card', 'Bank Transfer', 'Net Banking', 'Other'];

  filtered = computed(() => {
    let list = this.transactions();
    if (this.filterType()) list = list.filter(t => t.type === this.filterType());
    if (this.filterCategory()) list = list.filter(t => t.category === this.filterCategory());
    if (this.filterFrom()) list = list.filter(t => t.date >= this.filterFrom());
    if (this.filterTo()) list = list.filter(t => t.date <= this.filterTo());
    return list;
  });

  totalFiltered = computed(() => ({
    income: this.filtered().filter(t => t.type === 'income').reduce((s, t) => s + +t.amount, 0),
    expense: this.filtered().filter(t => t.type === 'expense').reduce((s, t) => s + +t.amount, 0),
  }));

  form!: FormGroup;

  constructor(private transactionService: TransactionService, private fb: FormBuilder) {}

  ngOnInit(): void {
    this.initForm();
    this.load();
  }

  private initForm(): void {
    this.form = this.fb.group({
      description: ['', [Validators.required]],
      amount: ['', [Validators.required, Validators.min(0.01)]],
      type: ['expense', [Validators.required]],
      category: ['Groceries', [Validators.required]],
      date: [new Date().toISOString().split('T')[0], [Validators.required]],
      notes: [''],
      payment_method: ['']
    });
  }

  load(): void {
    this.isLoading.set(true);
    this.selectedIds.set(new Set());
    this.transactionService.getTransactions({ limit: 500 }).subscribe({
      next: (res) => {
        if (res.success) this.transactions.set(res.data);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
  }

  openAdd(): void {
    this.editingId.set(null);
    this.form.reset({ type: 'expense', category: 'Groceries', date: new Date().toISOString().split('T')[0] });
    this.errorMessage.set(null);
    this.showModal.set(true);
  }

  openEdit(t: Transaction): void {
    this.editingId.set(t.id!);
    this.form.patchValue({ description: t.description, amount: t.amount, type: t.type, category: t.category, date: t.date, notes: t.notes || '', payment_method: t.payment_method || '' });
    this.errorMessage.set(null);
    this.showModal.set(true);
  }

  closeModal(): void {
    this.showModal.set(false);
    this.editingId.set(null);
  }

  submit(): void {
    if (this.form.invalid) return;
    this.isSubmitting.set(true);
    this.errorMessage.set(null);

    const payload = this.form.value;
    const id = this.editingId();

    const obs = id
      ? this.transactionService.updateTransaction(id, payload)
      : this.transactionService.createTransaction(payload);

    obs.subscribe({
      next: (res) => {
        if (res.success) {
          this.load();
          this.closeModal();
          this.showSuccess(id ? 'Transaction updated.' : 'Transaction added.');
        } else {
          this.errorMessage.set(res.error || 'Something went wrong.');
        }
        this.isSubmitting.set(false);
      },
      error: (err) => {
        this.errorMessage.set(err.error?.error || 'Server error.');
        this.isSubmitting.set(false);
      }
    });
  }

  confirmDelete(id: string): void {
    this.deleteConfirmId.set(id);
  }

  cancelDelete(): void {
    this.deleteConfirmId.set(null);
  }

  doDelete(): void {
    const id = this.deleteConfirmId();
    if (!id) return;
    this.transactionService.deleteTransaction(id).subscribe({
      next: () => {
        this.transactions.update(list => list.filter(t => t.id !== id));
        this.deleteConfirmId.set(null);
        this.showSuccess('Transaction deleted.');
      }
    });
  }

  private showSuccess(msg: string): void {
    this.successMessage.set(msg);
    setTimeout(() => this.successMessage.set(null), 3000);
  }

  clearFilters(): void {
    this.filterType.set('');
    this.filterCategory.set('');
    this.filterFrom.set('');
    this.filterTo.set('');
    this.selectedIds.set(new Set());
  }

  toggleSelect(id: string): void {
    this.selectedIds.update(set => {
      const newSet = new Set(set);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  }

  toggleSelectAll(checked: boolean): void {
    if (checked) {
      const ids = this.filtered().map(t => t.id!).filter(Boolean);
      this.selectedIds.set(new Set(ids));
    } else {
      this.selectedIds.set(new Set());
    }
  }

  isAllSelected = computed(() => {
    const list = this.filtered();
    if (list.length === 0) return false;
    const set = this.selectedIds();
    return list.every(t => set.has(t.id!));
  });

  bulkDelete(): void {
    const ids = Array.from(this.selectedIds());
    if (ids.length === 0) return;

    if (confirm(`Are you sure you want to delete these ${ids.length} transactions?`)) {
      this.transactionService.bulkDeleteTransactions(ids).subscribe({
        next: () => {
          this.transactions.update(list => list.filter(t => !ids.includes(t.id!)));
          this.selectedIds.set(new Set());
          this.showSuccess(`${ids.length} transactions deleted.`);
        }
      });
    }
  }
}
