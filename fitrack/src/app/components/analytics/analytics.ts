import { Component, OnInit, signal } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData } from 'chart.js';
import { Chart, registerables } from 'chart.js';
import { AnalyticsService } from '../../services/analytics';
import { AnalyticsSummary, MonthlyTrend } from '../../models/analytics.model';

Chart.register(...registerables);

type Period = 'month' | 'year' | 'all';

@Component({
  selector: 'app-analytics',
  standalone: true,
  imports: [CommonModule, DecimalPipe, BaseChartDirective],
  templateUrl: './analytics.html'
})
export class AnalyticsComponent implements OnInit {
  summary = signal<AnalyticsSummary | null>(null);
  trend = signal<MonthlyTrend[]>([]);
  isLoading = signal(true);
  activePeriod = signal<Period>('month');

  lineChartData = signal<ChartData<'line'>>({ labels: [], datasets: [] });
  lineChartOptions: ChartConfiguration<'line'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top', labels: { color: '#94a3b8' } },
      tooltip: { mode: 'index', intersect: false }
    },
    scales: {
      x: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(148,163,184,0.08)' } },
      y: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(148,163,184,0.08)' }, beginAtZero: true }
    },
    elements: { line: { tension: 0.4 }, point: { radius: 4, hoverRadius: 6 } }
  };

  doughnutExpenseData = signal<ChartData<'doughnut'>>({ labels: [], datasets: [] });
  doughnutIncomeData = signal<ChartData<'doughnut'>>({ labels: [], datasets: [] });
  doughnutOptions: ChartConfiguration<'doughnut'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom', labels: { color: '#94a3b8', boxWidth: 12, padding: 16 } }
    },
    cutout: '65%'
  };

  readonly COLORS = [
    '#14b8a6','#f43f5e','#f59e0b','#3b82f6','#8b5cf6',
    '#10b981','#ef4444','#06b6d4','#ec4899','#84cc16','#f97316','#a78bfa'
  ];

  constructor(private analyticsService: AnalyticsService) {}

  ngOnInit(): void {
    this.load();
    this.loadTrend();
  }

  setPeriod(p: Period): void {
    this.activePeriod.set(p);
    this.load();
  }

  private load(): void {
    this.isLoading.set(true);
    this.analyticsService.getSummary(this.activePeriod()).subscribe({
      next: (res) => {
        if (res.success) {
          this.summary.set(res.data);
          const expCats = res.data.expense_by_category.slice(0, 10);
          const incCats = res.data.income_by_category.slice(0, 10);
          this.doughnutExpenseData.set({
            labels: expCats.map(c => c.category),
            datasets: [{ data: expCats.map(c => c.amount), backgroundColor: this.COLORS, borderWidth: 2, borderColor: 'transparent' }]
          });
          this.doughnutIncomeData.set({
            labels: incCats.map(c => c.category),
            datasets: [{ data: incCats.map(c => c.amount), backgroundColor: this.COLORS, borderWidth: 2, borderColor: 'transparent' }]
          });
        }
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
  }

  private loadTrend(): void {
    this.analyticsService.getMonthlyTrend().subscribe({
      next: (res) => {
        if (res.success) {
          this.trend.set(res.data);
          this.lineChartData.set({
            labels: res.data.map(m => {
              const [y, mo] = m.month.split('-');
              return new Date(+y, +mo - 1).toLocaleString('default', { month: 'short', year: '2-digit' });
            }),
            datasets: [
              { data: res.data.map(m => m.income), label: 'Income', borderColor: '#14b8a6', backgroundColor: 'rgba(20,184,166,0.12)', fill: true, pointBackgroundColor: '#14b8a6' },
              { data: res.data.map(m => m.expense), label: 'Expenses', borderColor: '#f43f5e', backgroundColor: 'rgba(244,63,94,0.12)', fill: true, pointBackgroundColor: '#f43f5e' }
            ]
          });
        }
      }
    });
  }
}
