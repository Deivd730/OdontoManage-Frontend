import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OdontogramLayoutComponent } from './odontogram-layout.component';

describe('OdontogramLayoutComponent', () => {
  let component: OdontogramLayoutComponent;
  let fixture: ComponentFixture<OdontogramLayoutComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OdontogramLayoutComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OdontogramLayoutComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
