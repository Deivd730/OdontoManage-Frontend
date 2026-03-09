import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DocumentCreateComponent } from './document-create.component';

describe('DocumentCreateComponent', () => {
  let component: DocumentCreateComponent;
  let fixture: ComponentFixture<DocumentCreateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DocumentCreateComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DocumentCreateComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
