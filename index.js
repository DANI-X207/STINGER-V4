/*
 STINGER-V4 adapté pour Railway
*/

const { default: makeWASocket, DisconnectReason, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys');
const { Boom } = require('@hapi/boom');
const pino = require('pino');

// 🔑 Charger la session depuis Railway (variable SESSION_DATA)
let sessionData = process.env.SESSION_DATA ? JSON.parse(process.env.SESSION_DATA) : null;

async function startBot() {
  const { version } = await fetchLatestBaileysVersion();

  const sock = makeWASocket({
    version,
    auth: sessionData || {}, // si pas de session, Baileys génère un QR
    printQRInTerminal: true, // ✅ QR dans les logs Railway
    logger: pino({ level: 'silent' }),
    browser: ["Railway", "Chrome", "20.0.04"]
  });

  // 🔁 Sauvegarde automatique de la session
  sock.ev.on('creds.update', (creds) => {
    sessionData = creds;
    console.log("✅ Session mise à jour !");
    console.log("👉 Copie ce JSON et mets-le dans Railway (SESSION_DATA) :");
    console.log(JSON.stringify(sessionData, null, 2));
  });

  // 🔍 Gestion des connexions
  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect } = update;
    if (connection === 'close') {
      const reason = new Boom(lastDisconnect?.error)?.output?.statusCode;
      console.log('Connexion fermée, raison :', reason);
      if (reason !== DisconnectReason.loggedOut) {
        startBot(); // 🔁 Reconnexion automatique
      } else {
        console.log('⚠️ Session expirée, rescannez le QR code.');
      }
    } else if (connection === 'open') {
      console.log('✅ Bot connecté à WhatsApp');
    }
  });

  // 🔔 Exemple : écoute des messages
  sock.ev.on('messages.upsert', async (chatUpdate) => {
    try {
      const m = chatUpdate.messages[0];
      if (!m.message) return;
      console.log('📩 Nouveau message reçu de:', m.key.remoteJid);
    } catch (err) {
      console.error('Erreur messages.upsert:', err);
    }
  });
}

startBot();

// 🔒 Gestion des erreurs globales
process.on('uncaughtException', (err) => {
  console.error('Erreur non interceptée:', err);
});
