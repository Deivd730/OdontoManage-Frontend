import { Injectable, computed, inject, signal } from '@angular/core';
import { AppointmentResponse, AppointmentService } from '@services/appointment.service';

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

  readonly allAppointments = signal<AppointmentResponse[]>([]);
  readonly currentDate = signal<Date>(new Date());
  readonly selectedDate = signal<Date>(new Date());
  readonly isLoading = signal(false);

  readonly weekDays = ['Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab', 'Dom'] as const;

  readonly currentMonth = computed(() => {
    return this.currentDate().toLocaleDateString('es-ES', {
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
    return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  }

  formatDateTime(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleString('es-ES', {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  getDentistDisplayName(appointment: AppointmentResponse): string {
    const dentist = appointment.dentist as unknown as {
      name?: string;
      fullName?: string;
      firstName?: string;
      lastName?: string;
    };

    if (dentist?.name?.trim()) {
      return dentist.name;
    }

    if (dentist?.fullName?.trim()) {
      return dentist.fullName;
    }

    const firstName = dentist?.firstName?.trim() ?? '';
    const lastName = dentist?.lastName?.trim() ?? '';
    const composedName = `${firstName} ${lastName}`.trim();

    return composedName || 'Dentista no disponible';
  }

  getBoxDisplayName(appointment: AppointmentResponse): string {
    return `Box ${appointment.box.id}`;
  }

  formatDate(date: Date): string {
    return date.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  private loadAppointments(): void {
    this.isLoading.set(true);
    this.appointmentService.getAppointments().subscribe({
      next: (data) => {
        this.allAppointments.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error loading appointments:', err);
        this.isLoading.set(false);
      },
    });
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
