import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, MatToolbarModule, MatButtonModule, MatIconModule],
  template: `
    <mat-toolbar color="primary">
      <span>Car Rental System</span>
      <span class="spacer"></span>
      <button mat-button routerLink="/home">
        <mat-icon>home</mat-icon>
        Home
      </button>
      <button mat-button routerLink="/register">
        <mat-icon>person_add</mat-icon>
        Register
      </button>
      <button mat-button routerLink="/manage">
        <mat-icon>manage_accounts</mat-icon>
        Manage
      </button>
      <button mat-button routerLink="/statistics">
        <mat-icon>analytics</mat-icon>
        Statistics
      </button>
      <button mat-button routerLink="/service">
        <mat-icon>build</mat-icon>
        Service
      </button>
    </mat-toolbar>
    <main class="container">
      <router-outlet></router-outlet>
    </main>
  `,
  styles: [`
    .spacer {
      flex: 1 1 auto;
    }
    .container {
      padding: 20px;
      max-width: 1200px;
      margin: 0 auto;
    }
  `]
})
export class AppComponent {
  title = 'car-rental-frontend';
}