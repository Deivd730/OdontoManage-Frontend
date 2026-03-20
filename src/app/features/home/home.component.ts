import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent {
  constructor(
    public authService: AuthService,
    private router: Router
  ) { }

  navigateTo(route: string): void {
    this.router.navigate([route]);
  }

  goToProfile(): void {
    this.router.navigate(['/profile']);
  }

  getUserRole(): string {
    const roles = this.authService.getUserRoles();
    if (roles.length > 0) {
      // Remover el prefijo "ROLE_" y convertir a minúsculas
      return roles[0].replace('ROLE_', '').toLowerCase();
    }
    return 'usuario';
  }
}