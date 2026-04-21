export interface BaseOption {
  id: number;
  label: string;
}

export interface PatientOption extends BaseOption {
  hasInfectiousDiseases?: boolean;
  infectiousDiseases?: string | null;
}

export interface TreatmentOption extends BaseOption {
  durationMinutes: number;
}

export interface DentistOption extends BaseOption {
  availableDays?: string | null;
  disabled?: boolean;
}

export interface AppointmentFormValue {
  patient: number;
  dentist: number;
  treatment: number;
  visitDate: string;
  consultationReason?: string;
}

export interface AppointmentEditorAlert {
  title: string;
  message: string;
  recommendations: string[];
}

export interface AppointmentEditorSelection {
  dentist: number;
  treatment: number;
  visitDateLocal: string;
}

export interface UpdateAppointmentOutcome {
  manualBoxChanged: boolean;
  selectedBoxId: number | null;
  assignedBoxLabel: string | null;
  boxReassigned: boolean;
}
