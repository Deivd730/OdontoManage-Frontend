import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PatientCreate } from './patient-create';

describe('PatientCreate', () => {
  let component: PatientCreate;
  let fixture: ComponentFixture<PatientCreate>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PatientCreate]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PatientCreate);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
