import { Component, OnInit, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from './shared/navbar/navbar.component';
import { AuthService } from './core/services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NavbarComponent],
  template: `
    <app-navbar></app-navbar>
    <main>
      <router-outlet></router-outlet>
    </main>
  `,
  styleUrl: './app.scss'
})
export class App implements OnInit {
  title = 'job-portal';
  private authService = inject(AuthService);

  ngOnInit(): void {
    // Always refresh profile from server on app load so cached data (e.g. companyId) stays up-to-date
    this.authService.fetchProfile();
  }
}
