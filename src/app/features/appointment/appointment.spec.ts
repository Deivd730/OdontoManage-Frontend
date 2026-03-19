import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { Appointment } from './appointment';
import { AppointmentService } from '@services/appointment.service';

describe('Appointment', () => {
  let component: Appointment;
  let fixture: ComponentFixture<Appointment>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Appointment],
      providers: [
        {
          provide: AppointmentService,
          useValue: {
            getAppointments: () => of([]),
          },
        },
      ],
    })
    .compileComponents();

    fixture = TestBed.createComponent(Appointment);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
