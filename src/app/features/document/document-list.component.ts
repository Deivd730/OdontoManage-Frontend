import { Component, OnInit, inject, signal, input, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DocumentService, PatientDocument } from '@services/document.service';
import { NotificationService } from '@services/notification.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-document-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './document-list.component.html',
  styleUrl: './document-list.component.css'
})
export class DocumentListComponent implements OnInit {
  patientId = input<number | null>(null);

  documents = signal<PatientDocument[]>([]);
  isLoading = signal(false);

  private documentService = inject(DocumentService);
  private notificationService = inject(NotificationService);
  private router = inject(Router);

  constructor() {
    effect(() => {
      const id = this.patientId();
      if (id) {
        this.loadDocuments(id);
      } else {
        this.documents.set([]);
      }
    });
  }

  ngOnInit(): void {}

  loadDocuments(patientId: number): void {
    this.isLoading.set(true);
    this.documentService.getByPatient(patientId).subscribe({
      next: (docs) => {
        this.documents.set(docs);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.notificationService.error('Error al cargar documentos');
        console.error('Document load error:', err);
        this.isLoading.set(false);
      }
    });
  }

  addDocument(): void {
    const id = this.patientId();
    if (id) {
      this.router.navigate(['/documents/create'], { queryParams: { patientId: id } });
    }
  }

  deleteDocument(doc: PatientDocument): void {
    if (!confirm(`¿Eliminar el documento "${doc.type}"?`)) {
      return;
    }

    this.documentService.delete(doc.id).subscribe({
      next: () => {
        this.documents.set(this.documents().filter(d => d.id !== doc.id));
        this.notificationService.success('Documento eliminado');
      },
      error: (err) => {
        this.notificationService.error('Error al eliminar documento');
        console.error('Document delete error:', err);
      }
    });
  }

  getDocumentUrl(fileUrl: string | null): string {
    if (!fileUrl) return '';
    if (fileUrl.startsWith('http')) return fileUrl;
    return `http://localhost:8000/documents/${fileUrl}`;
  }

  isImage(fileUrl: string | null): boolean {
    if (!fileUrl) return false;
    return /\.(jpg|jpeg|png|gif|webp)$/i.test(fileUrl);
  }
}