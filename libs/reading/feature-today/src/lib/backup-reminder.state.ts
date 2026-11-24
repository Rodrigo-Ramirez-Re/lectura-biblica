import { Injectable, signal } from '@angular/core';

/** "Ahora no" on the backup reminder lasts until the app is opened again, across screens. */
@Injectable({ providedIn: 'root' })
export class BackupReminderState {
  readonly dismissed = signal(false);
}
