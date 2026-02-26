import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PatientRead } from './patient-read';

describe('PatientRead', () => {
  let component: PatientRead;
  let fixture: ComponentFixture<PatientRead>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PatientRead]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PatientRead);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
