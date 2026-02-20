import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="dashboard-container">
      <header class="dashboard-header">
        <h1>OdontoManage - Dashboard</h1>
        <div class="user-info">
          <span>Bienvenido, <strong>{{ username }}</strong></span>
          <button (click)="logout()" class="btn-logout">Cerrar Sesión</button>
        </div>
      </header>

      <main class="dashboard-content">
        <div class="info-card">
          <h2>Información del Usuario</h2>
          <div class="user-details">
            <p><strong>Usuario:</strong> {{ username }}</p>
            <p><strong>Roles:</strong></p>
            <ul class="roles-list">
              @for (role of roles; track role) {
                <li>
                  <span class="role-badge">{{ role }}</span>
                </li>
              }
            </ul>
          </div>
        </div>

        <div class="actions-card">
          <h2>Acciones Rápidas</h2>
          <div class="actions-grid">
            <button class="action-btn" (click)="navigateTo('/patients')">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              Pacientes
            </button>
            <button class="action-btn" (click)="navigateTo('/appointments')">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Citas
            </button>
            <button class="action-btn" (click)="navigateTo('/profile')">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Mi Perfil
            </button>
          </div>
        </div>
      </main>
    </div>
  `,
  styles: [`
    .dashboard-container {
      min-height: 100vh;
      background: #f7fafc;
    }

    .dashboard-header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 24px 40px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }

    .dashboard-header h1 {
      font-size: 28px;
      font-weight: 700;
      margin: 0;
    }

    .user-info {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .btn-logout {
      padding: 10px 20px;
      background: rgba(255, 255, 255, 0.2);
      color: white;
      border: 2px solid white;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .btn-logout:hover {
      background: white;
      color: #667eea;
    }

    .dashboard-content {
      padding: 40px;
      max-width: 1200px;
      margin: 0 auto;
      display: grid;
      gap: 24px;
      grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
    }

    .info-card, .actions-card {
      background: white;
      border-radius: 12px;
      padding: 32px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }

    .info-card h2, .actions-card h2 {
      font-size: 24px;
      font-weight: 700;
      color: #1a202c;
      margin-bottom: 24px;
    }

    .user-details {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .user-details p {
      font-size: 16px;
      color: #2d3748;
      margin: 0;
    }

    .roles-list {
      list-style: none;
      padding: 0;
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin: 8px 0 0 0;
    }

    .role-badge {
      display: inline-block;
      padding: 6px 12px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border-radius: 20px;
      font-size: 14px;
      font-weight: 600;
    }

    .actions-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
      gap: 16px;
    }

    .action-btn {
      padding: 20px;
      background: #f7fafc;
      border: 2px solid #e2e8f0;
      border-radius: 12px;
      cursor: pointer;
      transition: all 0.3s ease;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
      font-size: 16px;
      font-weight: 600;
      color: #2d3748;
    }

    .action-btn svg {
      width: 32px;
      height: 32px;
      color: #667eea;
    }

    .action-btn:hover {
      background: #667eea;
      color: white;
      border-color: #667eea;
      transform: translateY(-4px);
      box-shadow: 0 8px 16px rgba(102, 126, 234, 0.3);
    }

    .action-btn:hover svg {
      color: white;
    }

    @media (max-width: 768px) {
      .dashboard-header {
        flex-direction: column;
        gap: 16px;
        text-align: center;
      }

      .dashboard-content {
        padding: 20px;
        grid-template-columns: 1fr;
      }

      .actions-grid {
        grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
      }
    }
  `]
})
export class DashboardComponent implements OnInit {
  username: string | null = '';
  roles: string[] = [];

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.username = this.authService.getUsername();
    this.roles = this.authService.getUserRoles();
  }

  logout(): void {
    this.authService.logout();
  }

  navigateTo(route: string): void {
    this.router.navigate([route]);
  }
}
