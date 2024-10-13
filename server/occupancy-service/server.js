const express = require('express');
const cors = require('cors');
const path = require('path');
const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const bodyParser = require('body-parser');
const app = express();
app.use(cors());
app.use(bodyParser.json());
const PORT = process.env.PORT || 5003;

/* 
 * DATABASE SET UP
 */
const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = "mongodb+srv://leooh29:DoHTA3c5W08GHGQq@occupancydb.xq4hb.mongodb.net/?retryWrites=true&w=majority&appName=OccupancyDB";
// Create a MongoClient with a MongoClientOptions object to set the Stable API version
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
// const equipUsageCollection = equipmentDB.collection("equipUsage");

/*
 * gRPC SET UP
 */
// gRPC client setup for user-service
const PROTO_PATH = path.join(__dirname, '../user-service/user.proto');
const packageDefinition = protoLoader.loadSync(PROTO_PATH, {});
const userProto = grpc.loadPackageDefinition(packageDefinition).UserService;
// Create a gRPC client for user-service
const userClient = new userProto('localhost:50051', grpc.credentials.createInsecure());
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
        if (record) {
            return true;
        } else {
            return false;
        }
    } catch (err) {
        console.log(err);
        return false;
    }
};

// Checks if theres an equipment being used by the given username
async function checkUsage(itemID) {
    try {
        const record = await equipmentCollection.findOne({ "itemID" : itemID });
        if (record.inUse) {
            return true;
        } else {
            return false;
        }
    } catch (err) {
        console.log(err);
        return false;
    }
};

// Get occupancy by counting number of checkedIn users in every gym
app.get('/api/occupancy', async (req, res) => {
    try {
        // find all gym documents 
        const cursor = await gymsCollection.find();
        let gyms = [];
        for await (const doc of cursor) {
            gyms.push(doc);
        }

        // Count number of checkIns for each gym, for-loop loops through each gym
        for (let i = 0; i < gyms.length; i++) {
            // call mongodb count documents function to return number of checkedIn documents for a gym
            const numOfGymGoers = await checkedInCollection.countDocuments({ "gymID" : gyms[i].gymID });
            // add number of people in a gym as attribute in the current gym object of this for-loop iteration
            gyms[i].occupants = numOfGymGoers;
            // Group the equipments of each gym into each gym object
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
        }
        else {
            return res.status(404);
        }   
    }
    catch (err) {
        console.log(`Something went wrong trying to find the documents: ${err}\n`);
        return res.sendStatus(500);
    }
});

// Update occupancy by adding check-in record/document
// Each user should only be able to check in at one gym at a time
app.post('/api/check-in', async (req, res) => {
    // Prepare checkIn object attributes
    const token = req.body[0];
    const gym = req.body[1];
    let username;
    try {
        username = await getUserFromToken(token);
    } catch (err) {
        console.log(err);
        return res.sendStatus(500);
    };

    // Check if there is existing record of check-in that contains given username
    // if not, create new check-in record and insert into db 
    const exists = await findCheckIn(username);
    if (exists) {
        const message = "User has already checked-in to a gym."
        return res.send(message);
    }
    else {
        const checkIn = {
            username : username,
            gymID : gym,
            timestamp : new Date().toString()
        };

        try {
            await checkedInCollection.insertOne(checkIn);
            console.log("Inserted check-in record");
            return res.sendStatus(200);
        }
        catch (err) {
            console.log(`Something went wrong trying to find the documents: ${err}\n`);
            return res.sendStatus(500);
        };
    }
});

// Update occupancy by removing check-in record/document
// If no check-in document exist for a user, then check-out should not happen. 
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
            const filter = {
                username : username,
            }
            await checkedInCollection.deleteOne(filter)
            console.log("Deleted check-in record");
            return res.sendStatus(200);
        }
        catch (err) {
            console.log(`Something went wrong trying to find the documents: ${err}\n`);
            return res.sendStatus(500);
        }
    }
    else {
        const message = "User has not checked-in to this gym before."
        return res.send(message);
    }
});

// Update equipment usage by setting equipment inUse attribute to TRUE
app.post('/api/start-using', async (req, res) => {
    const token = req.body[0];
    const equipment = req.body[1];

    const inUse = await checkUsage(equipment);
    if (inUse) {
        const message = "Equipment is being used."
        return res.send(message);
    }
    else {
        try {
            await equipmentCollection.updateOne(
                { itemID : equipment },
                { $set : { inUse : true } }
            );
            console.log("Updated equipment in-use to true.");
            return res.sendStatus(200);
        }
        catch (err) {
            console.log(`Something went wrong trying to find the documents: ${err}\n`);
            return res.sendStatus(500);
        };
    }
});

// Update equipment usage by setting equipment inUse attribute to FALSE
app.post('/api/stop-using', async (req, res) => {
    const token = req.body[0];
    const equipment = req.body[1];

    const inUse = await checkUsage(equipment);
    if (inUse) {
        try {
            await equipmentCollection.updateOne(
                { itemID : equipment },
                { $set : { inUse : false } }
            );
            console.log("Updated equipment in-use to false.");
            return res.sendStatus(200);
        }
        catch (err) {
            console.log(`Something went wrong trying to find the documents: ${err}\n`);
            return res.sendStatus(500);
        }
    }
    else {
        const message = "User has not been using any equipment."
        return res.send(message);
    }
});


app.post('/api/create-gym', async (req, res) => {
    const { gymName, maxCap } = req.body;

    if (!gymName || !maxCap) {
        return res.status(400).json({ message: 'All fields are required' });
    }

    try {
        // Count the number of existing gyms
        const count = await gymsCollection.countDocuments();

        // Increment the count by 1 to get the new gymID
        const newGymID = count + 1;

        // Create the new gym object
        const newGym = {
            gymID: newGymID,  // Auto-incremented gymID
            gymName: gymName,
            maxCap: parseInt(maxCap)
        };

        // Insert the new gym into the collection
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
        // Count the number of existing documents in the equipment collection
        const count = await equipmentCollection.countDocuments();

        // Increment count by 1 for the new itemID
        const newItemID = count + 1;

        // Create the new equipment object with the auto-incremented itemID
        const newEquipment = {
            itemID: newItemID,  // Set itemID based on the count
            type: equipmentType,
            name: equipmentName,
            gymID: parseInt(gymID),
            purpose: purpose,
            inUse: false
        };

        // Insert the new equipment into the collection
        await equipmentCollection.insertOne(newEquipment);
        console.log(`New equipment created with itemID: ${newItemID}`);
        return res.sendStatus(200);
    } catch (err) {
        console.error(`Error creating equipment: ${err}`);
        return res.status(500).json({ message: 'Server error. Failed to create equipment' });
    }
});

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
