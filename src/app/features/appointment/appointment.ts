import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AppointmentService, AppointmentResponse } from '@services/appointment.service';

interface CalendarDay {
  date: Date;
  day: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
  appointmentsCount: number;
}

@Component({
  selector: 'app-appointment',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './appointment.html',
  styleUrl: './appointment.css',
})
export class Appointment implements OnInit {
  private appointmentService = inject(AppointmentService);

  // Signals
  allAppointments = signal<AppointmentResponse[]>([]);
  currentDate = signal<Date>(new Date());
  selectedDate = signal<Date | null>(new Date());
  isLoading = signal(false);

  // Computed properties
  currentMonth = computed(() => {
    return this.currentDate().toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
  });

  calendarDays = computed(() => {
    return this.generateCalendarDays();
  });

  selectedDayAppointments = computed(() => {
    const selected = this.selectedDate();
    if (!selected) return [];

    return this.allAppointments().filter(appointment => {
      const appointmentDate = new Date(appointment.visitDate);
      return this.isSameDay(appointmentDate, selected);
    }).sort((a, b) => new Date(a.visitDate).getTime() - new Date(b.visitDate).getTime());
  });


  weekDays = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

  ngOnInit(): void {
    this.selectedDate.set(new Date());
    this.loadAppointments();
  }

  loadAppointments(): void {
    this.isLoading.set(true);
    this.appointmentService.getAppointments().subscribe({
      next: (data) => {
        this.allAppointments.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error loading appointments:', err);
        this.isLoading.set(false);
      }
    });
  }

  generateCalendarDays(): CalendarDay[] {
    const current = this.currentDate();
    const year = current.getFullYear();
    const month = current.getMonth();
    
    // Primer día del mes
    const firstDay = new Date(year, month, 1);
    // Último día del mes
    const lastDay = new Date(year, month + 1, 0);
    
    // Ajustar para que la semana empiece en lunes (0 = domingo -> 6, 1 = lunes -> 0)
    let firstDayWeek = firstDay.getDay() - 1;
    if (firstDayWeek < 0) firstDayWeek = 6;
    
    const days: CalendarDay[] = [];
    const today = new Date();
    const selected = this.selectedDate();
    
    // Días del mes anterior
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = firstDayWeek - 1; i >= 0; i--) {
      const date = new Date(year, month - 1, prevMonthLastDay - i);
      days.push({
        date,
        day: prevMonthLastDay - i,
        isCurrentMonth: false,
        isToday: false,
        isSelected: false,
        appointmentsCount: this.getAppointmentsForDate(date)
      });
    }
    
    // Días del mes actual
    for (let day = 1; day <= lastDay.getDate(); day++) {
      const date = new Date(year, month, day);
      days.push({
        date,
        day,
        isCurrentMonth: true,
        isToday: this.isSameDay(date, today),
        isSelected: selected ? this.isSameDay(date, selected) : false,
        appointmentsCount: this.getAppointmentsForDate(date)
      });
    }
    
    // Días del mes siguiente para completar la última semana
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
          appointmentsCount: this.getAppointmentsForDate(date)
        });
      }
    }
    
    return days;
  }

  getAppointmentsForDate(date: Date): number {
    return this.allAppointments().filter(appointment => {
      const appointmentDate = new Date(appointment.visitDate);
      return this.isSameDay(appointmentDate, date);
    }).length;
  }

  isSameDay(date1: Date, date2: Date): boolean {
    return date1.getFullYear() === date2.getFullYear() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getDate() === date2.getDate();
  }

  selectDay(day: CalendarDay): void {
    if (!day.isCurrentMonth) return;
    this.selectedDate.set(day.date);
  }

  getAppointmentsListForDate(date: Date): AppointmentResponse[] {
    return this.allAppointments().filter(appointment => {
      const appointmentDate = new Date(appointment.visitDate);
      return this.isSameDay(appointmentDate, date);
    }).sort((a, b) => new Date(a.visitDate).getTime() - new Date(b.visitDate).getTime());
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
    this.currentDate.set(new Date());
    this.selectedDate.set(new Date());
  }

  formatTime(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  }

  // Handler for the 'Nueva cita' button. Placeholder to open a create form/modal.
  onAddAppointment(): void {
    // TODO: integrate a create-appointment modal or navigate to a creation route
    console.log('Nueva cita clicked');
  }
}
