import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { CalendarioComponent } from './calendario/calendario.component';
import { AgendaComponent } from './agenda/agenda.component';
import { AppointmentEditorComponent, AppointmentEditorSubmit } from './appointment-editor/appointment-editor.component';
import { AppointmentStore } from './appointment.store';
import { AppointmentEditorSelection, UpdateAppointmentOutcome } from './appointment.models';

@Component({
  selector: 'app-appointment',
  imports: [CalendarioComponent, AgendaComponent, AppointmentEditorComponent],
  templateUrl: './appointment.html',
  styleUrl: './appointment.css',
  providers: [AppointmentStore],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Appointment implements OnInit {
  readonly store = inject(AppointmentStore);

  isEditorOpen = false;
  isDeleteConfirmOpen = false;
  isBoxAdjustedModalOpen = false;
  boxAdjustedMessage = '';
  deletingAppointmentId: number | null = null;
  editorMode: 'create' | 'edit' = 'create';
  editingAppointmentId: number | null = null;
  editorInitialValue: AppointmentEditorSubmit | null = null;

  ngOnInit(): void {
    this.store.initialize();
  }

  onNewAppointmentRequested(): void {
    this.store.clearEditorAlert();
    this.store.resetEditorReferenceOptions();
    this.editorMode = 'create';
    this.editingAppointmentId = null;
    this.editorInitialValue = null;
    this.isEditorOpen = true;
  }

  onEditAppointmentRequested(appointmentId: number): void {
    const appointment = this.store.getAppointmentById(appointmentId);

    if (!appointment) {
      return;
    }

    this.store.clearEditorAlert();
    this.store.resetEditorReferenceOptions();
    this.editorMode = 'edit';
    this.editingAppointmentId = appointmentId;
    this.editorInitialValue = {
      patient: appointment.patient.id,
      dentist: appointment.dentist.id,
      treatment: appointment.treatment.id,
      visitDate: appointment.visitDate,
      consultationReason: appointment.consultationReason,
    };

    const currentSelection: AppointmentEditorSelection = {
      dentist: appointment.dentist.id,
      treatment: appointment.treatment.id,
      visitDateLocal: this.toLocalDateTimeInput(appointment.visitDate),
    };
    this.store.refreshDentistOptionsForSelection(currentSelection);
    this.store.refreshTreatmentOptionsForSelection(currentSelection);

    this.isEditorOpen = true;
  }

  onDeleteAppointmentRequested(appointmentId: number): void {
    this.deletingAppointmentId = appointmentId;
    this.isDeleteConfirmOpen = true;
  }

  onDeleteModalClose(): void {
    if (this.store.isSaving()) {
      return;
    }

    this.isDeleteConfirmOpen = false;
    this.deletingAppointmentId = null;
  }

  onDeleteConfirm(): void {
    if (this.deletingAppointmentId === null) {
      return;
    }

    this.store.deleteAppointment(this.deletingAppointmentId, () => {
      this.onDeleteModalClose();
    });
  }

  onBoxAdjustedModalClose(): void {
    this.isBoxAdjustedModalOpen = false;
    this.boxAdjustedMessage = '';
  }

  onEditorClose(): void {
    if (this.store.isSaving()) {
      return;
    }

    this.isEditorOpen = false;
    this.store.clearEditorAlert();
  }

  onEditorSelectionChanged(selection: AppointmentEditorSelection): void {
    this.store.refreshDentistOptionsForSelection(selection);
    this.store.refreshTreatmentOptionsForSelection(selection);
  }

  onEditorSave(payload: AppointmentEditorSubmit): void {
    if (this.editorMode === 'create') {
      this.store.createAppointment(payload, () => {
        this.isEditorOpen = false;
      });
      return;
    }

    if (this.editingAppointmentId === null) {
      return;
    }

    this.store.updateAppointment(
      this.editingAppointmentId,
      payload,
      (outcome) => this.handleUpdateOutcome(outcome),
    );
  }

  private handleUpdateOutcome(outcome: UpdateAppointmentOutcome): void {
    this.isEditorOpen = false;
  }

  private toLocalDateTimeInput(value: string): string {
    const date = new Date(value);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');

    return `${year}-${month}-${day}T${hours}:${minutes}`;
  }
}
