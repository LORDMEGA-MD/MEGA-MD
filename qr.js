const { makeid } = require('./gen-id');
const express = require('express');
const QRCode = require('qrcode');
const fs = require('fs');
const pino = require('pino');
const {
    default: makeWASocket,
    useMultiFileAuthState,
    delay,
    Browsers
} = require("@whiskeysockets/baileys");
const { upload } = require('./mega');

const router = express.Router();

function removeFile(filePath) {
    if (fs.existsSync(filePath)) fs.rmSync(filePath, { recursive: true, force: true });
}

router.get('/', async (req, res) => {
    const id = makeid();
    const tempDir = `./temp/${id}`;
    let qrSent = false; // Flag to ensure QR is sent once

    async function MEGA_MD_PAIR_CODE() {
        const { state, saveCreds } = await useMultiFileAuthState(tempDir);

        try {
            const sock = makeWASocket({
                auth: state,
                printQRInTerminal: false,
                logger: pino({ level: "silent" }),
                browser: Browsers.macOS("Desktop")
            });

            sock.ev.on('creds.update', saveCreds);

            sock.ev.on("connection.update", async ({ connection, lastDisconnect, qr }) => {

                // Send QR to browser once
                if (qr && !qrSent) {
                    qrSent = true;
                    try {
                        const qrBuffer = await QRCode.toBuffer(qr);
                        res.setHeader("Content-Type", "image/png");
                        res.end(qrBuffer);
                        console.log(`📷 QR sent to browser for session: ${id}`);
                    } catch (err) {
                        if (!res.headersSent) res.status(500).send("❌ Failed to generate QR");
                        console.error(err);
                    }
                    return;
                }

                // WhatsApp connected
                if (connection === "open") {
                    console.log(`✅ ${sock.user.id} connected`);

                    const credsPath = `${tempDir}/creds.json`;

                    try {
                        // Upload creds.json to Mega
                        const megaUrl = await upload(fs.createReadStream(credsPath), `${sock.user.id}.json`);
                        const sessionId = megaUrl.replace('https://mega.nz/file/', '');
                        const md = `lordmega~${sessionId}`;

                        // Send session ID
                        const codeMsg = await sock.sendMessage(sock.user.id, { text: md });

                        // Send info message
                        const infoMsg = `
*Hey MEGA-MD User!* 👋🏻
Your session has been created successfully!

🔐 *Session ID:* Sent above
⚠️ *Keep it safe!* Do NOT share this ID with anyone.

Stay updated: https://whatsapp.com/channel/0029Vb6covl05MUWlqZdHI2w
Source code: https://github.com/Lawrence-bot-maker/MEGA-MD
`;
                        await sock.sendMessage(sock.user.id, {
                            text: infoMsg,
                            contextInfo: {
                                externalAdReply: {
                                    title: "Ｍｅｇａ𓃵 -M D Connected",
                                    thumbnailUrl: "https://cdn.ironman.my.id/i/5xtyu7.jpg",
                                    sourceUrl: "https://whatsapp.com/channel/0029Vb6covl05MUWlqZdHI2w",
                                    mediaType: 1,
                                    renderLargerThumbnail: true
                                }
                            }
                        }, { quoted: codeMsg });

                        // Cleanup
                        removeFile(tempDir);
                        await sock.ws.close();
                        console.log(`👤 ${sock.user.id} session completed, temp folder removed`);
                        process.exit();

                    } catch (e) {
                        console.error("❌ Error during Mega upload or message sending:", e);
                        removeFile(tempDir);
                        if (!res.headersSent) res.status(500).send({ code: "❗ Service Unavailable" });
                    }
                }

                // Reconnect on unexpected close
                else if (connection === "close" && lastDisconnect && lastDisconnect.error && lastDisconnect.error.output.statusCode !== 401) {
                    console.log("⚠ Connection closed, retrying...");
                    await delay(1000);
                    MEGA_MD_PAIR_CODE();
                }
            });

        } catch (err) {
            console.error("❌ Service restarted due to error:", err);
            removeFile(tempDir);
            if (!res.headersSent) res.status(503).send({ code: "❗ Service Unavailable" });
        }
    }

    await MEGA_MD_PAIR_CODE();
});

// Auto-restart process every 30 minutes
setInterval(() => {
    console.log("☘️ Restarting process...");
    process.exit();
}, 1800000); // 30 min

module.exports = router;
