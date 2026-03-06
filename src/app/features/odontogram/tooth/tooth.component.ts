import { Component, input, output, computed } from '@angular/core';
import { ToothPathology } from '@models/odontogram';

@Component({
  selector: 'app-tooth',
  standalone: true,
  templateUrl: './tooth.component.html',
  styleUrls: ['./tooth.component.css']
})
export class ToothComponent {
  // Inputs basados en Signals
  toothNumber = input.required<number>();
  appliedPathologies = input<ToothPathology[]>([]);
  
  // Output moderno
  onFaceClick = output<number>();

  // Función para determinar el color (podría ser un computed si fuera más complejo)
  getFaceColor(face: number): string {
    const pathologies = this.appliedPathologies();
    const found = pathologies.find(p => p.toothFace === face);
    return found ? found.pathology.color || '#ff0000' : '#ffffff';
  }
}