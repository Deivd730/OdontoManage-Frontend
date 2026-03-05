import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { ToothComponent } from '@features/odontogram/tooth/tooth.component';
import { Odontogram, Pathology, ToothPathology } from '@models/odontogram';
import { OdontogramService } from '@services/odontogram.service';

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
          this.odontogram.set(res[0]);
        } else {                    
          this.odontogram.set({
            patient: { id: patientId }, // Mandamos objeto con ID en lugar de string IRI
            toothPathologies: []
          });

        }
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
  }

  /**
   * AQUÍ ES DONDE SE EDITA EL DIENTE
   */
  handleFaceClick(toothNumber: number, face: number) {
    const activeTool = this.selectedPathology();
    const currentOdonto = this.odontogram();

    if (!activeTool) {
      alert("Primero selecciona una patología (Caries, Obturación, etc.)");
      return;
    }

    if (!currentOdonto) return;

    // Actualizamos el odontograma (Inmutabilidad)
    this.odontogram.update(prev => {
      if (!prev) return null;

      const pathologies = [...prev.toothPathologies];

      // Buscamos si esa cara ya tiene algo
      const existingIdx = pathologies.findIndex(
        p => p.tooth.number === toothNumber && p.toothFace === face
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
          tooth: { id: 0, number: toothNumber },
          pathology: activeTool,
          toothFace: face,
          status: 'Activo'
        });
      }

      return { ...prev, toothPathologies: pathologies };
    });
  }

  getPatosForTooth(num: number) {
    return this.odontogram()?.toothPathologies.filter(p => p.tooth.number === num) || [];
  }

    save() {
    const currentData = this.odontogram();
    if (!currentData) return;

    // Limpiamos el objeto para enviar solo IDs y datos planos
    const dataToSend = {
      ...currentData,
      patient: currentData.patient.id || currentData.patient // Enviamos solo el ID o el IRI
    };

    this.isLoading.set(true);
    this.odontogramService.save(dataToSend).subscribe({
      next: (saved) => {
        this.odontogram.set(saved);
        alert("¡Odontograma guardado!");
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error Symfony:', err.error); // Mira esto en la consola
        alert("Error al guardar: " + (err.error?.error || 'Error desconocido'));
        this.isLoading.set(false);
      }
    });
  }
}