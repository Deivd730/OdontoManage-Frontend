import { Component, OnInit, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { ToothComponent } from '@features/odontogram/tooth/tooth.component';
import { Odontogram, Pathology, ToothPathology, Treatment, ToothTreatment, BridgeTreatment } from '@models/odontogram';
import { OdontogramService } from '@services/odontogram.service';
import { PathologyService } from '@services/pathology.service';
import { TreatmentService } from '@services/treatment.service';
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
  private treatmentService = inject(TreatmentService);
  private notificationService = inject(NotificationService);
  private patientService = inject(PatientService);

  private readonly ADULT_UPPER_TEETH = [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28];
  private readonly ADULT_LOWER_TEETH = [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38];
  private readonly CHILD_UPPER_TEETH = [55, 54, 53, 52, 51, 61, 62, 63, 64, 65];
  private readonly CHILD_LOWER_TEETH = [85, 84, 83, 82, 81, 71, 72, 73, 74, 75];
  private readonly WHOLE_TOOTH_FACE = 0;

  // Herramientas de edicion - cargadas desde backend
  pathologies = signal<Pathology[]>([]);
  treatments = signal<Treatment[]>([]);

  selectedPathology = signal<Pathology | null>(null);
  selectedTreatment = signal<Treatment | null>(null);
  selectedTreatmentStatus = signal<'pending' | 'done'>('pending');
  odontogram = signal<Odontogram | null>(null);
  isLoading = signal(false);
  odontogramType = signal<'adult' | 'child'>('adult');
  activeTab = signal<'pathologies' | 'treatments'>('pathologies');
  isToggleAbsenceMode = signal(false);
  isBridgeMode = signal(false);
  bridgeFirstPilar = signal<number | null>(null);
  isDeleteMode = signal(false);

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
    this.loadPathologies();
    this.loadTreatments();
    
    this.route.params.subscribe(params => {
      const id = Number(params['id']);
      if (Number.isFinite(id) && id > 0) {
        // Pequeño delay para asegurar que treatments está cargado
        setTimeout(() => this.loadOdontogram(id), 100);
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

  private loadTreatments(): void {
    this.treatmentService.getTreatments().subscribe({
      next: (data) => {
        // Filtrar para excluir Obturación (con y sin acento)
        const filtered = data.filter(t => {
          const name = t.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
          return !name.includes('obturacion');
        });
        this.treatments.set(filtered);
      },
      error: (err) => {
        console.error('Error cargando tratamientos:', err);
        this.notificationService.error('Error al cargar los tratamientos');
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
              toothPathologies: [],
              toothTreatments: [],
              bridgeTreatments: []
            });
            this.isLoading.set(false);
          },
          error: () => {
            // Fallback a adulto si no se puede leer la fecha de nacimiento.
            this.odontogramType.set('adult');
            this.odontogram.set({
              patient: { id: patientId },
              type: 'adult',
              toothPathologies: [],
              toothTreatments: [],
              bridgeTreatments: []
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
    // Si está en modo de eliminación
    if (this.isDeleteMode()) {
      this.handleDeleteFaceClick(toothNumber, face);
      return;
    }

    // Si está en tab de tratamientos, delegar a handleTreatmentFaceClick
    if (this.activeTab() === 'treatments') {
      this.handleTreatmentFaceClick(toothNumber, face);
      return;
    }

    // Tab de patologías
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
      })),
      toothTreatments: currentData.toothTreatments?.map(tt => ({
        treatment: { id: tt.treatment.id },
        toothNumber: tt.toothNumber,
        toothFace: tt.toothFace,
        status: tt.status
      })) || [],
      bridgeTreatments: currentData.bridgeTreatments?.map(bt => ({
        treatment: { id: bt.treatment.id },
        startTooth: bt.startTooth,
        endTooth: bt.endTooth,
        status: bt.status
      })) || []
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

  selectTreatment(treatment: Treatment): void {
    this.selectedTreatment.set(treatment);
    // Desactivar modo toggle si estaba activo
    this.isToggleAbsenceMode.set(false);
    // Desactivar modo delete si estaba activo
    this.isDeleteMode.set(false);
    
    // Activar modo puente si se selecciona Puente
    const isPuente = treatment.name.toLowerCase().includes('puente');
    this.isBridgeMode.set(isPuente);
    
    // Resetear primer pilar
    if (isPuente) {
      this.bridgeFirstPilar.set(null);
      this.notificationService.success('Modo puente activado: selecciona el primer pilar');
    }
  }

  toggleDeleteMode(): void {
    const isDeleting = this.isDeleteMode();
    this.isDeleteMode.set(!isDeleting);
    
    if (!isDeleting) {
      this.notificationService.success('Modo eliminar activado: haz click en los dientes/caras para borrar');
      this.isBridgeMode.set(false);
      this.isToggleAbsenceMode.set(false);
    } else {
      this.notificationService.success('Modo eliminar desactivado');
    }
  }

  handleTreatmentFaceClick(toothNumber: number, face: number): void {
    const activeTreatment = this.selectedTreatment();
    const treatmentStatus = this.selectedTreatmentStatus();
    
    if (!activeTreatment) {
      this.notificationService.error('Primero selecciona un tratamiento');
      return;
    }

    // Si es Puente, usar modo dos-clic
    if (activeTreatment.name.toLowerCase().includes('puente')) {
      this.handleBridgeSelection(toothNumber, treatmentStatus);
      return;
    }

    // Si es Corona, siempre aplicar a face 0 (diente completo)
    const targetFace = activeTreatment.name.toLowerCase().includes('corona') ? 0 : face;

    this.odontogram.update(prev => {
      if (!prev) return null;

      // Crear un nuevo array sin mutar
      const treatments: ToothTreatment[] = (prev.toothTreatments || []).slice();
      const activeTreatmentId = Number(activeTreatment.id);
      
      // Buscar si existe
      let existingIdx = -1;
      for (let i = 0; i < treatments.length; i++) {
        const t = treatments[i];
        const tId = Number((t.treatment as any)?.id ?? -999);
        if (t.toothNumber === toothNumber && t.toothFace === targetFace && tId === activeTreatmentId) {
          existingIdx = i;
          break;
        }
      }

      if (existingIdx > -1) {
        // Eliminar
        treatments.splice(existingIdx, 1);
        this.notificationService.success('Tratamiento eliminado');
      } else {
        // Agregar
        const newTreatment: ToothTreatment = {
          treatment: activeTreatment,
          toothNumber,
          toothFace: targetFace,
          status: treatmentStatus
        };
        treatments.push(newTreatment);
        this.notificationService.success('Tratamiento agregado');
      }

      return { ...prev, toothTreatments: treatments };
    });
  }

  getTreatmentsForTooth(toothNumber: number): ToothTreatment[] {
    return this.odontogram()?.toothTreatments?.filter(t => t.toothNumber === toothNumber) || [];
  }

  handleDeleteFaceClick(toothNumber: number, face: number): void {
    this.odontogram.update(prev => {
      if (!prev) return null;

      let deleted = false;

      // En tab de patologías: eliminar patología
      if (this.activeTab() === 'pathologies') {
        const pathologies = [...prev.toothPathologies];
        const idx = pathologies.findIndex(p => p.tooth.toothNumber === toothNumber && p.toothFace === face);
        if (idx > -1) {
          pathologies.splice(idx, 1);
          deleted = true;
          this.notificationService.success('Patología eliminada');
          return { ...prev, toothPathologies: pathologies };
        }
      } else {
        // En tab de tratamientos: eliminar tratamiento
        const treatments = [...(prev.toothTreatments || [])];
        const idx = treatments.findIndex(t => t.toothNumber === toothNumber && t.toothFace === face);
        if (idx > -1) {
          treatments.splice(idx, 1);
          deleted = true;
          this.notificationService.success('Tratamiento eliminado');
          return { ...prev, toothTreatments: treatments };
        }
      }

      if (!deleted) {
        this.notificationService.error('No hay nada que eliminar en esa posición');
      }

      return prev;
    });
  }

  // Obtener puentes que incluyen un diente específico
  getBridgesForTooth(toothNumber: number): BridgeTreatment[] {
    return this.odontogram()?.bridgeTreatments?.filter(bridge => {
      const min = Math.min(bridge.startTooth, bridge.endTooth);
      const max = Math.max(bridge.startTooth, bridge.endTooth);
      return toothNumber >= min && toothNumber <= max;
    }) || [];
  }

  // Método para conseguir todos los dientes entre dos números (para puentes)
  private getTeethBetween(toothA: number, toothB: number): number[] {
    const start = Math.min(toothA, toothB);
    const end = Math.max(toothA, toothB);
    const teeth: number[] = [];
    
    for (let i = start; i <= end; i++) {
      teeth.push(i);
    }
    
    return teeth;
  }

  // Método para saber si dos dientes están en el mismo cuadrante
  private areSameQuadrant(tooth1: number, tooth2: number): boolean {
    const getQuadrant = (tooth: number) => Math.floor(tooth / 10);
    return getQuadrant(tooth1) === getQuadrant(tooth2);
  }

  // Manejo de selección de puentes en dos clics
  private handleBridgeSelection(toothNumber: number, status: 'pending' | 'done'): void {
    const firstPilar = this.bridgeFirstPilar();
    const activeTreatment = this.selectedTreatment();

    if (!activeTreatment) return;

    if (!firstPilar) {
      // Primer clic: guardar primer pilar
      this.bridgeFirstPilar.set(toothNumber);
      this.notificationService.info(`Primer pilar: ${toothNumber}. Selecciona el segundo pilar.`);
      return;
    }

    if (firstPilar === toothNumber) {
      // Si el usuario hace clic en el mismo diente, cancelar
      this.notificationService.info('Debes seleccionar un diente diferente para el segundo pilar');
      return;
    }

    // Validar que están en el mismo cuadrante
    if (!this.areSameQuadrant(firstPilar, toothNumber)) {
      this.notificationService.error('Los pilares deben estar en el mismo cuadrante');
      return;
    }

    // Segundo clic: crear el puente
    this.completeBridgeSelection(firstPilar, toothNumber, status);
    this.bridgeFirstPilar.set(null);
  }

  private completeBridgeSelection(
    startTooth: number,
    endTooth: number,
    status: 'pending' | 'done'
  ): void {
    const activeTreatment = this.selectedTreatment();
    if (!activeTreatment) return;

    this.odontogram.update(prev => {
      if (!prev) return null;

      const bridges: BridgeTreatment[] = [...(prev.bridgeTreatments || [])];
      
      // Verificar si ya existe un puente equivalente
      const minTooth = Math.min(startTooth, endTooth);
      const maxTooth = Math.max(startTooth, endTooth);
      
      const existingIdx = bridges.findIndex(
        b => b.treatment.id === activeTreatment.id && 
             ((b.startTooth === minTooth && b.endTooth === maxTooth) ||
              (b.startTooth === maxTooth && b.endTooth === minTooth))
      );

      if (existingIdx > -1) {
        // Si existe, lo borramos (toggle)
        bridges.splice(existingIdx, 1);
        this.notificationService.info('Puente removido');
      } else {
        // Si no existe, lo creamos
        const newBridge: BridgeTreatment = {
          treatment: activeTreatment,
          startTooth: minTooth,
          endTooth: maxTooth,
          status
        };
        bridges.push(newBridge);
        this.notificationService.success(`Puente creado de ${minTooth} a ${maxTooth}`);
      }

      return { ...prev, bridgeTreatments: bridges };
    });
  }
}
