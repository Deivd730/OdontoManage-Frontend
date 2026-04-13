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
  AppointmentFormValue,
  BaseOption,
  DentistOption,
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

  readonly patientOptions = signal<BaseOption[]>([]);
  readonly dentistOptions = signal<DentistOption[]>([]);
  readonly boxOptions = signal<BaseOption[]>([]);
  readonly treatmentOptions = signal<TreatmentOption[]>([]);

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
        this.dentistOptions.set(
          this.uniqueOptions(
            dentists.map((dentist) => ({
              id: dentist.id,
              label: this.formatDentistDisplayName(dentist),
              availableDays: dentist.availableDays || null,
            })),
          ),
        );
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
      this.uniqueOptions(
        appointments.map((appointment) => ({
          id: appointment.treatment.id,
          label: appointment.treatment.name,
          durationMinutes: appointment.treatment.durationMinutes ?? 30,
        })),
      ),
    );
  }

  private buildDentistOptionsFromAppointments(appointments: AppointmentResponse[]): DentistOption[] {
    return this.uniqueOptions(
      appointments.map((appointment) => ({
        id: appointment.dentist.id,
        label: this.formatDentistDisplayName(appointment.dentist),
        availableDays: (appointment.dentist as unknown as { availableDays?: string }).availableDays || null,
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
