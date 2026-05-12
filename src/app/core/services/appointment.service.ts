import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { buildApiUrl } from '../utils/url';

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
  treatment?: {
    id: number;
    name: string;
  } | null;
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

export interface AvailableTreatment {
  id: number;
  name: string;
  description?: string;
  durationMinutes?: number;
}

// Interface para Appointment
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
  treatment: number;
  visitDate: string;
  consultationReason?: string;
  parentAppointment?: number | null;
  box?: number;
}

@Injectable({
  providedIn: 'root',
})
export class AppointmentService {
  private http = inject(HttpClient);
  private readonly apiUrl = buildApiUrl('/api/appointments');

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
   * Obtener citas por box
   * @param boxId ID del box
   */
  getAppointmentsByBox(boxId: number): Observable<AppointmentResponse[]> {
    return this.http.get<AppointmentResponse[]>(`${this.apiUrl}/box/${boxId}`);
  }

  getAvailableDentistsByTreatment(
    treatmentId: number,
    visitDate: string,
  ): Observable<Dentist[]> {
    const params = new HttpParams().set('visitDate', visitDate);
    return this.http.get<Dentist[]>(
      `${this.apiUrl}/treatment/${treatmentId}/available-dentists`,
      { params },
    );
  }

  getAvailableTreatmentsByDentist(dentistId: number): Observable<AvailableTreatment[]> {
    return this.http.get<AvailableTreatment[]>(
      `${this.apiUrl}/dentist/${dentistId}/available-treatments`,
    );
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
}
