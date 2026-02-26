import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MainlayaoutComponent } from './mainlayaout.component';

describe('MainlayaoutComponent', () => {
  let component: MainlayaoutComponent;
  let fixture: ComponentFixture<MainlayaoutComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MainlayaoutComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MainlayaoutComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
