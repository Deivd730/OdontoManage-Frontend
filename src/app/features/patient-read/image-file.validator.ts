export interface ImageFileValidationOptions {
  allowedMimeTypes: readonly string[];
  maxSizeBytes: number;
}

// Mirror backend constraints for client-side prevalidation.
export const PROFILE_IMAGE_ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp'
] as const;
export const PROFILE_IMAGE_MAX_SIZE_BYTES = 5 * 1024 * 1024;

export function validateImageFile(
  file: File,
  options: ImageFileValidationOptions
): string | null {
  if (!options.allowedMimeTypes.includes(file.type)) {
    return `Formato de imagen invalido. Formatos permitidos: ${formatAllowedImageFormats(options.allowedMimeTypes)}.`;
  }

  if (file.size > options.maxSizeBytes) {
    const maxSizeInMb = Math.round(options.maxSizeBytes / (1024 * 1024));
    return `La imagen supera el tamano maximo permitido (${maxSizeInMb} MB).`;
  }

  return null;
}

export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result !== 'string') {
        reject(new Error('No se pudo procesar la imagen seleccionada.'));
        return;
      }
      resolve(reader.result);
    };

    reader.onerror = () => reject(new Error('No se pudo leer el archivo de imagen.'));
    reader.readAsDataURL(file);
  });
}

export function formatAllowedImageFormats(mimeTypes: readonly string[]): string {
  return mimeTypes
    .map(mimeType => `data:${mimeType};base64,...`)
    .join(' o ');
}
