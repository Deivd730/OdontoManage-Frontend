import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MainlayoutComponent } from './mainlayout.component';

describe('MainlayoutComponent', () => {
  let component: MainlayoutComponent;
  let fixture: ComponentFixture<MainlayoutComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MainlayoutComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MainlayoutComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
