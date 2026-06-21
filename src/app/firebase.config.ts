import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager, connectFirestoreEmulator } from 'firebase/firestore';
import { environment } from './core/environments/environment';

const app = initializeApp(environment.firebase);

export const auth = getAuth(app);

// Evitar excepciones al leer `window.closed` en popups (por Cross-Origin-Opener-Policy u otras razones).
// Algunas librerías (p.ej. Firebase Auth) consultan `authWindow.window.closed` y eso puede lanzar
// si la ventana es cross-origin. Interceptamos `window.open` y devolvemos un Proxy que captura
// el acceso a `.window.closed` devolviendo `true` en caso de error.
if (typeof window !== 'undefined' && typeof window.open === 'function') {
    const __originalWindowOpen = window.open.bind(window);
    window.open = function (...args: any[]) {
        const win = __originalWindowOpen(...args);
        if (!win) return win;
        try {
            const safeWindow = new Proxy(win, {
                get(target, prop, receiver) {
                    if (prop === 'window') {
                        return new Proxy(target, {
                            get(t, p) {
                                if (p === 'closed') {
                                    try { return (t as any).closed; } catch (e) { return true; }
                                }
                                try { return (t as any)[p as any]; } catch (e) { return undefined; }
                            }
                        });
                    }
                    if (prop === 'closed') {
                        try { return (target as any).closed; } catch (e) { return true; }
                    }
                    const v = Reflect.get(target as any, prop, receiver);
                    return typeof v === 'function' ? v.bind(target) : v;
                }
            });
            return safeWindow as any;
        } catch (e) {
            return win;
        }
    } as any;
}

// Habilitar la caché local persistente con soporte multi-pestaña para la PWA
export const db = initializeFirestore(app, {
    localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager()
    })
});

if (environment.useEmulators) {
    connectAuthEmulator(auth, 'http://127.0.0.1:9099');
    connectFirestoreEmulator(db, '127.0.0.1', 8080);
}
