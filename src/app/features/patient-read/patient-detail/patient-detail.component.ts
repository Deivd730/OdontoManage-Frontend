import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { PatientResponse } from '../../../core/services/patient.service';

@Component({
  selector: 'app-patient-detail',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <section class="patient-detail">
      @if (!selectedPatient) {
        <div class="detail-empty">
          <h2>Selecciona un paciente</h2>
          <p>Elige un paciente en la lista para ver su informacion completa.</p>
        </div>
      } @else {
        <div class="detail-header">
          <div>
            <h2>{{ selectedPatient.firstName }} {{ selectedPatient.lastName }}</h2>
            <p>DNI {{ selectedPatient.nationalId }}</p>
          </div>
          <div class="detail-actions">
            @if (!isEditing) {
              <button class="btn ghost" (click)="startEdit.emit()">Edita</button>
              <button class="btn danger" (click)="deletePatient.emit()" [disabled]="isLoading">Elimina</button>
            } @else {
              <button class="btn ghost" (click)="cancelEdit.emit()">Cancel·la</button>
              <button class="btn primary" (click)="saveEdit.emit()" [disabled]="isLoading">Desa</button>
            }
          </div>
        </div>

        @if (!isEditing) {
          <div class="detail-grid">
            <div class="detail-card">
              <h3>Contacto</h3>
              <p><strong>TTelèfon:</strong> {{ selectedPatient.phone || 'No registrado' }}</p>
              <p><strong>Email:</strong> {{ selectedPatient.email || 'No registrado' }}</p>
              <p><strong>Direccion:</strong> {{ selectedPatient.address || 'No registrada' }}</p>
            </div>
            <div class="detail-card">
              <h3>Salud</h3>
              <p><strong>Estado:</strong> {{ selectedPatient.healthStatus || 'No registrado' }}</p>
              <p><strong>Antecedentes:</strong> {{ selectedPatient.familyHistory || 'No registrado' }}</p>
              <p><strong>Habitos:</strong> {{ selectedPatient.lifestyleHabits || 'No registrado' }}</p>
              <p><strong>Alergias:</strong> {{ selectedPatient.medicationAllergies || 'No registrado' }}</p>
            </div>
            <div class="detail-card">
              <h3>Facturacion</h3>
              <p><strong>Seguro Social:</strong> {{ selectedPatient.socialSecurityNumber || 'No registrado' }}</p>
              <p><strong>Datos:</strong> {{ selectedPatient.billingData || 'No registrado' }}</p>
              <p><strong>Registro:</strong> {{ selectedPatient.registrationDate | date: 'mediumDate' }}</p>
            </div>
          </div>
        } @else {
          <form [formGroup]="editForm" class="edit-form">
            <div class="form-grid">
              <label>
                Nombre
                <input type="text" formControlName="firstName" [class.input-error]="isFieldInvalid('firstName')" />
                @if (hasError('firstName', 'required')) {
                  <span class="error">El nombre es requerido</span>
                }
              </label>
              <label>
                Apellido
                <input type="text" formControlName="lastName" [class.input-error]="isFieldInvalid('lastName')" />
                @if (hasError('lastName', 'required')) {
                  <span class="error">El apellido es requerido</span>
                }
              </label>
              <label>
                DNI
                <input type="text" formControlName="nationalId" [class.input-error]="isFieldInvalid('nationalId')" />
                @if (hasError('nationalId', 'required')) {
                  <span class="error">El DNI es requerido</span>
                }
              </label>
              <label>
                Seguro Social
                <input type="text" formControlName="socialSecurityNumber" />
              </label>
              <label>
                Telefono
                <input type="text" formControlName="phone" />
                @if (hasError('phone', 'pattern')) {
                  <span class="error">Minimo 9 digitos</span>
                }
              </label>
              <label>
                Email
                <input type="email" formControlName="email" />
                @if (hasError('email', 'email')) {
                  <span class="error">Email invalido</span>
                }
              </label>
              <label class="full">
                Direccion
                <input type="text" formControlName="address" />
              </label>
              <label class="full">
                Facturacion
                <input type="text" formControlName="billingData" />
              </label>
              <label class="full">
                Estado de salud
                <input type="text" formControlName="healthStatus" />
              </label>
              <label class="full">
                Antecedentes familiares
                <input type="text" formControlName="familyHistory" />
              </label>
              <label class="full">
                Habitos de vida
                <input type="text" formControlName="lifestyleHabits" />
              </label>
              <label class="full">
                Alergias a medicamentos
                <input type="text" formControlName="medicationAllergies" />
              </label>
            </div>
          </form>
        }
      }
    </section>
  `
})
export class PatientDetailComponent {
  @Input() selectedPatient: PatientResponse | null = null;
  @Input() isEditing = false;
  @Input() isLoading = false;
  @Input() editForm!: FormGroup;

  @Output() startEdit = new EventEmitter<void>();
  @Output() cancelEdit = new EventEmitter<void>();
  @Output() saveEdit = new EventEmitter<void>();
  @Output() deletePatient = new EventEmitter<void>();

  isFieldInvalid(field: string): boolean {
    const control = this.editForm.get(field);
    return !!(control && control.invalid && control.touched);
  }

  hasError(field: string, error: string): boolean {
    const control = this.editForm.get(field);
    return !!(control && control.hasError(error) && control.touched);
  }
}
