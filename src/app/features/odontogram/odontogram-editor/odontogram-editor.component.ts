import { Component, OnInit, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { ToothComponent } from '@features/odontogram/tooth/tooth.component';
import { Odontogram, Pathology, ToothPathology } from '@models/odontogram';
import { OdontogramService } from '@services/odontogram.service';
import { finalize } from 'rxjs';
import { NotificationService } from '@services/notification.service';
import { PatientService } from '@services/patient.service';

@Component({
  selector: 'app-odontogram-editor',
  standalone: true,
  imports: [CommonModule, ToothComponent],
  templateUrl: './odontogram-editor.component.html',
  styleUrls: ['./odontogram-editor.component.css']
})
export class OdontogramEditorComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private odontogramService = inject(OdontogramService);
  private notificationService = inject(NotificationService);
  private patientService = inject(PatientService);

  private readonly ADULT_UPPER_TEETH = [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28];
  private readonly ADULT_LOWER_TEETH = [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38];
  private readonly CHILD_UPPER_TEETH = [55, 54, 53, 52, 51, 61, 62, 63, 64, 65];
  private readonly CHILD_LOWER_TEETH = [85, 84, 83, 82, 81, 71, 72, 73, 74, 75];
  private readonly WHOLE_TOOTH_FACE = 0;
  private readonly WHOLE_TOOTH_PATHOLOGY_IDS = new Set([3, 4, 5, 6]);

  // Herramientas de edicion
  pathologies: Pathology[] = [
    { id: 1, name: 'Caries', color: '#FF4136' },
    { id: 2, name: 'Obturacion', color: '#0074D9' },
    { id: 3, name: 'Corona', color: '#FFDC00' },
    { id: 4, name: 'Ausente', color: '#AAAAAA' },
    { id: 5, name: 'Endodoncia', color: '#B10DC9' },
    { id: 6, name: 'Exodoncia', color: '#111111' }
  ];

  selectedPathology = signal<Pathology | null>(null);
  odontogram = signal<Odontogram | null>(null);
  isLoading = signal(false);
  odontogramType = signal<'adult' | 'child'>('adult');

  upperRightTeeth = computed(() => this.odontogramType() === 'child'
    ? this.CHILD_UPPER_TEETH.slice(0, 5)
    : this.ADULT_UPPER_TEETH.slice(0, 8));
  upperLeftTeeth = computed(() => this.odontogramType() === 'child'
    ? this.CHILD_UPPER_TEETH.slice(5)
    : this.ADULT_UPPER_TEETH.slice(8));
  lowerRightTeeth = computed(() => this.odontogramType() === 'child'
    ? this.CHILD_LOWER_TEETH.slice(0, 5)
    : this.ADULT_LOWER_TEETH.slice(0, 8));
  lowerLeftTeeth = computed(() => this.odontogramType() === 'child'
    ? this.CHILD_LOWER_TEETH.slice(5)
    : this.ADULT_LOWER_TEETH.slice(8));

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      const id = Number(params['id']);
      if (Number.isFinite(id) && id > 0) {
        this.loadOdontogram(id);
      }
    });
  }

  loadOdontogram(patientId: number): void {
    this.isLoading.set(true);
    this.odontogramService.getOdontogramByPatient(patientId).subscribe({
      next: (res) => {
        if (res && res.length > 0) {
          const odontogram = this.enrichWithColors(res[0]);
          this.odontogram.set(odontogram);
          this.odontogramType.set(odontogram.type === 'child' ? 'child' : 'adult');
          this.isLoading.set(false);
          return;
        }

        // Si no hay odontograma todavia, inferimos el tipo por edad del paciente.
        this.patientService.getPatient(patientId).subscribe({
          next: (patient) => {
            const type = this.getTypeFromBirthDate(patient.birthDate);
            this.odontogramType.set(type);
            this.odontogram.set({
              patient: { id: patientId },
              type,
              toothPathologies: []
            });
            this.isLoading.set(false);
          },
          error: () => {
            // Fallback a adulto si no se puede leer la fecha de nacimiento.
            this.odontogramType.set('adult');
            this.odontogram.set({
              patient: { id: patientId },
              type: 'adult',
              toothPathologies: []
            });
            this.isLoading.set(false);
          }
        });
      },
      error: () => this.isLoading.set(false)
    });
  }

  private getTypeFromBirthDate(birthDate?: string): 'adult' | 'child' {
    if (!birthDate) {
      return 'adult';
    }

    const birth = new Date(birthDate);
    if (Number.isNaN(birth.getTime())) {
      return 'adult';
    }

    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }

    return age < 12 ? 'child' : 'adult';
  }

  private normalizeToothPathologies(value: unknown): ToothPathology[] {
    if (Array.isArray(value)) return value as ToothPathology[];
    if (value && typeof value === 'object') {
      return Object.values(value as Record<string, ToothPathology>);
    }
    return [];
  }

  private enrichWithColors(odontogram: Odontogram): Odontogram {
    const toothPathologies = this.normalizeToothPathologies((odontogram as any).toothPathologies);

    return {
      ...odontogram,
      toothPathologies: toothPathologies.map(item => ({
        ...item,
        pathology: {
          ...item.pathology,
          color: this.pathologies.find(p => p.id === item.pathology.id)?.color ?? item.pathology.color
        }
      }))
    };
  }

  private isWholeToothPathology(pathology: Pathology): boolean {
    return this.WHOLE_TOOTH_PATHOLOGY_IDS.has(pathology.id);
  }

  handleFaceClick(toothNumber: number, face: number): void {
    const activeTool = this.selectedPathology();

    if (!activeTool) {
      this.notificationService.error('Primero selecciona una patologia (Caries, Obturacion, etc.)');
      return;
    }

    this.odontogram.update(prev => {
      if (!prev) return null;

      const targetFace = this.isWholeToothPathology(activeTool) ? this.WHOLE_TOOTH_FACE : face;
      const isGlobalTool = this.isWholeToothPathology(activeTool);
      const pathologies = [...prev.toothPathologies];

      if (isGlobalTool) {
        const existingGlobalSameToolIdx = pathologies.findIndex(
          p =>
            p.tooth.toothNumber === toothNumber &&
            p.toothFace === this.WHOLE_TOOTH_FACE &&
            p.pathology.id === activeTool.id
        );

        if (existingGlobalSameToolIdx > -1) {
          pathologies.splice(existingGlobalSameToolIdx, 1);
          return { ...prev, toothPathologies: pathologies };
        }

        const withoutOtherGlobalStates = pathologies.filter(
          p => !(p.tooth.toothNumber === toothNumber && p.toothFace === this.WHOLE_TOOTH_FACE)
        );

        withoutOtherGlobalStates.push({
          tooth: { id: 0, toothNumber },
          pathology: activeTool,
          toothFace: this.WHOLE_TOOTH_FACE,
          status: 'Activo'
        });

        return { ...prev, toothPathologies: withoutOtherGlobalStates };
      }

      const existingIdx = pathologies.findIndex(
        p => p.tooth.toothNumber === toothNumber && p.toothFace === targetFace
      );

      if (existingIdx > -1) {
        if (pathologies[existingIdx].pathology.id === activeTool.id) {
          pathologies.splice(existingIdx, 1);
        } else {
          pathologies[existingIdx] = { ...pathologies[existingIdx], pathology: activeTool };
        }
      } else {
        pathologies.push({
          tooth: { id: 0, toothNumber },
          pathology: activeTool,
          toothFace: targetFace,
          status: 'Activo'
        });
      }

      return { ...prev, toothPathologies: pathologies };
    });
  }

  getPatosForTooth(num: number): ToothPathology[] {
    return this.odontogram()?.toothPathologies.filter(p => p.tooth.toothNumber === num) || [];
  }

  save(): void {
    const currentData = this.odontogram();
    if (!currentData) return;

    const dataToSend = {
      ...currentData,
      patient: { id: currentData.patient?.id ?? currentData.patient },
      toothPathologies: currentData.toothPathologies.map(tp => ({
        tooth: { toothNumber: tp.tooth.toothNumber },
        pathology: { id: tp.pathology.id },
        toothFace: tp.toothFace,
        status: tp.status
      }))
    };

    this.isLoading.set(true);
    this.odontogramService.save(dataToSend as Odontogram)
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (saved) => {
          const enriched = this.enrichWithColors(saved);
          this.odontogram.set(enriched);
          this.odontogramType.set(enriched.type === 'child' ? 'child' : 'adult');
          this.notificationService.success('Odontograma guardado correctamente');
        },
        error: (err) => {
          console.error('Error al guardar:', err.error);
          this.notificationService.error(err.error?.error || 'Error al guardar odontograma');
        }
      });
  }
}
