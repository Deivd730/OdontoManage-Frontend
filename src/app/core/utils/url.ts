import { environment } from '../../../environments/environment';

export function buildApiUrl(path: string): string {
  return joinUrl(environment.apiUrl, path);
}

export function joinUrl(base: string, path: string): string {
  const trimmedBase = base.replace(/\/+$/, '');
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;

  if (!trimmedBase) {
    return normalizedPath;
  }

  return `${trimmedBase}${normalizedPath}`.replace(/([^:]\/)\/+/g, '$1');
}