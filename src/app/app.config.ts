import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { JwtInterceptor } from './core/interceptors/jwt.interceptor';
import { MockInterceptor } from './core/interceptors/mock.interceptor';

import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideAnimationsAsync(),
    provideRouter(routes),
    provideHttpClient(
      // El MockInterceptor debe ir PRIMERO para interceptar antes que el JWT
      withInterceptors([MockInterceptor, JwtInterceptor])
    )
  ]
};
