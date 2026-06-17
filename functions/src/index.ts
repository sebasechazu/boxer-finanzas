import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

admin.initializeApp();
const db = admin.firestore();
const messaging = admin.messaging();

/**
 * Función programada que se ejecuta todos los días a las 9:00 AM (hora del servidor/zona horaria configurada).
 * Busca los vencimientos (cuotas) del día de la fecha y envía notificaciones push a los usuarios correspondientes.
 */
export const checkDailyExpirations = functions.pubsub.schedule("0 9 * * *").onRun(async (context) => {
    await processDailyExpirations();
    return null;
});

/**
 * Función HTTP (Callable) para probar el envío de notificaciones manualmente.
 */
export const testDailyExpirations = functions.https.onCall(async (data, context) => {
    // Solo permitir en emulador o administradores (omitido por simplicidad de prueba)
    const result = await processDailyExpirations();
    return { success: true, ...result };
});

async function processDailyExpirations() {
    console.log("Iniciando proceso de vencimientos diarios...");
    const today = new Date();
    // Normalizar a inicio del día en formato YYYY-MM-DD local
    // o dependiendo de cómo se guarde la fecha en Firestore.
    // Asumimos que la fecha se guarda como string 'YYYY-MM-DD' o timestamp.
    // Vamos a buscar la estructura en la base de datos, 
    // Por el momento, dejaremos un log indicando que esta lógica debe ajustarse 
    // a la estructura exacta de 'cuotas' y 'fcm_tokens'.

    console.log("TODO: Implementar consulta a Firestore para buscar cuotas de hoy y enviar push");
    
    // Ejemplo de cómo se enviaría:
    // const message = {
    //     notification: {
    //         title: "Vencimientos de hoy",
    //         body: "Tienes cobros pendientes para el día de hoy."
    //     },
    //     token: "USER_FCM_TOKEN"
    // };
    // await messaging.send(message);

    return { processed: 0 };
}
