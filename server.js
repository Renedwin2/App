const express = require("express");
const bodyParser = require("body-parser");
const admin = require("firebase-admin");

const app = express();
app.use(bodyParser.json());

// Firebase setup
const serviceAccount = require("./serviceAccount.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

let devices = {}; // deviceId → token

// Register device
app.post("/register", (req, res) => {
  const { deviceId, token } = req.body;
  devices[deviceId] = token;
  res.send("Registered");
});

// Send command to device
function sendCommand(deviceId, command) {
  const token = devices[deviceId];

  if (!token) return;

  admin.messaging().send({
    token,
    data: { command }
  });
}

// Telegram webhook
app.post("/webhook", (req, res) => {
  const text = req.body.message.text;
  const [cmd, deviceId] = text.split(" ");

  if (cmd === "/loc") sendCommand(deviceId, "location");
  if (cmd === "/cam") sendCommand(deviceId, "camera");
  if (cmd === "/buzz") sendCommand(deviceId, "vibrate");

  res.sendStatus(200);
});

app.listen(3000, () => console.log("Server running"));
