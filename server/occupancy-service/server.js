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
const PROTO_PATH = path.join(__dirname, 'user.proto');
const packageDefinition = protoLoader.loadSync(PROTO_PATH, {});
const userProto = grpc.loadPackageDefinition(packageDefinition).UserService;
const userClient = new userProto('user-service:50051', grpc.credentials.createInsecure());

/*gRPC SET UP */
// gRPC server setup for booking-service
const PROTO_PATH_BOOKING = path.join(__dirname, 'booking.proto');
const packageDefinitionBooking = protoLoader.loadSync(PROTO_PATH_BOOKING, {});
const bookingProto = grpc.loadPackageDefinition(packageDefinitionBooking).BookingService;
const bookingClient = new bookingProto('booking-service:50052', grpc.credentials.createInsecure());

// gRPC server setup for occupancy-service
const PROTO_PATH_OCCUPANCY = path.join(__dirname, 'occupancy.proto');
const packageDefinitionOccupancy = protoLoader.loadSync(PROTO_PATH_OCCUPANCY, {});
const occupancyProto = grpc.loadPackageDefinition(packageDefinitionOccupancy).OccupancyService;

// Create a gRPC client for occupancy-service
// REMOVE THIS WHEN REMOVING EXPRESS ROUTES (this is so that the express routes can call the gRPC methods)
// in future it calls the gRPC methods directly, not through express routes
const occupancyClient = new occupancyProto('occupancy-service:50053', grpc.credentials.createInsecure());

/* MQTT SET UP */
// Connect to the public MQTT broker (HiveMQ)
const mqttClient = mqtt.connect('mqtt://broker.hivemq.com:1883');

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
    console.log('Connected to public MQTT broker (HiveMQ)');
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

// Define a function to fetch all bookings from the BookingService via gRPC
// function getAllBookingsFromBookingService() {
//     return new Promise((resolve, reject) => {
//         bookingClient.GetAllBookings({}, (error, response) => {
//             if (error) {
//             console.error('Error fetching bookings from BookingService:', error);
//             return reject('Failed to fetch bookings.');
//             }
//             resolve(response.bookings);
//         });
//     });
// }

// Define a gRPC method in the occupancy service for fetching all bookings
// async function getAllBookings(call, callback) {
//     try {
//         const bookings = await getAllBookingsFromBookingService();  // Call the booking service via gRPC
//         callback(null, { bookings });
//     } catch (error) {
//         callback({
//             code: grpc.status.INTERNAL,
//             details: 'Error fetching bookings from BookingService',
//         });
//     }
// }

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

/*
 *  API FUNCTIONS
 */

// Add this route to serve getAllBookings request via the Occupancy Service
// app.get('/api/get-all-bookings', async (req, res) => {
//     try {
//         const bookings = await getAllBookingsFromBookingService(); // This calls your gRPC service
//         res.status(200).json(bookings);
//     } catch (error) {
//         console.error('Error fetching bookings:', error);
//         res.status(500).send('Failed to fetch bookings.');
//     }
// });

