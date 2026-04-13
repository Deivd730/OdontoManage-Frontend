import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  input,
  output,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  AppointmentEditorAlert,
  BaseOption,
  DentistOption,
  TreatmentOption,
} from '../appointment.models';

export interface AppointmentEditorSubmit {
  patient: number;
  dentist: number;
  treatment: number;
  visitDate: string;
  consultationReason?: string;
}

@Component({
  selector: 'app-appointment-editor',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './appointment-editor.component.html',
  styleUrl: './appointment-editor.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppointmentEditorComponent {
  readonly mode = input<'create' | 'edit'>('create');
  readonly selectedDate = input<Date>(new Date());
  readonly initialValue = input<AppointmentEditorSubmit | null>(null);
  readonly isSaving = input(false);
  readonly alert = input<AppointmentEditorAlert | null>(null);

  readonly patientOptions = input<readonly BaseOption[]>([]);
  readonly dentistOptions = input<readonly DentistOption[]>([]);
  readonly boxOptions = input<readonly BaseOption[]>([]);
  readonly treatmentOptions = input<readonly TreatmentOption[]>([]);

  readonly closeRequested = output<void>();
  readonly saveRequested = output<AppointmentEditorSubmit>();

  readonly title = computed(() =>
    this.mode() === 'create' ? 'Nueva cita' : 'Editar cita',
  );

  readonly showManualBox = computed(() => false);

  readonly form = new FormBuilder().nonNullable.group({
    patient: [0, [Validators.required, Validators.min(1)]],
    dentist: [0, [Validators.required, Validators.min(1)]],
    treatment: [0, [Validators.required, Validators.min(1)]],
    visitDateLocal: ['', [Validators.required]],
    consultationReason: [''],
  });

  constructor() {
    effect(() => {
      const initialValue = this.initialValue();
      const selectedDate = this.selectedDate();

      const payload = initialValue ?? {
        patient: 0,
        dentist: 0,
        box: 0,
        treatment: 0,
        visitDate: this.buildDefaultVisitDate(selectedDate),
        consultationReason: '',
      };

      this.form.reset({
        patient: payload.patient,
        dentist: payload.dentist,
        treatment: payload.treatment,
        visitDateLocal: this.toLocalDateTimeInput(payload.visitDate),
        consultationReason: payload.consultationReason ?? '',
      });
    });
  }

  onOverlayClick(event: MouseEvent): void {
    if (event.target !== event.currentTarget || this.isSaving()) {
      return;
    }

    this.closeRequested.emit();
  }

  onCloseClick(): void {
    if (this.isSaving()) {
      return;
    }

    this.closeRequested.emit();
  }

  onSubmit(): void {
    if (this.form.invalid || this.isSaving()) {
      this.form.markAllAsTouched();
      return;
    }

    const formValue = this.form.getRawValue();

    this.saveRequested.emit({
      patient: formValue.patient,
      dentist: formValue.dentist,
      treatment: formValue.treatment,
      visitDate: this.normalizeDateTimeForApi(formValue.visitDateLocal),
      consultationReason: formValue.consultationReason.trim() || undefined,
    });
  }

  private buildDefaultVisitDate(selectedDate: Date): string {
    const defaultDate = new Date(selectedDate);
    defaultDate.setHours(9, 0, 0, 0);
    return defaultDate.toISOString();
  }

  private toLocalDateTimeInput(value: string): string {
    const date = new Date(value);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');

    return `${year}-${month}-${day}T${hours}:${minutes}`;
  }

  private normalizeDateTimeForApi(localValue: string): string {
    if (!localValue) {
      return localValue;
    }

    return localValue.length === 16 ? `${localValue}:00` : localValue;
  }

  getSelectedDentistAvailableDays(): string | null | undefined {
    const dentistId = this.form.get('dentist')?.value;
    if (!dentistId) {
      return null;
    }

    const dentist = this.dentistOptions().find((d) => d.id === dentistId);
    return dentist?.availableDays || null;
  }

  translateAvailableDays(days: string | null | undefined): string | null {
    if (!days) {
      return null;
    }

    const dayMap: Record<string, string> = {
      Mon: 'Lunes',
      Tue: 'Martes',
      Wed: 'Miércoles',
      Thu: 'Jueves',
      Fri: 'Viernes',
      Sat: 'Sábado',
      Sun: 'Domingo',
    };

    return days
      .split(',')
      .map((day) => dayMap[day.trim()] || day.trim())
      .join(', ');
  }
}
