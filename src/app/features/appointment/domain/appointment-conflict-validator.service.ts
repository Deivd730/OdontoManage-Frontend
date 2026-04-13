import { Injectable } from '@angular/core';
import { AppointmentResponse } from '@services/appointment.service';
import {
  AppointmentEditorAlert,
  AppointmentFormValue,
  TreatmentOption,
} from '../appointment.models';

@Injectable({
  providedIn: 'root',
})
export class AppointmentConflictValidatorService {
  private static readonly BUFFER_MINUTES = 5;
  private static readonly FALLBACK_DURATION_MINUTES = 30;

  findConflict(
    formValue: AppointmentFormValue,
    appointments: readonly AppointmentResponse[],
    treatmentOptions: readonly TreatmentOption[],
    formatTime: (value: string) => string,
    editingAppointmentId?: number,
  ): AppointmentEditorAlert | null {
    const slot = this.getAppointmentSlot(formValue.visitDate, formValue.treatment, appointments, treatmentOptions);
    if (!slot) {
      return null;
    }

    const conflictingDentist = appointments.find((appointment) => {
      if (editingAppointmentId && appointment.id === editingAppointmentId) {
        return false;
      }

      return appointment.dentist.id === formValue.dentist && this.isOverlapping(appointment, slot);
    });

    if (conflictingDentist) {
      return {
        title: 'Odontoleg ocupat en aquesta hora',
        message: `L'odontoleg seleccionat ja te una cita a les ${formatTime(conflictingDentist.visitDate)}.`,
        recommendations: ['Selecciona una altra hora per a la cita.', 'Tria un altre odontoleg disponible.'],
      };
    }

    const conflictingPatient = appointments.find((appointment) => {
      if (editingAppointmentId && appointment.id === editingAppointmentId) {
        return false;
      }

      return appointment.patient.id === formValue.patient && this.isOverlapping(appointment, slot);
    });

    if (conflictingPatient) {
      return {
        title: 'Pacient amb cita en aquesta hora',
        message: `El pacient seleccionat ja te una cita a les ${formatTime(conflictingPatient.visitDate)}.`,
        recommendations: ['Selecciona un altre horari per al pacient.'],
      };
    }

    return null;
  }

  private getAppointmentSlot(
    visitDate: string,
    treatmentId: number,
    appointments: readonly AppointmentResponse[],
    treatmentOptions: readonly TreatmentOption[],
  ): { start: number; endWithBuffer: number } | null {
    const normalizedVisitDate = this.normalizeVisitDate(visitDate);
    const start = new Date(normalizedVisitDate).getTime();
    if (Number.isNaN(start)) {
      return null;
    }

    const durationWithBufferMs =
      (this.getTreatmentDuration(treatmentId, appointments, treatmentOptions) +
        AppointmentConflictValidatorService.BUFFER_MINUTES) *
      60 *
      1000;

    return {
      start,
      endWithBuffer: start + durationWithBufferMs,
    };
  }

  private isOverlapping(
    appointment: AppointmentResponse,
    targetSlot: { start: number; endWithBuffer: number },
  ): boolean {
    const existingStart = new Date(appointment.visitDate).getTime();
    const existingDuration =
      (appointment.treatment.durationMinutes || 0) + AppointmentConflictValidatorService.BUFFER_MINUTES;
    const existingEndWithBuffer = existingStart + existingDuration * 60 * 1000;

    return existingStart < targetSlot.endWithBuffer && existingEndWithBuffer > targetSlot.start;
  }

  private normalizeVisitDate(value: string): string {
    if (!value) {
      return value;
    }

    return value.length === 16 ? `${value}:00` : value;
  }

  private getTreatmentDuration(
    treatmentId: number,
    appointments: readonly AppointmentResponse[],
    treatmentOptions: readonly TreatmentOption[],
  ): number {
    const fromOptions = treatmentOptions.find((option) => option.id === treatmentId)?.durationMinutes;
    if (typeof fromOptions === 'number' && fromOptions > 0) {
      return fromOptions;
    }

    const fromAppointments = appointments.find(
      (appointment) => appointment.treatment.id === treatmentId,
    )?.treatment.durationMinutes;
    if (typeof fromAppointments === 'number' && fromAppointments > 0) {
      return fromAppointments;
    }

    return AppointmentConflictValidatorService.FALLBACK_DURATION_MINUTES;
  }
}
