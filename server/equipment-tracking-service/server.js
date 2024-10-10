const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors'); // Optional: For cross-origin requests
require('./mqttClient'); // To start the MQTT client

const app = express();
const port = 3000;

// Store the latest equipment status
let equipmentStatus = {};

// Middleware
app.use(cors()); // Optional: Allow cross-origin requests
app.use(bodyParser.json());
app.use(express.static('public')); // Serve static files from the "public" directory

// Endpoint to fetch the current equipment status
app.get('/equipment-status', (req, res) => {
    res.json(equipmentStatus);
});

// MQTT client integration to update equipment status
const mqtt = require('mqtt');
const brokerUrl = process.env.MQTT_BROKER_URL || 'mqtt://localhost:1883';
const equipmentTopic = 'gym/equipment/status';
const client = mqtt.connect(brokerUrl);

client.on('connect', () => {
    console.log('Connected to MQTT broker for Express integration');
    client.subscribe(equipmentTopic, { qos: 1 }, (err) => {
        if (err) {
            console.error('Failed to subscribe:', err);
        }
    });
});

client.on('message', (topic, message) => {
    if (topic === equipmentTopic) {
        const data = JSON.parse(message.toString());
        equipmentStatus[data.equipmentId] = data.status; // Update status based on equipmentId
        console.log('Updated equipment status:', equipmentStatus);
    }
});

// Start the Express server
app.listen(port, () => {
    console.log(`Equipment Tracking Service running on http://localhost:${port}`);
});
