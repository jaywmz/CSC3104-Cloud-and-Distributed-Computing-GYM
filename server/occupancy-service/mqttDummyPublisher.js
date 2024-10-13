const mqtt = require('mqtt');
const { MongoClient, ServerApiVersion } = require('mongodb');

// Connect to your MQTT broker
const client = mqtt.connect('mqtt://localhost:1883');

// MongoDB connection
const uri = "mongodb+srv://leooh29:DoHTA3c5W08GHGQq@occupancydb.xq4hb.mongodb.net/?retryWrites=true&w=majority&appName=OccupancyDB";
const mongoClient = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

client.on('connect', async () => {
    console.log('Connected to MQTT broker');

    // Connect to MongoDB
    try {
        await mongoClient.connect();
        const equipmentCollection = mongoClient.db('GymEquipment').collection('equipment');
        console.log('Connected to MongoDB');

        // Fetch all equipment items once
        const allEquipment = await equipmentCollection.find({}).toArray();
        if (allEquipment.length === 0) {
            console.log('No equipment found in the database');
            return;
        }

        let currentIndex = 0; // To keep track of the current item being updated

        // Simulate sending continuous dummy data for equipment usage
        setInterval(async () => {
            try {
                const currentItem = allEquipment[currentIndex];

                // Give a 70% chance for inUse to be true, 30% for false
                const inUse = Math.random() < 0.7 ? true : false; // 70% true, 30% false

                const dummyData = {
                    itemID: currentItem.itemID, // Use current itemID from the sequence
                    inUse: inUse // Randomly set inUse status with higher probability of true
                };

                // Publish the dummy data to the MQTT broker
                client.publish('gym/equipment/usage', JSON.stringify(dummyData), () => {
                    console.log('Dummy data sent:', dummyData);
                });

                // Move to the next item in the list, loop back to the start if at the end
                currentIndex = (currentIndex + 1) % allEquipment.length;

            } catch (err) {
                console.error('Error updating equipment:', err);
            }
        }, 5000); // Publish every 5 seconds

    } catch (err) {
        console.error('Failed to connect to MongoDB:', err);
    }
});
