import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { DashboardComponent } from '@features/dashboard/dashboard.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, DashboardComponent],
  template: `
    <div class="app-container">
      <app-dashboard></app-dashboard>
    </div>
  `,
  styles: [`
    .app-container {
      min-height: 100vh;
      padding: 1rem;
    }
  `]
})
export class AppComponent {
  title = 'Realtime Processing Dashboard';
}
