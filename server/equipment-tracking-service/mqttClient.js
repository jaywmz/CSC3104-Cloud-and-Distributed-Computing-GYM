const mqtt = require('mqtt');

// Get the broker URL from environment variables
const brokerUrl = process.env.MQTT_BROKER_URL || 'mqtt://localhost:1883';

// Topic for publishing equipment status
const equipmentTopic = 'gym/equipment/status';

// Retry configuration
const MAX_RETRIES = 5;
let retryCount = 0;

// Dummy data generation function
function generateDummyData() {
    const equipmentId = `equip-${Math.floor(Math.random() * 10) + 1}`;
    const status = Math.random() > 0.5 ? 1 : 0; // 1 for taken, 0 for not taken

    return {
        equipmentId,
        status
    };
}

// Publish dummy data at regular intervals
function startPublishing(client) {
    setInterval(() => {
        const data = generateDummyData();
        client.publish(equipmentTopic, JSON.stringify(data), { qos: 1 }, (err) => {
            if (err) {
                console.error('Failed to publish message:', err);
            } else {
                console.log('Published:', data);
            }
        });
    }, 5000); // Publish every 5 seconds
}

// Connect to the MQTT broker with retry logic
function connectToBroker() {
    const client = mqtt.connect(brokerUrl);

    client.on('connect', () => {
        console.log('Connected to MQTT broker');
        retryCount = 0; // Reset retry count on successful connection
        startPublishing(client);
    });

    client.on('error', (err) => {
        console.error('Connection error:', err);
        if (retryCount < MAX_RETRIES) {
            retryCount++;
            console.log(`Retrying connection (${retryCount}/${MAX_RETRIES})...`);
            setTimeout(() => client.reconnect(), 5000); // Retry after 5 seconds
        } else {
            console.error('Max retries reached. Could not connect to MQTT broker.');
            client.end(); // Close the client if maximum retries reached
        }
    });

    return client;
}

// Connect to the broker
connectToBroker();
