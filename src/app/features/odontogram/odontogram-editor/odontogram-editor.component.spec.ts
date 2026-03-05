import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OdontogramEditorComponent } from './odontogram-editor.component';

describe('OdontogramEditorComponent', () => {
  let component: OdontogramEditorComponent;
  let fixture: ComponentFixture<OdontogramEditorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OdontogramEditorComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OdontogramEditorComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
