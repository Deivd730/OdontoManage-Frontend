import { Injectable, computed, inject, signal } from '@angular/core';
import {
  AppointmentResponse,
  AppointmentService,
  CreateAppointmentRequest,
} from '@services/appointment.service';
import { DentistResponse, DentistService } from '@services/dentist.service';
import { NotificationService } from '@services/notification.service';
import { PatientService } from '@services/patient.service';
import {
  AppointmentEditorAlert,
  AppointmentEditorSelection,
  AppointmentFormValue,
  BaseOption,
  DentistOption,
  PatientOption,
  TreatmentOption,
  UpdateAppointmentOutcome,
} from './appointment.models';
import { AppointmentConflictValidatorService } from './domain/appointment-conflict-validator.service';
import { AppointmentErrorMapperService } from './domain/appointment-error-mapper.service';

export interface CalendarDay {
  date: Date;
  day: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
  appointmentsCount: number;
}

@Injectable()
export class AppointmentStore {
  private readonly appointmentService = inject(AppointmentService);
  private readonly dentistService = inject(DentistService);
  private readonly patientService = inject(PatientService);
  private readonly notificationService = inject(NotificationService);
  private readonly conflictValidator = inject(AppointmentConflictValidatorService);
  private readonly errorMapper = inject(AppointmentErrorMapperService);

  readonly allAppointments = signal<AppointmentResponse[]>([]);
  readonly currentDate = signal<Date>(new Date());
  readonly selectedDate = signal<Date>(new Date());
  readonly isLoading = signal(false);
  readonly isSaving = signal(false);
  readonly editorAlert = signal<AppointmentEditorAlert | null>(null);

  readonly patientOptions = signal<PatientOption[]>([]);
  readonly dentistOptions = signal<DentistOption[]>([]);
  readonly boxOptions = signal<BaseOption[]>([]);
  readonly treatmentOptions = signal<TreatmentOption[]>([]);

  private readonly catalogDentists = signal<DentistResponse[]>([]);
  private dentistFilterRequestId = 0;
  private treatmentFilterRequestId = 0;

  readonly weekDays = ['Dl', 'Dt', 'Dc', 'Dj', 'Dv', 'Ds', 'Dg'] as const;

  readonly currentMonth = computed(() => {
    return this.currentDate().toLocaleDateString('ca-ES', {
      month: 'long',
      year: 'numeric',
    });
  });

  readonly calendarDays = computed(() => this.generateCalendarDays());

  readonly selectedDayAppointments = computed(() => {
    const selected = this.selectedDate();

    return this.allAppointments()
      .filter((appointment) => this.isSameDay(new Date(appointment.visitDate), selected))
      .sort((a, b) => new Date(a.visitDate).getTime() - new Date(b.visitDate).getTime());
  });

  initialize(): void {
    const today = new Date();
    this.currentDate.set(today);
    this.selectedDate.set(today);
    this.loadAppointments();
    this.loadDentists();
    this.loadPatients();
  }

  previousMonth(): void {
    const current = this.currentDate();
    this.currentDate.set(new Date(current.getFullYear(), current.getMonth() - 1, 1));
  }

  nextMonth(): void {
    const current = this.currentDate();
    this.currentDate.set(new Date(current.getFullYear(), current.getMonth() + 1, 1));
  }

  goToToday(): void {
    const today = new Date();
    this.currentDate.set(today);
    this.selectedDate.set(today);
  }

  selectDay(day: CalendarDay): void {
    if (!day.isCurrentMonth) {
      return;
    }

    this.selectedDate.set(day.date);
  }

  formatTime(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleTimeString('ca-ES', { hour: '2-digit', minute: '2-digit' });
  }

