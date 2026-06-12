import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { environment } from './core/environments/environment';

const app = initializeApp(environment.firebase);

export const auth = getAuth(app);

export const db = getFirestore(app);

if (environment.useEmulators) {
    connectAuthEmulator(auth, 'http://127.0.0.1:9099');
    connectFirestoreEmulator(db, '127.0.0.1', 8080);
}
