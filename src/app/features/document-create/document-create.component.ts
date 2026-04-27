import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { PatientResponse, PatientService } from '../../core/services/patient.service';
import { DocumentService } from '../../core/services/document.service';
import { NotificationService } from '../../core/services/notification.service';

@Component({
  selector: 'app-document-create',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './document-create.component.html',
  styleUrls: ['./document-create.component.css']
})
export class DocumentCreate implements OnInit {
  patients = signal<PatientResponse[]>([]);
  isLoading = signal(false);
  selectedFileName = signal<string | null>(null);

  documentForm: FormGroup;

  private fb = inject(FormBuilder);
  private patientService = inject(PatientService);
  private documentService = inject(DocumentService);
  private notificationService = inject(NotificationService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  constructor() {
    this.documentForm = this.fb.group({
      patientId: [null, Validators.required],
      type: ['', [Validators.required, Validators.minLength(2)]],
      name: ['', [Validators.required, Validators.minLength(2)]],
      captureDate: [this.getTodayDate(), Validators.required],
      documentFile: [null, Validators.required]
    });
  }

  ngOnInit(): void {
    this.loadPatients();

    const patientId = Number(this.route.snapshot.queryParamMap.get('patientId'));
    if (Number.isFinite(patientId) && patientId > 0) {
      this.documentForm.patchValue({ patientId: patientId });
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files && input.files.length > 0 ? input.files[0] : null;

    this.documentForm.patchValue({ documentFile: file });
    this.documentForm.get('documentFile')?.markAsTouched();
    this.selectedFileName.set(file ? file.name : null);
  }

  submit(): void {
    if (this.documentForm.invalid) {
      this.markTouched(this.documentForm);
      return;
    }

    const value = this.documentForm.value;
    const file = value.documentFile as File | null;

    if (!file) {
      this.notificationService.error('Cal seleccionar un fitxer');
      return;
    }

    this.isLoading.set(true);

    this.documentService.create({
      patientId: Number(value.patientId),
      type: String(value.type).trim(),
      name: String(value.name).trim(),
      captureDate: String(value.captureDate),
      file: file
    }).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.notificationService.success('Document desat correctament');
        this.router.navigate(['/documents'], {
          queryParams: { patientId: value.patientId }
        });
      },
      error: (error) => {
        this.isLoading.set(false);
        this.notificationService.error(error?.error?.error || 'No s\'ha pogut pujar el document');
        console.error('Document upload error:', error);
      }
    });
  }

  cancel(): void {
    const patientId = this.documentForm.get('patientId')?.value;
    this.router.navigate(['/documents'], {
      queryParams: patientId ? { patientId } : {}
    });
  }

  isFieldInvalid(field: string): boolean {
    const control = this.documentForm.get(field);
    return !!(control && control.invalid && control.touched);
  }

  hasError(field: string, errorName: string): boolean {
    const control = this.documentForm.get(field);
    return !!(control && control.hasError(errorName) && control.touched);
  }

  private loadPatients(): void {
    this.patientService.getPatients().subscribe({
      next: (patients) => {
        this.patients.set(patients);
      },
      error: (error) => {
        this.notificationService.error('No s\'han pogut carregar els pacients');
        console.error('Patients load error:', error);
      }
    });
  }

  private getTodayDate(): string {
    return new Date().toISOString().split('T')[0];
  }

  private markTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach((key) => {
      formGroup.get(key)?.markAsTouched();
    });
  }
}
