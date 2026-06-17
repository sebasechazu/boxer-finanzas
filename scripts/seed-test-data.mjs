import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, connectAuthEmulator, fetchSignInMethodsForEmail } from 'firebase/auth';
import {
  initializeFirestore,
  connectFirestoreEmulator,
  collection,
  addDoc,
  doc,
  setDoc
} from 'firebase/firestore';
import {
  TEST_ARTICULOS,
  TEST_CLIENTES,
  TEST_PLANES_PRESTAMO,
  TEST_USERS
} from './seed-test-data.constants.mjs';

const firebaseConfig = {
  apiKey: 'DEVELOPMENT_KEY_FOR_EMULATORS',
  authDomain: 'finanzas-1810.firebaseapp.com',
  projectId: 'finanzas-1810',
  storageBucket: 'finanzas-1810.firebasestorage.app',
  messagingSenderId: '198774591128',
  appId: '1:198774591128:web:57a9d8fe9abe38bfc88aed'
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = initializeFirestore(app, {});

connectAuthEmulator(auth, 'http://127.0.0.1:9099');
connectFirestoreEmulator(db, '127.0.0.1', 8080);

async function seedUserData(userConfig, index) {
  const { email, password, nombre, nombreNegocio } = userConfig;
  console.log(`Procesando usuario ${index + 1}: ${email}`);

  let uid;
  const methods = await fetchSignInMethodsForEmail(auth, email);

  if (methods.length === 0) {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    uid = userCredential.user.uid;
  } else {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    uid = userCredential.user.uid;
  }

  await signOut(auth);
  await signInWithEmailAndPassword(auth, email, password);

  const createdAt = new Date().toISOString();

  await setDoc(doc(db, 'usuarios', uid), {
    uid,
    nombre,
    email,
    nombreNegocio,
    creadoEn: createdAt
  });

  const clientes = TEST_CLIENTES.slice(0, 2);
  const articulos = TEST_ARTICULOS.slice(0, 2);
  const planesPrestamo = TEST_PLANES_PRESTAMO.slice(0, 1);

  const clientesRefs = [];
  for (const cliente of clientes) {
    const ref = await addDoc(collection(db, 'clientes'), {
      ...cliente,
      usuarioId: uid,
      creadoEn: createdAt
    });
    clientesRefs.push({ id: ref.id, ...cliente });
  }

  const articulosRefs = [];
  for (const articulo of articulos) {
    const ref = await addDoc(collection(db, 'articulos'), {
      ...articulo,
      usuarioId: uid,
      creadoEn: createdAt
    });
    articulosRefs.push({ id: ref.id, ...articulo });
  }

  const planesRefs = [];
  for (const plan of planesPrestamo) {
    const ref = await addDoc(collection(db, 'planes_prestamo'), {
      ...plan,
      usuarioId: uid,
      creadoEn: createdAt
    });
    planesRefs.push({ id: ref.id, ...plan });
  }

  const clienteVenta = clientesRefs[0];
  const articuloVenta = articulosRefs[0];
  const clientePrestamo = clientesRefs[1];
  const planPrestamo = planesRefs[0];

  const ventaRef = await addDoc(collection(db, 'ventas'), {
    usuarioId: uid,
    clienteId: clienteVenta.id,
    articuloId: articuloVenta.id,
    montoBase: 2200 + index * 300,
    porcentajeRecargo: 10,
    totalFinal: 2420 + index * 330,
    creadoEn: createdAt
  });

  const operacionVentaRef = await addDoc(collection(db, 'operaciones'), {
    usuarioId: uid,
    clienteId: clienteVenta.id,
    tipo: 'VENTA',
    ventaId: ventaRef.id,
    prestamoId: null,
    cuotasCount: 1,
    periodicidad: 'MENSUAL',
    fechaPrimerVencimiento: new Date('2026-07-05T00:00:00.000Z').toISOString()
  });

  await addDoc(collection(db, 'cuotas'), {
    operacionId: operacionVentaRef.id,
    usuarioId: uid,
    monto: 2420 + index * 330,
    estado: 'PENDIENTE',
    vencimiento: new Date('2026-07-05T00:00:00.000Z').toISOString()
  });

  const prestamoRef = await addDoc(collection(db, 'prestamos'), {
    usuarioId: uid,
    clienteId: clientePrestamo.id,
    planId: planPrestamo.id,
    montoBase: 5000 + index * 500,
    porcentajeRecargo: 5,
    totalFinal: 5250 + index * 525,
    creadoEn: createdAt
  });

  const operacionPrestamoRef = await addDoc(collection(db, 'operaciones'), {
    usuarioId: uid,
    clienteId: clientePrestamo.id,
    tipo: 'PRESTAMO',
    ventaId: null,
    prestamoId: prestamoRef.id,
    cuotasCount: 3,
    periodicidad: 'SEMANAL',
    diaSemana: 1,
    fechaPrimerVencimiento: new Date('2026-06-22T00:00:00.000Z').toISOString()
  });

  for (let i = 0; i < 3; i += 1) {
    const cuotaDate = new Date('2026-06-22T00:00:00.000Z');
    cuotaDate.setDate(cuotaDate.getDate() + i * 7);

    const cuotaData = {
      operacionId: operacionPrestamoRef.id,
      usuarioId: uid,
      monto: 1750 + index * 100,
      estado: i === 0 ? 'PAGADA' : 'PENDIENTE',
      vencimiento: cuotaDate.toISOString(),
      ...(i === 0 ? { fechaPago: new Date('2026-06-22T00:00:00.000Z').toISOString() } : {})
    };

    await addDoc(collection(db, 'cuotas'), cuotaData);
  }

  console.log(`Datos de prueba insertados para ${email} (uid: ${uid})`);
}

async function seedTestData() {
  for (const [index, userConfig] of TEST_USERS.entries()) {
    await seedUserData(userConfig, index);
  }

  console.log('Proceso de seed finalizado correctamente.');
}

seedTestData()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('No se pudieron insertar los datos de prueba:', error);
    process.exit(1);
  });
