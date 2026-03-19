import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
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
  readonly store = inject(AppointmentStore);
}
