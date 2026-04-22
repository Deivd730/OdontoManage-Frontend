import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  ElementRef,
  input,
  OnDestroy,
  ViewChild,
  output,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { distinctUntilChanged, startWith } from 'rxjs';
import flatpickr from 'flatpickr';
import { Catalan } from 'flatpickr/dist/l10n/cat';
import {
  AppointmentEditorAlert,
  AppointmentEditorSelection,
  BaseOption,
  DentistOption,
  PatientOption,
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
export class AppointmentEditorComponent implements AfterViewInit, OnDestroy {
  readonly hourOptions = Array.from({ length: 24 }, (_, hour) => String(hour).padStart(2, '0'));
  readonly minuteOptions = Array.from({ length: 60 }, (_, minute) => String(minute).padStart(2, '0'));

  @ViewChild('visitDateShell') private readonly visitDateShell?: ElementRef<HTMLDivElement>;

  private visitDatePickerInstance?: flatpickr.Instance;

  readonly mode = input<'create' | 'edit'>('create');
  readonly selectedDate = input<Date>(new Date());
  readonly initialValue = input<AppointmentEditorSubmit | null>(null);
  readonly assignedBoxLabel = input<string | null>(null);
  readonly isSaving = input(false);
  readonly alert = input<AppointmentEditorAlert | null>(null);

  readonly patientOptions = input<readonly PatientOption[]>([]);
  readonly dentistOptions = input<readonly DentistOption[]>([]);
  readonly boxOptions = input<readonly BaseOption[]>([]);
  readonly treatmentOptions = input<readonly TreatmentOption[]>([]);

  readonly closeRequested = output<void>();
  readonly saveRequested = output<AppointmentEditorSubmit>();
  readonly selectionChanged = output<AppointmentEditorSelection>();

  readonly selectedPatient = computed(() => {
    const patientId = this.form.controls.patient.value;
    return this.patientOptions().find((patient) => patient.id === patientId) ?? null;
  });

  readonly selectedPatientIsInfectious = computed(
    () => this.selectedPatient()?.hasInfectiousDiseases ?? false,
  );

  readonly selectedPatientInfectiousLabel = computed(() => {
    const diseases = this.selectedPatient()?.infectiousDiseases?.trim();
    return diseases || null;
  });

  readonly selectedTreatmentLabel = computed(() => {
    const treatmentId = this.form.controls.treatment.value;
    if (!treatmentId) {
      return null;
    }

    return this.treatmentOptions().find((treatment) => treatment.id === treatmentId)?.label ?? null;
  });

  readonly enabledDentistCount = computed(
    () => this.dentistOptions().filter((option) => !option.disabled).length,
  );

  readonly title = computed(() =>
    this.mode() === 'create' ? 'Cita nova' : 'Edita cita',
  );

  readonly showManualBox = computed(() => false);

  readonly form = new FormBuilder().nonNullable.group({
    patient: [0, [Validators.required, Validators.min(1)]],
    dentist: [0, [Validators.required, Validators.min(1)]],
    treatment: [0, [Validators.required, Validators.min(1)]],
    visitDate: [new Date(), [Validators.required]],
    visitHour: ['09', [Validators.required]],
    visitMinute: ['00', [Validators.required]],
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
        ...this.toDateControls(payload.visitDate),
        consultationReason: payload.consultationReason ?? '',
      });

      this.syncDatePicker();
    });

    this.form.controls.treatment.valueChanges
      .pipe(
        startWith(this.form.controls.treatment.value),
        distinctUntilChanged(),
        takeUntilDestroyed(),
      )
      .subscribe(() => this.emitSelectionChanged());

    this.form.controls.dentist.valueChanges
      .pipe(
        startWith(this.form.controls.dentist.value),
        distinctUntilChanged(),
        takeUntilDestroyed(),
      )
      .subscribe(() => this.emitSelectionChanged());

    this.form.controls.visitDate.valueChanges
      .pipe(
        startWith(this.form.controls.visitDate.value),
        distinctUntilChanged(),
        takeUntilDestroyed(),
      )
      .subscribe(() => this.emitSelectionChanged());

    this.form.controls.visitHour.valueChanges
      .pipe(
        startWith(this.form.controls.visitHour.value),
        distinctUntilChanged(),
        takeUntilDestroyed(),
      )
      .subscribe(() => this.emitSelectionChanged());

    this.form.controls.visitMinute.valueChanges
      .pipe(
        startWith(this.form.controls.visitMinute.value),
        distinctUntilChanged(),
        takeUntilDestroyed(),
      )
      .subscribe(() => this.emitSelectionChanged());

    effect(() => {
      const availableDentistIds = new Set(
        this.dentistOptions()
          .filter((option) => !option.disabled)
          .map((option) => option.id),
      );
      const selectedDentistId = this.form.controls.dentist.value;

      if (selectedDentistId > 0 && !availableDentistIds.has(selectedDentistId)) {
        this.form.controls.dentist.setValue(0);
      }
    });

    effect(() => {
      const treatmentIds = new Set(this.treatmentOptions().map((option) => option.id));
      const selectedTreatmentId = this.form.controls.treatment.value;

      if (selectedTreatmentId > 0 && !treatmentIds.has(selectedTreatmentId)) {
        this.form.controls.treatment.setValue(0);
      }
    });
  }

  ngAfterViewInit(): void {
    if (!this.visitDateShell) {
      return;
    }

    this.visitDatePickerInstance = flatpickr(this.visitDateShell.nativeElement, {
      wrap: true,
      dateFormat: 'd/m/Y',
      allowInput: true,
      clickOpens: true,
      disableMobile: true,
      locale: Catalan,
      defaultDate: this.form.controls.visitDate.value,
      onChange: (_, __, instance) => {
        const selectedDate = instance.selectedDates[0];
        if (!selectedDate) {
          return;
        }

        this.form.controls.visitDate.setValue(selectedDate);
      },
      onClose: (_, dateStr, instance) => {
        if (!dateStr) {
          return;
        }

        const typedDate = instance.parseDate(dateStr, 'd/m/Y');
        if (!typedDate || Number.isNaN(typedDate.getTime())) {
          return;
        }

        this.form.controls.visitDate.setValue(typedDate);
      },
    });

    this.syncDatePicker();
  }

  ngOnDestroy(): void {
    this.visitDatePickerInstance?.destroy();
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
      visitDate: this.normalizeDateTimeForApi(
        this.composeLocalDateTime(formValue.visitDate, formValue.visitHour, formValue.visitMinute),
      ),
      consultationReason: formValue.consultationReason.trim() || undefined,
    });
  }

  private buildDefaultVisitDate(selectedDate: Date): string {
    const defaultDate = new Date(selectedDate);
    defaultDate.setHours(9, 0, 0, 0);
    return defaultDate.toISOString();
  }

  private toDateControls(value: string): { visitDate: Date; visitHour: string; visitMinute: string } {
    const date = new Date(value);

    return {
      visitDate: date,
      visitHour: String(date.getHours()).padStart(2, '0'),
      visitMinute: String(date.getMinutes()).padStart(2, '0'),
    };
  }

  private composeLocalDateTime(date: Date, hour: string, minute: string): string {
    if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
      return '';
    }

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}T${hour}:${minute}`;
  }

  private syncDatePicker(): void {
    const selectedDate = this.form.controls.visitDate.value;

    if (!this.visitDatePickerInstance || !(selectedDate instanceof Date) || Number.isNaN(selectedDate.getTime())) {
      return;
    }

    this.visitDatePickerInstance.setDate(selectedDate, false, 'd/m/Y');
  }

  private normalizeDateTimeForApi(localValue: string): string {
    if (!localValue) {
      return localValue;
    }

    return localValue.length === 16 ? `${localValue}:00` : localValue;
  }

  private emitSelectionChanged(): void {
    const formValue = this.form.getRawValue();
    const visitDateLocal = this.composeLocalDateTime(
      formValue.visitDate,
      formValue.visitHour,
      formValue.visitMinute,
    );

    this.selectionChanged.emit({
      dentist: formValue.dentist,
      treatment: formValue.treatment,
      visitDateLocal,
    });
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
      Mon: 'Dilluns',
      Tue: 'Dimarts',
      Wed: 'Dimecres',
      Thu: 'Dijous',
      Fri: 'Divendres',
      Sat: 'Dissabte',
      Sun: 'Diumenge',
    };

    return days
      .split(',')
      .map((day) => dayMap[day.trim()] || day.trim())
      .join(', ');
  }
}
