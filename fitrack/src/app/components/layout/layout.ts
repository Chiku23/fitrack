import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { SidebarComponent } from './sidebar/sidebar';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [RouterModule, SidebarComponent],
  template: `
    <div class="flex h-screen bg-slate-50 dark:bg-slate-900 overflow-hidden">
      <app-sidebar />
      <main class="flex-1 overflow-y-auto">
        <router-outlet />
      </main>
    </div>
  `
})
export class LayoutComponent {}
