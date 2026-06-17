import { initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import {
  TEST_ARTICULOS,
  TEST_CLIENTES,
  TEST_PLANES_PRESTAMO,
  TEST_USERS,
  TestUser
} from './seed-test-data.constants';

process.env['FIRESTORE_EMULATOR_HOST'] = '127.0.0.1:8080';
process.env['FIREBASE_AUTH_EMULATOR_HOST'] = '127.0.0.1:9099';

const app = initializeApp({
  projectId: 'finanzas-1810'
});

const auth = getAuth(app);
const db = getFirestore(app);

async function seedUserData(userConfig: TestUser, index: number) {
  const { email, password, nombre, nombreNegocio } = userConfig;
  console.log(`Procesando usuario ${index + 1}: ${email}`);

  let uid: string;
  try {
    const userRecord = await auth.getUserByEmail(email);
    uid = userRecord.uid;
    await auth.updateUser(uid, { password, emailVerified: true });
  } catch (error: any) {
    if (error.code === 'auth/user-not-found') {
      const userRecord = await auth.createUser({
        email,
        password,
        displayName: nombre,
        emailVerified: true
      });
      uid = userRecord.uid;
    } else {
      throw error;
    }
  }

  const createdAt = new Date().toISOString();

  await db.collection('usuarios').doc(uid).set({
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
    const ref = await db.collection('clientes').add({
      ...cliente,
      usuarioId: uid,
      creadoEn: createdAt
    });
    clientesRefs.push({ id: ref.id, ...cliente });
  }

  const articulosRefs = [];
  for (const articulo of articulos) {
    const ref = await db.collection('articulos').add({
      ...articulo,
      usuarioId: uid,
      creadoEn: createdAt
    });
    articulosRefs.push({ id: ref.id, ...articulo });
  }

  const planesRefs = [];
  for (const plan of planesPrestamo) {
    const ref = await db.collection('planes_prestamo').add({
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

  const ventaRef = await db.collection('ventas').add({
    usuarioId: uid,
    clienteId: clienteVenta.id,
    articuloId: articuloVenta.id,
    montoBase: 2200 + index * 300,
    porcentajeRecargo: 10,
    totalFinal: 2420 + index * 330,
    creadoEn: createdAt
  });

  const operacionVentaRef = await db.collection('operaciones').add({
    usuarioId: uid,
    clienteId: clienteVenta.id,
    tipo: 'VENTA',
    ventaId: ventaRef.id,
    prestamoId: null,
    cuotasCount: 1,
    periodicidad: 'MENSUAL',
    fechaPrimerVencimiento: new Date('2026-07-05T00:00:00.000Z').toISOString()
  });

  await db.collection('cuotas').add({
    operacionId: operacionVentaRef.id,
    usuarioId: uid,
    monto: 2420 + index * 330,
    estado: 'PENDIENTE',
    vencimiento: new Date('2026-07-05T00:00:00.000Z').toISOString()
  });

  const prestamoRef = await db.collection('prestamos').add({
    usuarioId: uid,
    clienteId: clientePrestamo.id,
    planId: planPrestamo.id,
    montoBase: 5000 + index * 500,
    porcentajeRecargo: 5,
    totalFinal: 5250 + index * 525,
    creadoEn: createdAt
  });

  const operacionPrestamoRef = await db.collection('operaciones').add({
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

    await db.collection('cuotas').add(cuotaData);
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
