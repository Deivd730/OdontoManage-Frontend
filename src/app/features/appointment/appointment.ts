import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { CalendarioComponent } from './calendario/calendario.component';
import { AgendaComponent } from './agenda/agenda.component';
import { AppointmentStore } from './appointment.store';

@Component({
  selector: 'app-appointment',
  imports: [CalendarioComponent, AgendaComponent],
  templateUrl: './appointment.html',
  styleUrl: './appointment.css',
  providers: [AppointmentStore],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Appointment implements OnInit {
  private readonly store = inject(AppointmentStore);

  ngOnInit(): void {
    this.store.initialize();
  }
}
