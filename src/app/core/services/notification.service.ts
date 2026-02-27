import { Injectable, inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';


@Injectable({
  providedIn: 'root',
})
export class NotificationService {

  private snackBar = inject(MatSnackBar);

  success(message: string) {
    this.snackBar.open(message, 'Cerrar', {
      duration: 3000,
      panelClass: ['success-snackbar']
    });
  }

  error(message: string) {
    this.snackBar.open(message, 'Cerrar', {
      duration: 4000,
      panelClass: ['snackbar-error']
    });
  }

}
