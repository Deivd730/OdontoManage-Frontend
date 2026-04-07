import { Component, input, output } from '@angular/core';
import { ToothPathology } from '@models/odontogram';

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

  hasPathologyId5(): boolean {
    const pathologies = this.appliedPathologies();
    return pathologies.some(p => p.pathology.id === 5);
  }
}