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
          title: 'Cita no trobada',
          message: 'No s\'ha trobat la cita indicada.',
          recommendations: ['Recarrega l\'agenda i torna-ho a provar.'],
        };
      }

      if (backendMessage.includes('does not work on')) {
        const availableDays = this.translateAvailableDays(this.extractAvailableDays(backendMessageRaw));
        return {
          title: 'Odontoleg fora de l\'agenda setmanal',
          message: availableDays
            ? `Aquest odontoleg no treballa el dia seleccionat. Dies actius: ${availableDays}.`
            : 'Aquest odontoleg no treballa el dia seleccionat.',
          recommendations: [
            'Canvia la data de la cita a un dia habilitat.',
            'Selecciona un altre odontoleg disponible per a aquell dia.',
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
            title: 'Odontoleg ocupat',
            message: 'L\'odontoleg ja te una cita solapada en aquesta franja horaria.',
            recommendations: ['Prova una altra hora.', 'Selecciona un altre odontoleg.'],
          };
        }

        if (backendMessage.includes('available') || backendMessage.includes('disponible')) {
          return {
            title: 'Odontoleg no disponible',
            message: 'L\'odontoleg no esta disponible en aquesta hora. Pot ser per agenda o disponibilitat setmanal.',
            recommendations: ['Ajusta hora o odontoleg.'],
          };
        }

        if (backendMessage.includes('special') || backendMessage.includes('especial')) {
          return {
            title: 'Especialitat incompatible',
            message: 'L\'odontoleg no es especialista en aquest tractament.',
            recommendations: ['Selecciona un odontoleg amb l\'especialitat adequada.'],
          };
        }
      }

      if (backendMessage.includes('only auxiliars and admins')) {
        return {
          title: 'Permisos insuficients',
          message: 'No tens permisos per crear o modificar cites.',
          recommendations: ['Sol\'licita acces a un administrador.'],
        };
      }

      if (
        backendMessage.includes('between 09:00 and 17:00') ||
        backendMessage.includes('appointments must be scheduled between')
      ) {
        return {
          title: 'Horari fora de rang',
          message: 'La cita ha d\'estar entre les 09:00 i les 17:00, incloent buffer de 5 minuts.',
          recommendations: ['Ajusta l\'hora d\'inici.'],
        };
      }

      if (
        backendMessage.includes('no available boxes') ||
        backendMessage.includes('already booked for the selected time slot')
      ) {
        return {
          title: 'No hi ha box disponible',
          message: 'No hi ha box disponible per a aquest horari.',
          recommendations: ['Prova una altra hora o dia.'],
        };
      }

      if (backendMessage.includes('patient not found')) {
        return {
          title: 'Pacient no trobat',
          message: 'Pacient no trobat.',
          recommendations: ['Verifica el pacient seleccionat.'],
        };
      }

      if (backendMessage.includes('dentist not found')) {
        return {
          title: 'Odontoleg no trobat',
          message: 'Odontoleg no trobat.',
          recommendations: ['Verifica l\'odontoleg seleccionat.'],
        };
      }

      if (backendMessage.includes('treatment not found')) {
        return {
          title: 'Tractament no trobat',
          message: 'Tractament no trobat.',
          recommendations: ['Selecciona un tractament valid.'],
        };
      }

      if (backendMessage.includes('visitdate is required')) {
        return {
          title: 'Data requerida',
          message: 'Has d\'indicar data i hora de la cita.',
          recommendations: ['Completa la data i hora del formulari.'],
        };
      }

      if (backendMessage.includes('patient') || backendMessage.includes('paciente')) {
        if (
          backendMessage.includes('assigned') ||
          backendMessage.includes('ocup') ||
          backendMessage.includes('already')
        ) {
          return {
            title: 'Pacient ocupat',
            message: 'El pacient ja te una altra cita en aquest horari.',
            recommendations: ['Selecciona un altre horari per al pacient.'],
          };
        }
      }

      if (error.status === 409) {
        return {
          title: 'Conflicte d\'agenda',
          message: 'Existeix un conflicte d\'agenda per a la cita sol\'licitada.',
          recommendations: ['Prova amb un altre horari.'],
        };
      }

      if (error.status === 400) {
        const details = this.getBackendMessage(error);
        return {
          title: 'Dades no valides',
          message: details
            ? `Les dades de la cita no son valides. Detall: ${details}`
            : 'Les dades de la cita no son valides.',
          recommendations: ['Revisa les dades del formulari i torna-ho a provar.'],
        };
      }

      if (error.status === 0) {
        return {
          title: 'Sense connexio',
          message: 'No s\'ha pogut connectar amb el servidor.',
          recommendations: ['Comprova la connexio i torna-ho a provar.'],
        };
      }
    }

    if (action === 'delete') {
      return {
        title: 'No s\'ha pogut eliminar la cita',
        message: 'No s\'ha pogut eliminar la cita.',
        recommendations: ['Torna-ho a provar en uns segons.'],
      };
    }

    if (action === 'update') {
      return {
        title: 'No s\'ha pogut actualitzar la cita',
        message: 'No s\'ha pogut actualitzar la cita.',
        recommendations: ['Revisa els canvis i torna-ho a provar.'],
      };
    }

    return {
      title: 'No s\'ha pogut crear la cita',
      message: 'No s\'ha pogut crear la cita.',
      recommendations: ['Revisa les dades i torna-ho a provar.'],
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
      .map((day) => day.trim().replace(/\.+$/g, ''))
      .filter(Boolean)
      .map((day) => map[day] ?? day)
      .join(', ');
  }
}
