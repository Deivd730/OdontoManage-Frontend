import { HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { AppointmentEditorAlert } from '../appointment.models';

interface AppointmentErrorDescriptor {
  title: string;
  message: string;
  recommendations: string[];
}

@Injectable({
  providedIn: 'root',
})
export class AppointmentErrorMapperService {
  map(error: unknown, action: 'create' | 'update' | 'delete'): AppointmentEditorAlert {
    return this.describe(error, action);
  }

  private describe(
    error: unknown,
    action: 'create' | 'update' | 'delete',
  ): AppointmentErrorDescriptor {
    if (error instanceof HttpErrorResponse) {
      const backendMessageRaw = this.getBackendMessage(error);
      const backendMessage = backendMessageRaw.toLowerCase();

      if (error.status === 404) {
        return {
          title: 'Cita no encontrada',
          message: 'La cita indicada no fue encontrada.',
          recommendations: ['Recarga la agenda y vuelve a intentarlo.'],
        };
      }

      if (backendMessage.includes('does not work on')) {
        const availableDays = this.translateAvailableDays(this.extractAvailableDays(backendMessageRaw));
        return {
          title: 'Dentista fuera de agenda semanal',
          message: availableDays
            ? `Ese dentista no trabaja el dia seleccionado. Dias activos: ${availableDays}.`
            : 'Ese dentista no trabaja el dia seleccionado.',
          recommendations: [
            'Cambia la fecha de la cita a un dia habilitado.',
            'Selecciona otro dentista disponible para ese dia.',
          ],
        };
      }

      if (backendMessage.includes('dentist') || backendMessage.includes('odont')) {
        if (
          backendMessage.includes('assigned') ||
          backendMessage.includes('ocup') ||
          backendMessage.includes('already')
        ) {
          return {
            title: 'Dentista ocupado',
            message: 'El dentista ya tiene una cita superpuesta en ese tramo horario.',
            recommendations: ['Prueba otra hora.', 'Selecciona otro dentista.'],
          };
        }

        if (backendMessage.includes('available') || backendMessage.includes('disponible')) {
          return {
            title: 'Dentista no disponible',
            message: 'El dentista no esta disponible en esa hora. Puede deberse a agenda o disponibilidad semanal.',
            recommendations: ['Ajusta hora o dentista.'],
          };
        }

        if (backendMessage.includes('special') || backendMessage.includes('especial')) {
          return {
            title: 'Especialidad incompatible',
            message: 'El dentista no es especialista en ese tratamiento.',
            recommendations: ['Selecciona un dentista con la especialidad adecuada.'],
          };
        }
      }

      if (backendMessage.includes('only auxiliars and admins')) {
        return {
          title: 'Permisos insuficientes',
          message: 'No tienes permisos para crear o modificar citas.',
          recommendations: ['Solicita acceso a un administrador.'],
        };
      }

      if (
        backendMessage.includes('between 09:00 and 17:00') ||
        backendMessage.includes('appointments must be scheduled between')
      ) {
        return {
          title: 'Horario fuera de rango',
          message: 'La cita debe estar entre las 09:00 y las 17:00, incluyendo buffer de 5 minutos.',
          recommendations: ['Ajusta la hora de inicio.'],
        };
      }

      if (
        backendMessage.includes('no available boxes') ||
        backendMessage.includes('already booked for the selected time slot')
      ) {
        return {
          title: 'No hay box disponible',
          message: 'No hay box disponible para ese horario.',
          recommendations: ['Prueba otra hora o dia.'],
        };
      }

      if (backendMessage.includes('patient not found')) {
        return {
          title: 'Paciente no encontrado',
          message: 'Paciente no encontrado.',
          recommendations: ['Verifica el paciente seleccionado.'],
        };
      }

      if (backendMessage.includes('dentist not found')) {
        return {
          title: 'Dentista no encontrado',
          message: 'Dentista no encontrado.',
          recommendations: ['Verifica el dentista seleccionado.'],
        };
      }

      if (backendMessage.includes('treatment not found')) {
        return {
          title: 'Tratamiento no encontrado',
          message: 'Tratamiento no encontrado.',
          recommendations: ['Selecciona un tratamiento valido.'],
        };
      }

      if (backendMessage.includes('visitdate is required')) {
        return {
          title: 'Fecha requerida',
          message: 'Debes indicar fecha y hora de la cita.',
          recommendations: ['Completa la fecha y hora del formulario.'],
        };
      }

      if (backendMessage.includes('patient') || backendMessage.includes('paciente')) {
        if (
          backendMessage.includes('assigned') ||
          backendMessage.includes('ocup') ||
          backendMessage.includes('already')
        ) {
          return {
            title: 'Paciente ocupado',
            message: 'El paciente ya tiene otra cita en ese horario.',
            recommendations: ['Selecciona otro horario para el paciente.'],
          };
        }
      }

      if (error.status === 409) {
        return {
          title: 'Conflicto de agenda',
          message: 'Existe un conflicto de agenda para la cita solicitada.',
          recommendations: ['Prueba con otro horario.'],
        };
      }

      if (error.status === 400) {
        const details = this.getBackendMessage(error);
        return {
          title: 'Datos no validos',
          message: details
            ? `Los datos de la cita no son validos. Detalle: ${details}`
            : 'Los datos de la cita no son validos.',
          recommendations: ['Revisa los datos del formulario y vuelve a intentarlo.'],
        };
      }

      if (error.status === 0) {
        return {
          title: 'Sin conexion',
          message: 'No se pudo conectar con el servidor.',
          recommendations: ['Comprueba tu conexion e intentalo de nuevo.'],
        };
      }
    }

    if (action === 'delete') {
      return {
        title: 'No se pudo eliminar la cita',
        message: 'No se pudo eliminar la cita.',
        recommendations: ['Intentalo nuevamente en unos segundos.'],
      };
    }

    if (action === 'update') {
      return {
        title: 'No se pudo actualizar la cita',
        message: 'No se pudo actualizar la cita.',
        recommendations: ['Revisa los cambios y vuelve a intentarlo.'],
      };
    }

    return {
      title: 'No se pudo crear la cita',
      message: 'No se pudo crear la cita.',
      recommendations: ['Revisa los datos y vuelve a intentarlo.'],
    };
  }

  private getBackendMessage(error: HttpErrorResponse): string {
    const payload = error.error;

    if (typeof payload === 'string') {
      return payload;
    }

    if (payload && typeof payload === 'object') {
      if ('errors' in payload && payload.errors && typeof payload.errors === 'object') {
        const messages = Object.values(payload.errors)
          .filter((value): value is string => typeof value === 'string')
          .map((message) => message.trim())
          .filter(Boolean);

        if (messages.length > 0) {
          return messages.join(' | ');
        }
      }

      if ('message' in payload && typeof payload.message === 'string') {
        return payload.message;
      }

      if ('error' in payload && typeof payload.error === 'string') {
        return payload.error;
      }
    }

    return error.message || '';
  }

  private extractAvailableDays(message: string): string | null {
    const match = message.match(/available days:\s*([^|]+)/i);
    const value = match?.[1]?.trim();
    return value || null;
  }

  private translateAvailableDays(days: string | null): string | null {
    if (!days) {
      return null;
    }

    const map: Record<string, string> = {
      Mon: 'Lunes',
      Tue: 'Martes',
      Wed: 'Miercoles',
      Thu: 'Jueves',
      Fri: 'Viernes',
      Sat: 'Sabado',
      Sun: 'Domingo',
    };

    return days
      .split(',')
      .map((day) => day.trim().replace(/\.+$/g, ''))
      .filter(Boolean)
      .map((day) => map[day] ?? day)
      .join(', ');
  }
}
