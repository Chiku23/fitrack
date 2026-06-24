import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { RouterModule } from '@angular/router';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData } from 'chart.js';
import { Chart, registerables } from 'chart.js';
import { TransactionService } from '../../services/transaction';
import { AnalyticsService } from '../../services/analytics';
import { Transaction } from '../../models/transaction.model';
import { MonthlyTrend } from '../../models/analytics.model';

Chart.register(...registerables);

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, BaseChartDirective, DecimalPipe],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css']
})
export class DashboardComponent implements OnInit {
  recentTransactions = signal<Transaction[]>([]);
  monthlyTrend = signal<MonthlyTrend[]>([]);
  isLoading = signal(true);

  totalIncome = signal(0);
  totalExpense = signal(0);
  netBalance = computed(() => this.totalIncome() - this.totalExpense());
  savingsRate = computed(() => {
    const inc = this.totalIncome();
    return inc > 0 ? Math.round(((inc - this.totalExpense()) / inc) * 100) : 0;
  });

  barChartData = signal<ChartData<'bar'>>({ labels: [], datasets: [] });
  barChartOptions: ChartConfiguration<'bar'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top', labels: { color: '#94a3b8', font: { size: 12 } } },
      tooltip: { mode: 'index', intersect: false }
    },
    scales: {
      x: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(148,163,184,0.1)' } },
      y: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(148,163,184,0.1)' }, beginAtZero: true }
    }
  };

  constructor(
    private transactionService: TransactionService,
    private analyticsService: AnalyticsService
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  private loadData(): void {
    this.transactionService.getTransactions({ limit: 5 }).subscribe({
      next: (res) => {
        if (res.success) {
          this.recentTransactions.set(res.data.slice(0, 5));
        }
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });

    this.analyticsService.getSummary('month').subscribe({
      next: (res) => {
        if (res.success) {
          this.totalIncome.set(res.data.income);
          this.totalExpense.set(res.data.expense);
        }
      }
    });

    this.analyticsService.getMonthlyTrend().subscribe({
      next: (res) => {
        if (res.success) {
          this.monthlyTrend.set(res.data);
          const last6 = res.data.slice(-6);
          this.barChartData.set({
            labels: last6.map(m => {
              const [y, mo] = m.month.split('-');
              return new Date(+y, +mo - 1).toLocaleString('default', { month: 'short' });
            }),
            datasets: [
              { data: last6.map(m => m.income), label: 'Income', backgroundColor: 'rgba(20,184,166,0.7)', borderColor: '#14b8a6', borderWidth: 2, borderRadius: 6 },
              { data: last6.map(m => m.expense), label: 'Expenses', backgroundColor: 'rgba(244,63,94,0.7)', borderColor: '#f43f5e', borderWidth: 2, borderRadius: 6 }
            ]
          });
        }
      }
    });
  }
}