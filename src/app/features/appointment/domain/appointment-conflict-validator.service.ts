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
        title: 'Dentista ocupado en esa hora',
        message: `El dentista seleccionado ya tiene una cita a las ${formatTime(conflictingDentist.visitDate)}.`,
        recommendations: ['Selecciona otra hora para la cita.', 'Elige otro dentista disponible.'],
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
        title: 'Paciente con cita en esa hora',
        message: `El paciente seleccionado ya tiene una cita a las ${formatTime(conflictingPatient.visitDate)}.`,
        recommendations: ['Selecciona otro horario para el paciente.'],
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
