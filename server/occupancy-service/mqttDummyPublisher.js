const mqtt = require('mqtt');
const { MongoClient, ServerApiVersion } = require('mongodb');

// Connect to a public MQTT broker (HiveMQ)
const client = mqtt.connect('mqtt://broker.hivemq.com:1883');

// MongoDB connection
const uri = "mongodb+srv://leooh29:DoHTA3c5W08GHGQq@occupancydb.xq4hb.mongodb.net/?retryWrites=true&w=majority&appName=OccupancyDB";
const mongoClient = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

// Connect to the MQTT broker and MongoDB
client.on('connect', async () => {
    console.log('Connected to public MQTT broker (HiveMQ)');

    // Connect to MongoDB
    try {
        await mongoClient.connect();
        const equipmentCollection = mongoClient.db('GymEquipment').collection('equipment');
        console.log('Connected to MongoDB');

        // Simulate sending continuous dummy data for equipment usage
        setInterval(async () => {
            try {
                // Fetch the latest equipment list before each update
                const allEquipment = await equipmentCollection.find({}).toArray();
                if (allEquipment.length === 0) {
                    console.log('No equipment found in the database');
                    return;
                }

                // Randomly select an item to update
                const currentItem = allEquipment[Math.floor(Math.random() * allEquipment.length)];

                // Give a 70% chance for inUse to be true, 30% for false
                const inUse = Math.random() < 0.7 ? true : false; // 70% true, 30% false

                const dummyData = {
                    itemID: currentItem.itemID, // Use current itemID from the sequence
                    inUse: inUse // Randomly set inUse status with higher probability of true
                };

                // Publish the dummy data to the public MQTT broker
                client.publish('gym/equipment/usage', JSON.stringify(dummyData), () => {
                    console.log('Dummy data sent:', dummyData);
                });

            } catch (err) {
                console.error('Error updating equipment:', err);
            }
        }, 5000); // Publish every 5 seconds

    } catch (err) {
        console.error('Failed to connect to MongoDB:', err);
    }
});

// Handle MQTT connection errors
client.on('error', (err) => {
    console.error('MQTT connection error:', err);
});
