require('dotenv').config(); // Load environment variables

const express = require('express');
const cors = require('cors');
const path = require('path');
const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const bodyParser = require('body-parser');
const mqtt = require('mqtt'); // Add MQTT library
const WebSocket = require('ws'); // Add WebSocket library

const app = express();
app.use(cors());
app.use(bodyParser.json());
const PORT = process.env.PORT || 5003;

/* DATABASE SET UP */
const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = process.env.MONGO_URI || "mongodb+srv://leooh29:DoHTA3c5W08GHGQq@occupancydb.xq4hb.mongodb.net/?retryWrites=true&w=majority&appName=OccupancyDB";
const client = new MongoClient(uri, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    }
});
client.connect();
const occupancyDB = client.db("GymOccupancy");
const gymsCollection = occupancyDB.collection("gyms");
const checkedInCollection = occupancyDB.collection("checkedIn");
const equipmentDB = client.db("GymEquipment");
const equipmentCollection = equipmentDB.collection("equipment");

/* gRPC SET UP */
// gRPC client setup for user-service
const PROTO_PATH = path.join(__dirname, '../user-service/user.proto');
const packageDefinition = protoLoader.loadSync(PROTO_PATH, {});
const userProto = grpc.loadPackageDefinition(packageDefinition).UserService;
const userClient = new userProto('localhost:50051', grpc.credentials.createInsecure());

/* MQTT SET UP */
// Connect to the MQTT broker
const mqttClient = mqtt.connect('mqtt://localhost:1883');

/* WebSocket SET UP */
// Create WebSocket server
const wss = new WebSocket.Server({ port: 8080 });

wss.on('connection', (ws) => {
    console.log('New WebSocket client connected');
});

// Broadcast function for WebSocket
function broadcast(data) {
    wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(data));
        }
    });
}

mqttClient.on('connect', () => {
    console.log('Connected to MQTT broker');
    mqttClient.subscribe('gym/equipment/usage', (err) => {
        if (!err) {
            console.log('Subscribed to gym/equipment/usage');
        } else {
            console.error('Failed to subscribe to MQTT topic:', err);
        }
    });
});

// Listen for messages from MQTT broker
mqttClient.on('message', async (topic, message) => {
    if (topic === 'gym/equipment/usage') {
        try {
            const data = JSON.parse(message.toString());
            const { itemID, inUse } = data;

            // Update the equipment's inUse status in the MongoDB collection
            await equipmentCollection.updateOne(
                { itemID: itemID },
                { $set: { inUse: inUse } }
            );
            console.log(`Updated equipment itemID: ${itemID} inUse: ${inUse}`);

            // Broadcast the updated equipment status to all WebSocket clients
            broadcast(data);
        } catch (err) {
            console.error('Error processing MQTT message:', err);
        }
    }
});

// Function to call user gRPC to convert token to user
function getUserFromToken(token) {
    return new Promise((resolve, reject) => {
        userClient.GetUserFromToken({ token }, (error, response) => {
            if (error) {
                return reject({
                    code: grpc.status.INTERNAL,
                    details: 'Error fetching user from token',
                });
            } else {
                resolve(response.username);
            }
        });
    });
}

// Checks whether a check-in record containing a given username already exists in DB
async function findCheckIn(username) {
    try {
        const record = await checkedInCollection.findOne({ "username" : username });
        return !!record;
    } catch (err) {
        console.log(err);
        return false;
    }
};

// Get occupancy by counting number of checked-in users in every gym
app.get('/api/occupancy', async (req, res) => {
    try {
        const cursor = await gymsCollection.find();
        let gyms = [];
        for await (const doc of cursor) {
            gyms.push(doc);
        }

        for (let i = 0; i < gyms.length; i++) {
            const numOfGymGoers = await checkedInCollection.countDocuments({ "gymID" : gyms[i].gymID });
            gyms[i].occupants = numOfGymGoers;
            const equipment = await equipmentCollection.find({ "gymID" : gyms[i].gymID }).toArray();
            gyms[i].equipment = equipment;
        }

        return res.status(200).json(gyms);
    } 
    catch (err) {
        console.log(`Something went wrong trying to find the documents: ${err}\n`);
        return res.sendStatus(500);
    }
});

