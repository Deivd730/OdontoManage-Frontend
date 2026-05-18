import { inject } from '@vercel/analytics';
import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';

inject();

bootstrapApplication(App, appConfig)
  .catch((err) => console.error(err));
