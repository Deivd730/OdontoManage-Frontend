import { ChangeDetectionStrategy, Component, inject, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AppointmentStore } from '../appointment.store';

@Component({
  selector: 'app-agenda',
  imports: [CommonModule],
  templateUrl: './agenda.component.html',
  styleUrl: './agenda.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(document:click)': 'onDocumentClick()',
  },
})
export class AgendaComponent {
  readonly newAppointmentRequested = output<void>();
  readonly editAppointmentRequested = output<number>();
  readonly deleteAppointmentRequested = output<number>();
  readonly store = inject(AppointmentStore);
  expandedAppointmentId = signal<number | null>(null);

  onAppointmentClick(appointmentId: number, event: Event): void {
    event.stopPropagation();
    this.expandedAppointmentId.set(
      this.expandedAppointmentId() === appointmentId ? null : appointmentId
    );
  }

  onDocumentClick(): void {
    this.expandedAppointmentId.set(null);
  }

  onNewAppointmentClick(event: Event): void {
    event.stopPropagation();
    this.newAppointmentRequested.emit();
  }

  onEditAppointmentClick(appointmentId: number, event: Event): void {
    event.stopPropagation();
    this.editAppointmentRequested.emit(appointmentId);
  }

  onDeleteAppointmentClick(appointmentId: number, event: Event): void {
    event.stopPropagation();
    this.deleteAppointmentRequested.emit(appointmentId);
  }
}
