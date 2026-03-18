import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AppointmentStore, CalendarDay } from '../appointment.store';

@Component({
  selector: 'app-calendario',
  imports: [CommonModule],
  templateUrl: './calendario.component.html',
  styleUrl: './calendario.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CalendarioComponent {
  readonly store = inject(AppointmentStore);

  selectDay(day: CalendarDay): void {
    this.store.selectDay(day);
  }
}
