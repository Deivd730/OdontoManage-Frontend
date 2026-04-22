import { Component, input, output } from '@angular/core';
import { ToothPathology, ToothTreatment, BridgeTreatment } from '@models/odontogram';

@Component({
  selector: 'app-tooth',
  standalone: true,
  templateUrl: './tooth.component.html',
  styleUrls: ['./tooth.component.css']
})
export class ToothComponent {
  private readonly WHOLE_TOOTH_FACE = 0;

  // Inputs based on Signals
  toothNumber = input.required<number>();
  appliedPathologies = input<ToothPathology[]>([]);
  appliedTreatments = input<ToothTreatment[]>([]);
  appliedBridges = input<BridgeTreatment[]>([]);
  activeTab = input<'pathologies' | 'treatments'>('pathologies');

  // Output moderno
  onFaceClick = output<number>();

  // If a whole-tooth pathology exists, paint all faces with that color.
  getFaceColor(face: number): string {
    const pathologies = this.appliedPathologies();
    const wholeTooth = pathologies.find(p => p.toothFace === this.WHOLE_TOOTH_FACE);

    if (wholeTooth) {
      return wholeTooth.pathology.color || '#ff0000';
    }

    const found = pathologies.find(p => p.toothFace === face);
    return found ? found.pathology.color || '#ff0000' : '#ffffff';
  }

  hasPathologyId4(): boolean {
    const pathologies = this.appliedPathologies();
    return pathologies.some(p => p.pathology.id === 4);
  }

  // Tratamientos visualization
  getTreatmentSymbols(): { symbol: string; color: string }[] {
    const treatments = this.appliedTreatments();
    const symbols: { symbol: string; color: string }[] = [];

    treatments.forEach(t => {
      if (!t.treatment || !t.treatment.name) {
        console.warn('Treatment sin name encontrado:', t);
        return;
      }

      const color = t.status === 'pending' ? '#FF0000' : '#0000FF'; // Rojo: pending, Azul: done
      const nameLower = t.treatment.name.toLowerCase();

      if (nameLower.includes('exodoncia')) {
        symbols.push({ symbol: '✕', color });
      } else if (nameLower.includes('endodoncia')) {
        symbols.push({ symbol: 'E', color });
      } else if (nameLower.includes('puente')) {
        symbols.push({ symbol: '═', color });
      }
    });

    return symbols;
  }

  hasTreatments(): boolean {
    return this.appliedTreatments().length > 0;
  }

  getTreatmentForWholeTooth(): ToothTreatment | undefined {
    return this.appliedTreatments().find(t => t.toothFace === this.WHOLE_TOOTH_FACE);
  }

  // Determinar si este diente es un pilar (primero o último) de un puente
  isPillarTooth(): boolean {
    const bridges = this.appliedBridges();
    const tooth = this.toothNumber();
    
    return bridges.some(b => {
      if (!b.treatment || !b.treatment.name) {
        console.warn('Bridge sin treatment o treatment.name:', b);
        return false;
      }
      return b.treatment.name.toLowerCase().includes('puente') &&
             (tooth === Math.min(b.startTooth, b.endTooth) || tooth === Math.max(b.startTooth, b.endTooth));
    });
  }

  // Determinar si este diente es el pilar IZQUIERDO (primero) del puente
  isLeftPillarTooth(): boolean {
    const bridges = this.appliedBridges();
    const tooth = this.toothNumber();
    
    return bridges.some(b => {
      if (!b.treatment || !b.treatment.name) {
        return false;
      }
      return b.treatment.name.toLowerCase().includes('puente') &&
             tooth === Math.min(b.startTooth, b.endTooth);
    });
  }

  // Determinar si este diente es el pilar DERECHO (último) del puente
  isRightPillarTooth(): boolean {
    const bridges = this.appliedBridges();
    const tooth = this.toothNumber();
    
    return bridges.some(b => {
      if (!b.treatment || !b.treatment.name) {
        return false;
      }
      return b.treatment.name.toLowerCase().includes('puente') &&
             tooth === Math.max(b.startTooth, b.endTooth);
    });
  }

  // Determinar si este diente es un diente intermedio del puente
  isIntermediateTooth(): boolean {
    const bridges = this.appliedBridges();
    const tooth = this.toothNumber();
    
    return bridges.some(b => {
      if (!b.treatment || !b.treatment.name) {
        return false;
      }
      const min = Math.min(b.startTooth, b.endTooth);
      const max = Math.max(b.startTooth, b.endTooth);
      return b.treatment.name.toLowerCase().includes('puente') &&
             tooth > min && tooth < max;
    });
  }

  // Obtener puentes que incluyen este diente
  getBridgesIncludingTooth(): BridgeTreatment[] {
    return this.appliedBridges().filter(b => {
      if (!b.treatment || !b.treatment.name) {
        return false;
      }
      return b.treatment.name.toLowerCase().includes('puente');
    });
  }
}