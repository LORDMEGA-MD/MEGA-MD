const express = require("express");
const makeWASocket = require("@whiskeysockets/baileys").default;
const { useMultiFileAuthState } = require("@whiskeysockets/baileys");
const qrcode = require("qrcode");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 5000;

let currentQR = null; // store current QR as base64
let connectionStatus = "waiting";

// Serve your qr.html file
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "qr.html"));
});

// Serve current QR as an image
app.get("/server", (req, res) => {
  if (currentQR) {
    const img = Buffer.from(currentQR.split(",")[1], "base64");
    res.writeHead(200, { "Content-Type": "image/png" });
    res.end(img);
  } else {
    res.status(404).send("QR not available yet");
  }
});

// Pairing logic
async function startPair() {
  const { state, saveCreds } = await useMultiFileAuthState("session");

  const sock = makeWASocket({
    printQRInTerminal: true,
    auth: state,
    browser: ["Mega-MD", "Chrome", "4.0"],
  });

  sock.ev.on("connection.update", async (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      console.log("⚡ New QR generated");
      currentQR = await qrcode.toDataURL(qr);
      connectionStatus = "qr_ready";
    }

    if (connection === "open") {
      console.log("✅ Connected successfully!");
      connectionStatus = "connected";
      currentQR = null; // clear QR once connected
    }

    if (connection === "close") {
      console.log("❌ Connection closed, retrying...");
      connectionStatus = "disconnected";
      startPair();
    }
  });

  sock.ev.on("creds.update", saveCreds);
}

// Start everything
startPair();

app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
