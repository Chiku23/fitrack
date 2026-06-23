import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';

interface LocalTransaction {
  description: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  date: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css']
})
export class DashboardComponent implements OnInit {
  transactionForm!: FormGroup;
  
  // Sample arrays to populate indicators prior to loading dynamic REST API streams
  categories: string[] = ['Salary', 'Groceries', 'Utilities', 'Investments', 'Dining', 'Rent'];
  transactions: LocalTransaction[] = [
    { description: 'Quarterly Bonus', amount: 45000.00, type: 'income', category: 'Salary', date: '2026-06-24' },
    { description: 'Supermarket Restock', amount: 3450.00, type: 'expense', category: 'Groceries', date: '2026-06-23' },
    { description: 'Broadband Internet', amount: 999.00, type: 'expense', category: 'Utilities', date: '2026-06-22' }
  ];

  // Aggregation counters defaulting to core INR local baseline scales
  totalIncome = 45000.00;
  totalExpense = 4449.00;
  netBalance = 40551.00;

  constructor(private fb: FormBuilder) {}

  ngOnInit(): void {
    this.transactionForm = this.fb.group({
      description: ['', [Validators.required]],
      amount: ['', [Validators.required, Validators.min(1)]],
      type: ['expense', [Validators.required]],
      category: ['Groceries', [Validators.required]],
      date: [new Date().toISOString().split('T')[0], [Validators.required]]
    });
  }

  onAddTransaction(): void {
    if (this.transactionForm.invalid) return;

    const newRecord: LocalTransaction = this.transactionForm.value;
    this.transactions.unshift(newRecord);

    // Recalculate component layout metrics inline for validation
    if (newRecord.type === 'income') {
      this.totalIncome += newRecord.amount;
    } else {
      this.totalExpense += newRecord.amount;
    }
    this.netBalance = this.totalIncome - this.totalExpense;

    this.transactionForm.patchValue({
      description: '',
      amount: '',
      date: new Date().toISOString().split('T')[0]
    });
  }
}