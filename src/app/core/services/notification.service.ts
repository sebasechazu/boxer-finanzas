import { Injectable, inject, signal, computed } from '@angular/core';
import { OperationService } from './operation.service';
import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage, isSupported } from 'firebase/messaging';
import { environment } from '../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private operationService = inject(OperationService);

  // Guardamos el token FCM si está disponible
  public fcmToken = signal<string | null>(null);

  // Computamos los vencimientos del día actual para la campanita
  public vencimientosHoy = computed(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    return this.operationService.userInstalments().filter(i => {
      if (!i.vencimiento) return false;
      const iDateStr = i.vencimiento.split('T')[0];
      return iDateStr === todayStr && i.estado === 'PENDIENTE';
    });
  });

  public cantidadVencimientosHoy = computed(() => this.vencimientosHoy().length);
  public tieneVencimientosHoy = computed(() => this.cantidadVencimientosHoy() > 0);

  constructor() {
    this.initFirebaseMessaging();
  }

  private async initFirebaseMessaging() {
    try {
      const supported = await isSupported();
      if (!supported) {
        console.warn('Firebase Messaging no está soportado en este navegador.');
        return;
      }

      const app = initializeApp(environment.firebase);
      const messaging = getMessaging(app);

      // Solicitar permisos y obtener token
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        const token = await getToken(messaging, {
          // vapidKey: 'TU_VAPID_KEY_AQUI_SI_ES_NECESARIO'
        });
        
        if (token) {
          console.log('FCM Token obtenido:', token);
          this.fcmToken.set(token);
          // TODO: Enviar este token al backend/Firestore para asociarlo al usuario actual
        } else {
          console.warn('No se pudo obtener el token de registro. Asegúrate de que los permisos estén concedidos.');
        }

        // Manejar mensajes en primer plano
        onMessage(messaging, (payload) => {
          console.log('Mensaje recibido en primer plano:', payload);
          // Opcional: mostrar un toast local
        });
      }
    } catch (err) {
      console.error('Error inicializando Firebase Messaging', err);
    }
  }
}
