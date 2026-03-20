import { ChangeDetectionStrategy, Component, EventEmitter, HostListener, Output, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AppointmentStore } from '../appointment.store';

@Component({
  selector: 'app-agenda',
  imports: [CommonModule],
  templateUrl: './agenda.component.html',
  styleUrl: './agenda.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AgendaComponent {
  @Output() readonly newAppointmentRequested = new EventEmitter<void>();
  readonly store = inject(AppointmentStore);
  expandedAppointmentId = signal<number | null>(null);

  onAppointmentClick(appointmentId: number, event: Event): void {
    event.stopPropagation();
    this.expandedAppointmentId.set(
      this.expandedAppointmentId() === appointmentId ? null : appointmentId
    );
  }

  @HostListener('document:click')
  onDocumentClick(): void {
    this.expandedAppointmentId.set(null);
  }

  onNewAppointmentClick(event: Event): void {
    event.stopPropagation();
    this.newAppointmentRequested.emit();
  }
}
