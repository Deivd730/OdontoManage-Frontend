import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment.development';

// Interfaces para las entidades relacionadas
export interface Patient {
  id: number;
  firstName: string;
  lastName: string;
  nationalId: string;
  email?: string;
  phone?: string;
}

export interface Dentist {
  id: number;
  name: string;
  license: string;
  specialty?: string;
}

export interface Box {
  id: number;
  name: string;
  description?: string;
}

export interface Treatment {
  id: number;
  name: string;
  description?: string;
  durationMinutes: number;
}

// Interface para Appointment
export interface Appointment {
  id?: number;
  patient: Patient | number;
  dentist: Dentist | number;
  box: Box | number;
  treatment: Treatment | number;
  visitDate: string | Date;
  consultationReason?: string;
  parentAppointment?: Appointment | number | null;
}

// Interface para la respuesta del backend
export interface AppointmentResponse {
  id: number;
  patient: Patient;
  dentist: Dentist;
  box: Box;
  treatment: Treatment;
  visitDate: string;
  consultationReason?: string;
  parentAppointment?: AppointmentResponse | null;
  relatedAppointments?: AppointmentResponse[];
  odontograms?: any[];
}

// Interface para crear/actualizar appointments
export interface CreateAppointmentRequest {
  patient: number;
  dentist: number;
  box: number;
  treatment: number;
  visitDate: string;
  consultationReason?: string;
  parentAppointment?: number | null;
}

@Injectable({
  providedIn: 'root',
})
export class AppointmentService {
  private http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/api/appointments`;

  /**
   * Obtener todas las citas
   * @param treatmentId Filtrar por ID de tratamiento (opcional)
   */
  getAppointments(treatmentId?: number): Observable<AppointmentResponse[]> {
    let params = new HttpParams();
    if (treatmentId) {
      params = params.set('treatment', treatmentId.toString());
    }
    return this.http.get<AppointmentResponse[]>(this.apiUrl, { params });
  }

  /**
   * Obtener una cita por ID
   * @param id ID de la cita
   */
  getAppointment(id: number): Observable<AppointmentResponse> {
    return this.http.get<AppointmentResponse>(`${this.apiUrl}/${id}`);
  }

  /**
   * Obtener citas por dentista
   * @param dentistId ID del dentista
   */
  getAppointmentsByDentist(dentistId: number): Observable<AppointmentResponse[]> {
    return this.http.get<AppointmentResponse[]>(`${this.apiUrl}/dentist/${dentistId}`);
  }

  /**
   * Obtener citas por paciente
   * @param patientId ID del paciente
   */
  getAppointmentsByPatient(patientId: number): Observable<AppointmentResponse[]> {
    return this.http.get<AppointmentResponse[]>(`${this.apiUrl}/patient/${patientId}`);
  }

  /**
   * Obtener citas por consultorio/box
   * @param boxId ID del consultorio
   */
  getAppointmentsByBox(boxId: number): Observable<AppointmentResponse[]> {
    return this.http.get<AppointmentResponse[]>(`${this.apiUrl}/box/${boxId}`);
  }

  /**
   * Crear una nueva cita
   * @param appointment Datos de la cita
   */
  createAppointment(appointment: CreateAppointmentRequest): Observable<AppointmentResponse> {
    return this.http.post<AppointmentResponse>(this.apiUrl, appointment);
  }

  /**
   * Actualizar una cita existente
   * @param id ID de la cita
   * @param appointment Datos actualizados de la cita
   */
  updateAppointment(id: number, appointment: Partial<CreateAppointmentRequest>): Observable<AppointmentResponse> {
    return this.http.put<AppointmentResponse>(`${this.apiUrl}/${id}`, appointment);
  }

  /**
   * Eliminar una cita
   * @param id ID de la cita
   */
  deleteAppointment(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  /**
   * Método helper para convertir Date a string ISO
   * @param date Fecha a convertir
   */
  formatDateForApi(date: Date): string {
    return date.toISOString();
  }

  /**
   * Método helper para parsear fecha de string a Date
   * @param dateString String de fecha
   */
  parseApiDate(dateString: string): Date {
    return new Date(dateString);
  }
}
