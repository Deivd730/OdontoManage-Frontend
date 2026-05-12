import { ChangeDetectionStrategy, Component, OnInit, inject, signal, input, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DocumentService, PatientDocument } from '@services/document.service';
import { NotificationService } from '@services/notification.service';
import { Router } from '@angular/router';
import { finalize } from 'rxjs/operators';
import { buildApiUrl } from '../../core/utils/url';

@Component({
  selector: 'app-document-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './document-list.component.html',
  styleUrl: './document-list.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DocumentListComponent implements OnInit {
  patientId = input<number | null>(null);

  documents = signal<PatientDocument[]>([]);
  isLoading = signal(false);
  deleteConfirmOpen = signal(false);
  documentPendingDelete = signal<PatientDocument | null>(null);

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
        const sortedDocs = docs.sort((a, b) => {
          return new Date(b.captureDate).getTime() - new Date(a.captureDate).getTime();
        });
        this.documents.set(sortedDocs);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.notificationService.error('No s\'han pogut carregar els documents');
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
    this.documentPendingDelete.set(doc);
    this.deleteConfirmOpen.set(true);
  }

  cancelDelete(): void {
    if (this.isLoading()) {
      return;
    }

    this.deleteConfirmOpen.set(false);
    this.documentPendingDelete.set(null);
  }

  confirmDelete(): void {
    const doc = this.documentPendingDelete();

    if (!doc) {
      this.cancelDelete();
      return;
    }

    this.isLoading.set(true);
    this.documentService
      .delete(doc.id)
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
      next: () => {
        this.documents.set(this.documents().filter((document) => document.id !== doc.id));
        this.notificationService.success('Document eliminat');
        this.deleteConfirmOpen.set(false);
        this.documentPendingDelete.set(null);
      },
      error: (err) => {
        this.notificationService.error('No s\'ha pogut eliminar el document');
        console.error('Document delete error:', err);
      },
    });
  }

  getDocumentUrl(fileUrl: string | null): string {
    if (!fileUrl) return '';
    if (fileUrl.startsWith('http')) return fileUrl;
    return buildApiUrl(`/documents/${fileUrl}`);
  }

  isImage(fileUrl: string | null): boolean {
    if (!fileUrl) return false;
    return /\.(jpg|jpeg|png|gif|webp)$/i.test(fileUrl);
  }
}
