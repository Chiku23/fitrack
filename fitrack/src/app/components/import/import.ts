import { Component, signal } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { ImportService } from '../../services/import';
import { Transaction } from '../../models/transaction.model';

type ImportState = 'idle' | 'parsing' | 'preview' | 'success' | 'error';

@Component({
  selector: 'app-import',
  standalone: true,
  imports: [CommonModule, DecimalPipe],
  templateUrl: './import.html'
})
export class ImportComponent {
  state = signal<ImportState>('idle');
  isDragging = signal(false);
  errorMessage = signal<string | null>(null);
  importedCount = signal(0);
  skippedCount = signal(0);
  detectedFormat = signal('');
  previewData = signal<Transaction[]>([]);
  selectedFile = signal<File | null>(null);
  selectedStatementType = signal<string>('auto');

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isDragging.set(true);
  }

  onDragLeave(): void {
    this.isDragging.set(false);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragging.set(false);
    const file = event.dataTransfer?.files[0];
    if (file) this.processFile(file);
  }

  onFileSelect(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) this.processFile(file);
  }

  private processFile(file: File): void {
    const name = file.name.toLowerCase();
    if (!name.match(/\.(csv|xlsx|xls|pdf|txt)$/)) {
      this.state.set('error');
      this.errorMessage.set('Unsupported file type. Please upload CSV, XLSX, PDF, or TXT.');
      return;
    }
    this.selectedFile.set(file);
    this.state.set('parsing');
    this.errorMessage.set(null);

    this.importService.parseFile(file, this.selectedStatementType()).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.detectedFormat.set(res.format || 'unknown');
          this.previewData.set(res.transactions || []);
          this.state.set('preview');
        } else {
          this.errorMessage.set(res.error || 'Parsing failed.');
          this.state.set('error');
        }
      },
      error: (err) => {
        this.errorMessage.set(err.error?.error || 'Server error during parsing.');
        this.state.set('error');
      }
    });
  }

  confirm(): void {
    const txns = this.previewData();
    if (txns.length === 0) {
      this.errorMessage.set('No transactions to save.');
      this.state.set('error');
      return;
    }

    this.state.set('parsing'); // reuse parsing spinner for saving
    this.errorMessage.set(null);

    this.importService.confirmImport(txns).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.importedCount.set(res.imported);
          this.state.set('success');
        } else {
          this.errorMessage.set(res.error || 'Failed to save transactions.');
          this.state.set('error');
        }
      },
      error: (err) => {
        this.errorMessage.set(err.error?.error || 'Server error during confirmation.');
        this.state.set('error');
      }
    });
  }

  reset(): void {
    this.state.set('idle');
    this.selectedFile.set(null);
    this.previewData.set([]);
    this.errorMessage.set(null);
    this.selectedStatementType.set('auto');
  }

  constructor(private importService: ImportService) {}
}