  formatDateTime(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleString('ca-ES', {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  getDentistDisplayName(appointment: AppointmentResponse): string {
    return this.formatDentistDisplayName(appointment.dentist as unknown as {
      firstName?: string;
      lastName?: string;
      name?: string;
      fullName?: string;
    });
  }

  getBoxDisplayName(appointment: AppointmentResponse): string {
    return `Box ${appointment.box.id}`;
  }

  formatDate(date: Date): string {
    return date.toLocaleDateString('ca-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  getAppointmentById(appointmentId: number): AppointmentResponse | undefined {
    return this.allAppointments().find((appointment) => appointment.id === appointmentId);
  }

  clearEditorAlert(): void {
    this.editorAlert.set(null);
  }

  resetEditorReferenceOptions(): void {
    const dentists = this.catalogDentists();
    this.dentistOptions.set(
      dentists.length > 0
        ? this.buildDentistOptionsFromDentists(dentists)
        : this.buildDentistOptionsFromAppointments(this.allAppointments()),
    );

    const treatmentsFromDentists = this.buildTreatmentOptionsFromDentists(dentists);
    if (treatmentsFromDentists.length > 0) {
      this.treatmentOptions.set(treatmentsFromDentists);
      return;
    }

    this.treatmentOptions.set(
      this.uniqueOptions(
        this.allAppointments().map((appointment) => ({
          id: appointment.treatment.id,
          label: appointment.treatment.name,
          durationMinutes: appointment.treatment.durationMinutes ?? 30,
        })),
      ),
    );
  }

  refreshDentistOptionsForSelection(selection: AppointmentEditorSelection): void {
    this.dentistFilterRequestId += 1;
    const requestId = this.dentistFilterRequestId;

    if (selection.treatment <= 0 || !selection.visitDateLocal) {
      this.resetEditorReferenceOptions();
      return;
    }

    const visitDate = this.normalizeVisitDate(selection.visitDateLocal);

    this.appointmentService
      .getAvailableDentistsByTreatment(selection.treatment, visitDate)
      .subscribe({
        next: (dentists) => {
          if (requestId !== this.dentistFilterRequestId) {
            return;
          }

          const specialists = this.catalogDentists().filter((dentist) =>
            this.dentistSupportsTreatment(dentist, selection.treatment),
          );
          const availableDentistIds = new Set(dentists.map((dentist) => dentist.id));

          if (specialists.length > 0) {
            this.dentistOptions.set(
              this.uniqueOptions(
                specialists.map((dentist) => {
                  const isAvailable = availableDentistIds.has(dentist.id);

                  return {
                    id: dentist.id,
                    label: isAvailable
                      ? this.formatDentistDisplayName(dentist)
                      : `${this.formatDentistDisplayName(dentist)} (no disponible aquest dia)`,
                    availableDays: dentist.availableDays || null,
                    disabled: !isAvailable,
                  };
                }),
              ),
            );
            return;
          }

          this.dentistOptions.set(
            this.uniqueOptions(
              dentists.map((dentist) => ({
                id: dentist.id,
                label: this.formatDentistDisplayName(dentist as unknown as DentistResponse),
                availableDays:
                  (dentist as unknown as { availableDays?: string | null }).availableDays || null,
                disabled: false,
              })),
            ),
          );
        },
        error: () => {
          if (requestId !== this.dentistFilterRequestId) {
            return;
          }

          const localFallback = this.buildDentistOptionsFromDentists(
            this.catalogDentists().filter((dentist) =>
              this.dentistSupportsTreatment(dentist, selection.treatment),
            ),
          );

          this.dentistOptions.set(localFallback);
        },
      });
  }

  refreshTreatmentOptionsForSelection(selection: AppointmentEditorSelection): void {
    this.treatmentFilterRequestId += 1;
    const requestId = this.treatmentFilterRequestId;

    if (selection.dentist <= 0) {
      this.resetEditorReferenceOptions();
      return;
    }

    this.appointmentService.getAvailableTreatmentsByDentist(selection.dentist).subscribe({
      next: (treatments) => {
        if (requestId !== this.treatmentFilterRequestId) {
          return;
        }

        this.treatmentOptions.set(this.toTreatmentOptions(treatments));
      },
      error: () => {
        if (requestId !== this.treatmentFilterRequestId) {
          return;
        }

        const dentist = this.catalogDentists().find((item) => item.id === selection.dentist);
        const fallback = this.toTreatmentOptions(this.getDentistTreatments(dentist));

        this.treatmentOptions.set(fallback);
      },
    });
  }

  createAppointment(formValue: AppointmentFormValue, onSuccess?: () => void): void {
    if (!this.prepareSave(formValue)) {
      return;
    }

    this.appointmentService.createAppointment(this.toRequest(formValue)).subscribe({
      next: (createdAppointment) => {
        this.allAppointments.update((appointments) => [...appointments, createdAppointment]);
        this.refreshReferenceOptions(this.allAppointments());
        this.notificationService.success(
          `Cita creada per a ${this.getDentistDisplayName(createdAppointment)} a les ${this.formatTime(createdAppointment.visitDate)}.`,
        );
        this.isSaving.set(false);
        onSuccess?.();
      },
      error: (error) => {
        this.editorAlert.set(this.errorMapper.map(error, 'create'));
        this.isSaving.set(false);
      },
    });
  }

  updateAppointment(
    appointmentId: number,
    formValue: AppointmentFormValue,
    onSuccess?: (outcome: UpdateAppointmentOutcome) => void,
  ): void {
    if (!this.prepareSave(formValue, appointmentId)) {
      return;
    }

    this.appointmentService
      .updateAppointment(appointmentId, this.toRequest(formValue))
      .subscribe({
        next: (updatedAppointment) => {
          this.allAppointments.update((appointments) =>
            appointments.map((appointment) =>
              appointment.id === appointmentId ? updatedAppointment : appointment,
            ),
          );
          this.refreshReferenceOptions(this.allAppointments());
          this.notificationService.success(
            `Cita actualitzada: ${this.formatTime(updatedAppointment.visitDate)} - ${updatedAppointment.treatment.name}.`,
          );

          this.isSaving.set(false);
          onSuccess?.({
            manualBoxChanged: false,
            selectedBoxId: null,
            assignedBoxLabel: null,
            boxReassigned: false,
          });
        },
        error: (error) => {
          this.editorAlert.set(this.errorMapper.map(error, 'update'));
          this.isSaving.set(false);
        },
      });
  }

  deleteAppointment(appointmentId: number, onSuccess?: () => void): void {
    this.isSaving.set(true);

    this.appointmentService.deleteAppointment(appointmentId).subscribe({
      next: () => {
        this.allAppointments.update((appointments) =>
          appointments.filter((appointment) => appointment.id !== appointmentId),
        );
        this.refreshReferenceOptions(this.allAppointments());
        this.notificationService.success('La cita s\'ha eliminat correctament.');
        this.isSaving.set(false);
        onSuccess?.();
      },
      error: (error) => {
        this.notificationService.error(this.errorMapper.map(error, 'delete').message);
        this.isSaving.set(false);
      },
    });
  }

  private loadAppointments(): void {
    this.isLoading.set(true);
    this.appointmentService.getAppointments().subscribe({
      next: (data) => {
        this.allAppointments.set(data);
        this.refreshReferenceOptions(data);
        if (this.dentistOptions().length === 0) {
          this.dentistOptions.set(this.buildDentistOptionsFromAppointments(data));
        }
        this.isLoading.set(false);
      },
      error: (err) => {
        this.notificationService.error('No s\'han pogut carregar les cites.');
        console.error('Error loading appointments:', err);
        this.isLoading.set(false);
      },
    });
  }

  private loadPatients(): void {
    this.patientService.getPatients().subscribe({
      next: (patients) => {
        const patientOptions = patients.map((patient) => ({
          id: patient.id,
          label: `${patient.firstName} ${patient.lastName}`.trim(),
          hasInfectiousDiseases: patient.hasInfectiousDiseases ?? false,
          infectiousDiseases: patient.infectiousDiseases?.trim() || null,
        }));

        this.patientOptions.update((existing) => this.mergeOptions(existing, patientOptions));
      },
      error: () => {
        this.notificationService.error('No s\'ha pogut carregar el llistat de pacients.');
      },
    });
  }

  private loadDentists(): void {
    this.dentistService.getDentists().subscribe({
      next: (dentists) => {
        this.catalogDentists.set(dentists);
        this.dentistOptions.set(this.buildDentistOptionsFromDentists(dentists));

        const treatmentOptions = this.buildTreatmentOptionsFromDentists(dentists);
        if (treatmentOptions.length > 0) {
          this.treatmentOptions.update((existing) => this.mergeOptions(existing, treatmentOptions));
        }
      },
      error: (error) => {
        console.error('Error loading dentists:', error);

        if (this.dentistOptions().length === 0) {
          this.dentistOptions.set(this.buildDentistOptionsFromAppointments(this.allAppointments()));
        }
      },
    });
  }

  private refreshReferenceOptions(appointments: AppointmentResponse[]): void {
    const patientOptions = appointments.map((appointment) => ({
      id: appointment.patient.id,
      label: `${appointment.patient.firstName} ${appointment.patient.lastName}`.trim(),
    }));
    this.patientOptions.update((existing) => this.mergeOptions(existing, patientOptions));

    this.boxOptions.set(
      this.uniqueOptions(
        appointments.map((appointment) => ({
          id: appointment.box.id,
          label: appointment.box.name?.trim() || `Box ${appointment.box.id}`,
        })),
      ),
    );

    this.treatmentOptions.set(
      this.uniqueOptions([
        ...appointments.map((appointment) => ({
          id: appointment.treatment.id,
          label: appointment.treatment.name,
          durationMinutes: appointment.treatment.durationMinutes ?? 30,
        })),
        ...this.buildTreatmentOptionsFromDentists(this.catalogDentists()),
      ]),
    );
  }

  private buildDentistOptionsFromDentists(dentists: readonly DentistResponse[]): DentistOption[] {
    return this.uniqueOptions(
      dentists.map((dentist) => ({
        id: dentist.id,
        label: this.formatDentistDisplayName(dentist),
        availableDays: dentist.availableDays || null,
        disabled: false,
      })),
    );
  }

  private buildTreatmentOptionsFromDentists(
    dentists: readonly DentistResponse[],
  ): TreatmentOption[] {
    return this.uniqueOptions(
      dentists.flatMap((dentist) =>
        this.getDentistTreatments(dentist).map((treatment) => ({
          id: treatment.id,
          label: treatment.name,
          durationMinutes: treatment.durationMinutes ?? 30,
        })),
      ),
    );
  }

  private getDentistTreatments(
    dentist?: DentistResponse,
  ): readonly { id: number; name: string; durationMinutes?: number }[] {
    if (!dentist) {
      return [];
    }

    if (Array.isArray(dentist.treatments) && dentist.treatments.length > 0) {
      return dentist.treatments;
    }

    if (dentist.treatment?.id && dentist.treatment.name) {
      return [dentist.treatment];
    }

    return [];
  }

  private toTreatmentOptions(
    treatments: readonly { id: number; name: string; durationMinutes?: number }[],
  ): TreatmentOption[] {
    return this.uniqueOptions(
      treatments.map((treatment) => ({
        id: treatment.id,
        label: treatment.name,
        durationMinutes: treatment.durationMinutes ?? 30,
      })),
    );
  }

  private dentistSupportsTreatment(dentist: DentistResponse, treatmentId: number): boolean {
    return this.getDentistTreatments(dentist).some((treatment) => treatment.id === treatmentId);
  }

  private buildDentistOptionsFromAppointments(appointments: AppointmentResponse[]): DentistOption[] {
    return this.uniqueOptions(
      appointments.map((appointment) => ({
        id: appointment.dentist.id,
        label: this.formatDentistDisplayName(appointment.dentist),
        availableDays: (appointment.dentist as unknown as { availableDays?: string }).availableDays || null,
        disabled: false,
      })),
    );
  }

  private toRequest(formValue: AppointmentFormValue): CreateAppointmentRequest {
    const normalizedVisitDate = this.normalizeVisitDate(formValue.visitDate);

    return {
      patient: formValue.patient,
      dentist: formValue.dentist,
      treatment: formValue.treatment,
      visitDate: normalizedVisitDate,
      consultationReason: formValue.consultationReason?.trim() || undefined,
      parentAppointment: null,
    };
  }

  private mergeOptions<T extends BaseOption>(
    current: readonly T[],
    incoming: readonly T[],
  ): T[] {
    return this.uniqueOptions([...current, ...incoming]);
  }

  private uniqueOptions<T extends BaseOption>(options: readonly T[]): T[] {
    const map = new Map<number, T>();

    for (const option of options) {
      if (!map.has(option.id) || option.label.trim()) {
        map.set(option.id, option);
      }
    }

    return Array.from(map.values()).sort((a, b) => a.label.localeCompare(b.label, 'ca'));
  }

  private formatDentistDisplayName(dentist: {
    firstName?: string;
    lastName?: string;
    name?: string;
    fullName?: string;
  }): string {
    if (dentist.name?.trim()) {
      return dentist.name;
    }

    if (dentist.fullName?.trim()) {
      return dentist.fullName;
    }

    const firstName = dentist.firstName?.trim() ?? '';
    const lastName = dentist.lastName?.trim() ?? '';
    const composedName = `${firstName} ${lastName}`.trim();

    return composedName || 'Odontoleg no disponible';
  }

  private normalizeVisitDate(value: string): string {
    if (!value) {
      return value;
    }

    return value.length === 16 ? `${value}:00` : value;
  }

  private prepareSave(formValue: AppointmentFormValue, editingAppointmentId?: number): boolean {
    const conflictAlert = this.conflictValidator.findConflict(
      formValue,
      this.allAppointments(),
      this.treatmentOptions(),
      (value) => this.formatTime(value),
      editingAppointmentId,
    );
    if (conflictAlert) {
      this.editorAlert.set(conflictAlert);
      return false;
    }

    this.isSaving.set(true);
    this.editorAlert.set(null);
    return true;
  }

  private generateCalendarDays(): CalendarDay[] {
    const current = this.currentDate();
    const year = current.getFullYear();
    const month = current.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    let firstDayWeek = firstDay.getDay() - 1;
    if (firstDayWeek < 0) {
      firstDayWeek = 6;
    }

    const days: CalendarDay[] = [];
    const today = new Date();
    const selected = this.selectedDate();

    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = firstDayWeek - 1; i >= 0; i--) {
      const date = new Date(year, month - 1, prevMonthLastDay - i);
      days.push({
        date,
        day: prevMonthLastDay - i,
        isCurrentMonth: false,
        isToday: false,
        isSelected: false,
        appointmentsCount: this.getAppointmentsForDate(date),
      });
    }

    for (let day = 1; day <= lastDay.getDate(); day++) {
      const date = new Date(year, month, day);
      days.push({
        date,
        day,
        isCurrentMonth: true,
        isToday: this.isSameDay(date, today),
        isSelected: this.isSameDay(date, selected),
        appointmentsCount: this.getAppointmentsForDate(date),
      });
    }

    const remainingDays = 7 - (days.length % 7);
    if (remainingDays < 7) {
      for (let day = 1; day <= remainingDays; day++) {
        const date = new Date(year, month + 1, day);
        days.push({
          date,
          day,
          isCurrentMonth: false,
          isToday: false,
          isSelected: false,
          appointmentsCount: this.getAppointmentsForDate(date),
        });
      }
    }

    return days;
  }

  private getAppointmentsForDate(date: Date): number {
    return this.allAppointments().filter((appointment) => {
      const appointmentDate = new Date(appointment.visitDate);
      return this.isSameDay(appointmentDate, date);
    }).length;
  }

  private isSameDay(date1: Date, date2: Date): boolean {
    return date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate();
  }
}
