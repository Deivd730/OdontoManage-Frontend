import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { UserService } from '../../core/services/user.service';
import { NotificationService } from '../../core/services/notification.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css',
})
export class ProfileComponent {
  public authService = inject(AuthService);
  public userService = inject(UserService);
  public notificationService = inject(NotificationService);
  private router = inject(Router);
  public currentUser = this.authService.currentUser;

  showUpdateModal = signal(false);
  showPasswordModal = signal(false);
  showModal = signal(false);
  confirmStep = signal(1);

  editData = { name: '', email: '' };
  passwordData = { current: '', new: '', confirm: '' };

  // --- LÓGICA: ACTUALIZAR DATOS BÁSICOS ---
  onUpdate() {
    const user = this.authService.currentUser();
    if (user) {
      this.editData = { name: user.name ?? '', email: user.email ?? '' };
      this.showUpdateModal.set(true);
    }
  }

  confirmUpdate() {
    const user = this.authService.currentUser();
    if (!user?.id) return;

    this.userService.updateUser(user.id, this.editData)
      .subscribe({
        next: (updatedUser) => {
          this.authService.updateCurrentUser(updatedUser);
          this.showUpdateModal.set(false);
          this.notificationService.success('Datos actualizados correctamente');
        },
        error: () => {
          this.notificationService.error('Error al actualizar');
        }
      });
  }

  closeUpdateModal() {
    this.showUpdateModal.set(false);
  }

  // --- LÓGICA: CAMBIAR CONTRASEÑA ---
  openPasswordModal() {
    this.passwordData = { current: '', new: '', confirm: '' };
    this.showPasswordModal.set(true);
  }

  confirmPasswordChange() {
    const user = this.authService.currentUser();

    if (!user || !user.id) {
      this.notificationService.error('No se pudo encontrar la información del usuario.');
      return;
    }

    if (this.passwordData.new !== this.passwordData.confirm) {
      this.notificationService.error('Las contraseñas nuevas no coinciden');
      return;
    }

    if (!this.passwordData.current || !this.passwordData.new) {
      this.notificationService.error('Por favor, rellena todos los campos');
      return;
    }

    this.userService.changePassword(user.id, {
      currentPassword: this.passwordData.current,
      newPassword: this.passwordData.new
    }).subscribe({
      next: (res) => {
        this.notificationService.success(res.message || 'Contraseña cambiada con éxito');
        this.showPasswordModal.set(false);
        this.passwordData = { current: '', new: '', confirm: '' };
      },
      error: (err) => {
        this.notificationService.error(err.error?.error || 'La contraseña actual es incorrecta');
      }
    });
  }

  closePasswordModal() {
    this.showPasswordModal.set(false);
  }

  // --- LÓGICA: ELIMINAR CUENTA (DOBLE CONFIRMACIÓN) ---
  openDeleteModal() {
    this.confirmStep.set(1);
    this.showModal.set(true);
  }

  goToStepTwo() {
    this.confirmStep.set(2);
  }

  confirmDeletion() {
    const user = this.authService.currentUser();
    if (user && user.id) {
      this.userService.deleteUser(user.id).subscribe({
        next: () => {
          this.showModal.set(false);
          this.authService.logout();
          this.router.navigate(['/register']);
        },
        error: (err) => {
          console.error('Error al borrar cuenta:', err);
          this.notificationService.error('Error al intentar eliminar la cuenta.');
          this.showModal.set(false);
        }
      });
    }
  }

  closeModal() {
    this.showModal.set(false);
    this.confirmStep.set(1);
  }
}