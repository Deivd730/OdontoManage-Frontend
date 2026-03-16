import { Component, inject, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { AppointmentResponse } from '@services/appointment.service';

interface DialogData {
  date: Date;
  appointments: AppointmentResponse[];
}

@Component({
  selector: 'app-appointment-day-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule],
  template: `
  <div class="dialog-header">
    <h3>Citas del día - {{ data.date | date:'fullDate':'':'es-ES' }}</h3>
    <button mat-dialog-close class="close-btn">✕</button>
  </div>

  <div class="dialog-body">
    <div *ngIf="data.appointments.length === 0" class="empty">No hay citas para este día.</div>

    <div *ngFor="let ap of data.appointments" class="appointment-row">
      <div class="time">{{ ap.visitDate | date:'shortTime':'':'es-ES' }}</div>
      <div class="info">
        <div class="patient">{{ ap.patient.firstName }} {{ ap.patient.lastName }}</div>
        <div class="meta">{{ ap.treatment.name }} • {{ ap.dentist.name }} • {{ ap.box.name }}</div>
        
      </div>
    </div>
  </div>
  `,
  styles: [
    `
    :host { display: block; min-width: 320px; }
    .dialog-header { display:flex; justify-content:space-between; align-items:center; gap:1rem; }
    .dialog-header h3 { margin:0; font-size:1.1rem; }
    .close-btn { background:transparent; border:none; cursor:pointer; font-size:1.2rem; }
    .dialog-body { margin-top:1rem; max-height:60vh; overflow:auto; }
    .appointment-row { display:flex; gap:1rem; padding:0.6rem 0; border-bottom:1px solid #eee; }
    .time { min-width:64px; font-weight:700; color:#4CAF50; }
    .patient { font-weight:600; }
    .meta { color:#666; font-size:0.9rem; }
    .reason { margin-top:0.25rem; color:#333; font-size:0.9rem; }
    .empty { padding:1rem; color:#666; }
    `
  ]
})
export class AppointmentDayDialog {
  data = inject(MAT_DIALOG_DATA) as DialogData;
  dialogRef = inject(MatDialogRef);
}