// Get occupancy by counting number of checked-in users in every gym
app.get('/api/all-gyms', async (req, res) => {
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
    const gymName = req.body[0];
    const maxCap = req.body[1];

    console.log(req.body);

    if (!gymName || !maxCap) {
        return res.status(400).json({ message: 'All fields are required' });
    }

    try {
        // Find the largest gymID in the collection
        const largestGym = await gymsCollection.find().sort({ gymID: -1 }).limit(1).toArray();
        const newGymID = largestGym.length > 0 ? largestGym[0].gymID + 1 : 1;  // If no gym exists, start at 1

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

// Edit Gym
app.put('/api/edit-gym/:gymID', async (req, res) => {
    const gymID = parseInt(req.params.gymID);
    const { gymName, maxCap } = req.body;

    if (!gymName || !maxCap) {
        return res.status(400).json({ message: 'All fields are required' });
    }

    try {
        const updateResult = await gymsCollection.updateOne(
            { gymID: gymID },
            { $set: { gymName: gymName, maxCap: parseInt(maxCap) } }
        );

        if (updateResult.modifiedCount === 0) {
            return res.status(404).json({ message: 'Gym not found' });
        }

        console.log(`Gym updated with gymID: ${gymID}`);
        return res.sendStatus(200);
    } catch (err) {
        console.error(`Error updating gym: ${err}`);
        return res.status(500).json({ message: 'Server error. Failed to update gym' });
    }
});

// Delete Gym
app.delete('/api/delete-gym', async (req, res) => {
    const gymID = parseInt(req.query['gymID']);

    try {
        // First, delete all equipment associated with this gymID
        const deleteEquipmentResult = await equipmentCollection.deleteMany({ gymID: gymID });

        if (deleteEquipmentResult.deletedCount === 0) {
            console.log(`No equipment found for gymID: ${gymID}`);
        } else {
            console.log(`Deleted ${deleteEquipmentResult.deletedCount} pieces of equipment associated with gymID: ${gymID}`);
        }

        // Then delete the gym
        const deleteGymResult = await gymsCollection.deleteOne({ gymID: gymID });

        console.log(deleteGymResult);

        if (deleteGymResult.deletedCount === 0) {
            return res.status(404).json({ message: 'Gym not found' });
        }

        console.log(`Gym deleted with gymID: ${gymID}`);
        return res.status(200).json({ message: 'Gym and associated equipment deleted successfully' });
    } catch (err) {
        console.error(`Error deleting gym and equipment: ${err}`);
        return res.status(500).json({ message: 'Server error. Failed to delete gym and equipment' });
    }
});

// Create Equipment
app.post('/api/create-equipment', async (req, res) => {
    const { equipmentName, equipmentType, gymID, purpose } = req.body;

    if (!equipmentName || !equipmentType || !gymID || !purpose) {
        return res.status(400).json({ message: 'All fields are required' });
    }

    try {
        // Find the largest itemID in the collection
        const largestItem = await equipmentCollection.find().sort({ itemID: -1 }).limit(1).toArray();
        const newItemID = largestItem.length > 0 ? largestItem[0].itemID + 1 : 1;  // If no item exists, start at 1

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

// Get Gyms (calls gRPC service from the API call)
// app.get('/api/get-gyms', async (req, res) => {
//     occupancyClient.GetGyms({}, (error, response) => {
//         if (error) {
//             console.error('Error fetching gyms via gRPC:', error);
//             return res.status(500).send('Failed to fetch gyms.'); // Use return to prevent multiple responses
//         }
//         res.status(200).json(response.gyms); // Ensure only one response is sent
//     });
// });

/*
 *  END OF API FUNCTIONS
 */



/*
 *  gRPC SECTION
 */

// Start occupancy gRPC server
const grpcServer = new grpc.Server();
grpcServer.addService(occupancyProto.service, { 
    GetGyms : getGyms,
    // GetAllBookings: getAllBookings,  //fetch all bookings for admin overview to see all booking status
    EditGym: editGym,  // Add edit gym handler
    DeleteGym: deleteGym,  // Add delete gym handler
});
grpcServer.bindAsync('0.0.0.0:50053', grpc.ServerCredentials.createInsecure(), () => {
    console.log('gRPC server running at http://0.0.0.0:50053');
});

// Edit Gym via gRPC
async function editGym(call, callback) {
    const { gymID, gymName, maxCap } = call.request;

    try {
        const updateResult = await gymsCollection.updateOne(
            { gymID: gymID },
            { $set: { gymName: gymName, maxCap: parseInt(maxCap) } }
        );

        if (updateResult.modifiedCount === 0) {
            return callback(null, { message: 'Gym not found' });
        }

        console.log(`Gym updated with gymID: ${gymID}`);
        callback(null, { message: 'Gym updated successfully' });
    } catch (err) {
        callback({
            code: grpc.status.INTERNAL,
            details: 'Error updating gym',
        });
    }
}

// Delete Gym via gRPC 
async function deleteGym(call, callback) {
    const { gymID } = call.request;

    try {
        const deleteResult = await gymsCollection.deleteOne({ gymID: gymID });

        if (deleteResult.deletedCount === 0) {
            return callback(null, { message: 'Gym not found' });
        }

        console.log(`Gym deleted with gymID: ${gymID}`);
        callback(null, { message: 'Gym deleted successfully' });
    } catch (err) {
        callback({
            code: grpc.status.INTERNAL,
            details: 'Error deleting gym',
        });
    }
}

// Get all gyms (gRPC)
async function getGyms (call, callback) {
    try{
        const gyms = await gymsCollection.find().toArray();
        callback(null, {gyms});
    }catch(error){
        callback({
        code: grpc.status.INTERNAL,
        details: 'Error fetching gyms list',
        });
    }
}

/*
 *  END OF gRPC SECTION
 */

app.listen(PORT, () => {
    console.log(`Occupancy service running on port ${PORT}`);
});
