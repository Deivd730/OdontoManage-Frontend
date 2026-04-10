import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MAT_SNACK_BAR_DATA, MatSnackBarRef } from '@angular/material/snack-bar';

export type ToastVariant = 'success' | 'error' | 'info';

export interface NotificationToastData {
  variant: ToastVariant;
  title: string;
  message: string;
  actionLabel?: string;
}

@Component({
  selector: 'app-notification-toast',
  imports: [CommonModule],
  templateUrl: './notification-toast.component.html',
  styleUrl: './notification-toast.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotificationToastComponent {
  readonly data = inject<NotificationToastData>(MAT_SNACK_BAR_DATA);
  private readonly snackBarRef = inject(MatSnackBarRef<NotificationToastComponent>);

  close(): void {
    this.snackBarRef.dismiss();
  }

  get iconColor(): string {
    if (this.data.variant === 'success') {
      return '#2f8f4b';
    }

    if (this.data.variant === 'error') {
      return '#cf4c4c';
    }

    return '#2f6cb0';
  }
}
