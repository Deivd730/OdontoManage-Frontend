import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { ToothComponent } from '@features/odontogram/tooth/tooth.component';
import { Odontogram, Pathology, ToothPathology } from '@models/odontogram';
import { OdontogramService } from '@services/odontogram.service';
import { finalize } from 'rxjs';
import { NotificationService } from '@services/notification.service';

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


  // Listado de dientes (Sistema ISO)
  upperTeeth = [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28];
  lowerTeeth = [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38];

  // Herramientas de edición
  pathologies: Pathology[] = [
    { id: 1, name: 'Caries', color: '#FF4136' },      // Rojo
    { id: 2, name: 'Obturación', color: '#0074D9' },  // Azul
    { id: 3, name: 'Corona', color: '#FFDC00' },      // Amarillo
    { id: 4, name: 'Ausente', color: '#AAAAAA' },     // Gris
    { id: 5, name: 'Endodoncia', color: '#B10DC9' }   // Púrpura
  ];

  // Signals de estado
  selectedPathology = signal<Pathology | null>(null);
  odontogram = signal<Odontogram | null>(null);
  isLoading = signal(false);

  ngOnInit(): void {
    // Detectamos el cambio de paciente en la URL
    this.route.params.subscribe(params => {
      const id = params['id'];
      if (id) this.loadOdontogram(Number(id));
    });
  }

  loadOdontogram(patientId: number) {
    this.isLoading.set(true);
    this.odontogramService.getOdontogramByPatient(patientId).subscribe({
      next: (res) => {
        if (res && res.length > 0) {
          this.odontogram.set(this.enrichWithColors(res[0]));
        } else {
          this.odontogram.set({
            patient: { id: patientId },
            toothPathologies: []
          });
        }
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
  }

  private normalizeToothPathologies(value: unknown): ToothPathology[] {
  if (Array.isArray(value)) return value as ToothPathology[];
  if (value && typeof value === 'object') {
    return Object.values(value as Record<string, ToothPathology>);
  }
  return [];
}

  /**
   * Restores pathology colors from the local list after an API response,
   * since Symfony does not store colors in the database.
   */
  private enrichWithColors(odontogram: Odontogram): Odontogram {
  const tp = this.normalizeToothPathologies((odontogram as any).toothPathologies);
  return {
    ...odontogram,
    toothPathologies: tp.map(item => ({
      ...item,
      pathology: {
        ...item.pathology,
        color: this.pathologies.find(p => p.id === item.pathology.id)?.color ?? item.pathology.color
      }
    }))
  };
}

  /**
   * AQUÍ ES DONDE SE EDITA EL DIENTE
   */
  handleFaceClick(toothNumber: number, face: number) {
    const activeTool = this.selectedPathology();
    const currentOdonto = this.odontogram();

    if (!activeTool) {
      this.notificationService.error('Primero selecciona una patología (Caries, Obturación, etc.)');
      return;
    }

    if (!currentOdonto) return;

    // Actualizamos el odontograma (Inmutabilidad)
    this.odontogram.update(prev => {
      if (!prev) return null;

      const pathologies = [...prev.toothPathologies];

      // Buscamos si esa cara ya tiene algo
      const existingIdx = pathologies.findIndex(
        p => p.tooth.toothNumber === toothNumber && p.toothFace === face
      );

      if (existingIdx > -1) {
        // Si es la misma herramienta, la quitamos (borrador)
        if (pathologies[existingIdx].pathology.id === activeTool.id) {
          pathologies.splice(existingIdx, 1);
        } else {
          // Si es otra herramienta, cambiamos la patología
          pathologies[existingIdx] = { ...pathologies[existingIdx], pathology: activeTool };
        }
      } else {
        // Si estaba vacío, añadimos la nueva patología
        pathologies.push({
          tooth: { id: 0, toothNumber: toothNumber },
          pathology: activeTool,
          toothFace: face,
          status: 'Activo'
        });
      }

      return { ...prev, toothPathologies: pathologies };
    });
  }

  getPatosForTooth(num: number) {
    return this.odontogram()?.toothPathologies.filter(p => p.tooth.toothNumber === num) || [];
  }

  save() {
    const currentData = this.odontogram();
    if (!currentData) return;

    // Send only the fields the backend expects; strip UI-only data (color, name)
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
          // Re-enrich colors since the API response does not include them
          this.odontogram.set(this.enrichWithColors(saved));
          this.notificationService.success('Odontograma guardado correctamente');
        },
        error: (err) => {
          console.error('Error al guardar:', err.error);
          this.notificationService.error(err.error?.error || 'Error al guardar odontograma');
        }
      });
  }
}

