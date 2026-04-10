import { Injectable, inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import {
  NotificationToastComponent,
  NotificationToastData,
} from '../components/notification-toast/notification-toast.component';


@Injectable({
  providedIn: 'root',
})
export class NotificationService {

  private snackBar = inject(MatSnackBar);

  success(message: string) {
    this.openToast({
      variant: 'success',
      title: 'Operacion completada',
      message,
      actionLabel: 'Cerrar',
    });
  }

  error(message: string) {
    this.openToast({
      variant: 'error',
      title: 'No se pudo completar',
      message,
      actionLabel: 'Cerrar',
    });
  }

  info(message: string) {
    this.openToast({
      variant: 'info',
      title: 'Informacion',
      message,
      actionLabel: 'Entendido',
    });
  }

  private openToast(data: NotificationToastData): void {
    const duration = data.variant === 'error' ? 5000 : 3500;

    this.snackBar.openFromComponent(NotificationToastComponent, {
      data,
      duration,
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: ['toast-shell'],
    });
  }

}
