import { Component, OnInit, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { ToothComponent } from '@features/odontogram/tooth/tooth.component';
import { Odontogram, Pathology, ToothPathology } from '@models/odontogram';
import { OdontogramService } from '@services/odontogram.service';
import { PathologyService } from '@services/pathology.service';
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
  private pathologyService = inject(PathologyService);
  private notificationService = inject(NotificationService);
  private patientService = inject(PatientService);

  private readonly ADULT_UPPER_TEETH = [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28];
  private readonly ADULT_LOWER_TEETH = [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38];
  private readonly CHILD_UPPER_TEETH = [55, 54, 53, 52, 51, 61, 62, 63, 64, 65];
  private readonly CHILD_LOWER_TEETH = [85, 84, 83, 82, 81, 71, 72, 73, 74, 75];
  private readonly WHOLE_TOOTH_FACE = 0;

  // Herramientas de edicion - cargadas desde backend
  pathologies = signal<Pathology[]>([]);

  selectedPathology = signal<Pathology | null>(null);
  odontogram = signal<Odontogram | null>(null);
  isLoading = signal(false);
  odontogramType = signal<'adult' | 'child'>('adult');
  activeTab = signal<'pathologies' | 'treatments'>('pathologies');
  isToggleAbsenceMode = signal(false);

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
    // Cargar patologías desde el backend
    this.loadPathologies();
    
    this.route.params.subscribe(params => {
      const id = Number(params['id']);
      if (Number.isFinite(id) && id > 0) {
        this.loadOdontogram(id);
      }
    });
  }

  private loadPathologies(): void {
    this.pathologyService.getPathologies().subscribe({
      next: (data) => {
        // Mapear description a name si es necesario
        let mappedPathologies = data.map(p => ({
          ...p,
          name: p.name || p.description
        }));

        // Reordenar pathologies: intercambiar Ausencia Natural (4) con Sellado de fosas (5)
        mappedPathologies = mappedPathologies.sort((a, b) => {
          const orderMap: { [key: number]: number } = { 1: 0, 2: 1, 3: 2, 5: 3, 4: 4 };
          return (orderMap[a.id] ?? 99) - (orderMap[b.id] ?? 99);
        });

        this.pathologies.set(mappedPathologies);
      },
      error: (err) => {
        console.error('Error cargando patologías:', err);
        this.notificationService.error('Error al cargar las patologías');
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
          color: this.pathologies().find(p => p.id === item.pathology.id)?.color ?? item.pathology.color
        }
      }))
    };
  }

  handleFaceClick(toothNumber: number, face: number): void {
    // Si está en modo toggle de Ausencia Natural
    if (this.isToggleAbsenceMode()) {
      this.toggleAbsenceNatural(toothNumber);
      return;
    }

    const activeTool = this.selectedPathology();

    if (!activeTool) {
      this.notificationService.error('Primero selecciona una patologia (Caries, Obturacion, etc.)');
      return;
    }

    this.odontogram.update(prev => {
      if (!prev) return null;

      const pathologies = [...prev.toothPathologies];
      const existingIdx = pathologies.findIndex(
        p => p.tooth.toothNumber === toothNumber && p.toothFace === face
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
          toothFace: face
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
        toothFace: tp.toothFace
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

  onTabChange(tab: 'pathologies' | 'treatments'): void {
    this.activeTab.set(tab);
  }

  toggleAbsenceNatural(toothNumber: number): void {
    const absencePathology = this.pathologies().find(p => p.id === 4);
    if (!absencePathology) return;

    this.odontogram.update(prev => {
      if (!prev) return null;

      const pathologies = [...prev.toothPathologies];
      const existingIdx = pathologies.findIndex(
        p => p.tooth.toothNumber === toothNumber && p.toothFace === this.WHOLE_TOOTH_FACE && p.pathology.id === 4
      );

      if (existingIdx > -1) {
        // Si ya existe, lo quitamos
        pathologies.splice(existingIdx, 1);
      } else {
        // Si no existe, lo agregamos
        pathologies.push({
          tooth: { id: 0, toothNumber },
          pathology: absencePathology,
          toothFace: this.WHOLE_TOOTH_FACE
        });
      }

      return { ...prev, toothPathologies: pathologies };
    });
  }

  selectPathology(pathology: Pathology): void {
    this.selectedPathology.set(pathology);
    // Activar modo toggle solo para Ausencia Natural
    this.isToggleAbsenceMode.set(pathology.id === 4);
  }
}