// Get a single gym data for check-in check-out page
app.get('/api/gym', async (req, res) => {
    try {
        const id = Number(req.query.id);

        const gym = await gymsCollection.findOne({ gymID: { $eq: id } });

        if (gym) {
            return res.status(200).json(gym);
        } else {
            return res.status(404);
        }   
    } catch (err) {
        console.log(`Something went wrong trying to find the documents: ${err}\n`);
        return res.sendStatus(500);
    }
});

// Update occupancy by adding check-in record/document
app.post('/api/check-in', async (req, res) => {
    const token = req.body[0];
    const gym = req.body[1];
    let username;
    try {
        username = await getUserFromToken(token);
    } catch (err) {
        console.log(err);
        return res.sendStatus(500);
    };

    const exists = await findCheckIn(username);
    if (exists) {
        const message = "User has already checked-in to a gym."
        return res.send(message);
    } else {
        const checkIn = {
            username: username,
            gymID: gym,
            timestamp: new Date().toString()
        };

        try {
            await checkedInCollection.insertOne(checkIn);
            console.log("Inserted check-in record");
            return res.sendStatus(200);
        } catch (err) {
            console.log(`Something went wrong trying to find the documents: ${err}\n`);
            return res.sendStatus(500);
        }
    }
});

// Update occupancy by removing check-in record/document
app.post('/api/check-out', async (req, res) => {
    const token = req.body[0];
    const gym = req.body[1];
    let username;
    try {
        username = await getUserFromToken(token);
    } catch (err) {
        console.log(err);
        return res.sendStatus(500);
    };

    const exists = await findCheckIn(username);
    if (exists) {
        try {
            await checkedInCollection.deleteOne({ username });
            console.log("Deleted check-in record");
            return res.sendStatus(200);
        } catch (err) {
            console.log(`Something went wrong trying to find the documents: ${err}\n`);
            return res.sendStatus(500);
        }
    } else {
        const message = "User has not checked-in to this gym before.";
        return res.send(message);
    }
});

// Create Gym
app.post('/api/create-gym', async (req, res) => {
    const { gymName, maxCap } = req.body;

    if (!gymName || !maxCap) {
        return res.status(400).json({ message: 'All fields are required' });
    }

    try {
        const count = await gymsCollection.countDocuments();
        const newGymID = count + 1;

        const newGym = {
            gymID: newGymID,
            gymName: gymName,
            maxCap: parseInt(maxCap)
        };

        await gymsCollection.insertOne(newGym);
        console.log(`New gym created with gymID: ${newGymID}`);
        return res.sendStatus(200);
    } catch (err) {
        console.error(`Error creating gym: ${err}`);
        return res.status(500).json({ message: 'Server error. Failed to create gym' });
    }
});

// Create Equipment
app.post('/api/create-equipment', async (req, res) => {
    const { equipmentName, equipmentType, gymID, purpose } = req.body;

    if (!equipmentName || !equipmentType || !gymID || !purpose) {
        return res.status(400).json({ message: 'All fields are required' });
    }

    try {
        const count = await equipmentCollection.countDocuments();
        const newItemID = count + 1;

        const newEquipment = {
            itemID: newItemID,
            type: equipmentType,
            name: equipmentName,
            gymID: parseInt(gymID),
            purpose: purpose,
            inUse: false
        };

        await equipmentCollection.insertOne(newEquipment);
        console.log(`New equipment created with itemID: ${newItemID}`);
        return res.sendStatus(200);
    } catch (err) {
        console.error(`Error creating equipment: ${err}`);
        return res.status(500).json({ message: 'Server error. Failed to create equipment' });
    }
});

// Get Gyms
app.get('/api/get-gyms', async (req, res) => {
    try {
        const gyms = await gymsCollection.find().toArray();
        res.status(200).json(gyms); // Send the list of gyms as a response
    } catch (err) {
        console.error('Error fetching gyms:', err);
        res.status(500).json({ message: 'Failed to fetch gyms' });
    }
});

app.listen(PORT, () => {
    console.log(`Occupancy service running on port ${PORT}`);
});
