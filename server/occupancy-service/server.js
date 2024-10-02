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
const dbName = "GymOccupancy";
const database = client.db(dbName);
const gymsCollection = database.collection("gyms");
const checkedInCollection = database.collection("checkedIn");

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
                    details: 'Error fetching user bookings',
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
        console.log("Record found: \n" + record);
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

// Get occupancy by counting number of checkedIn users in every gym
app.get('/api/occupancy', async (req, res) => {
    try {
        // find all gym documents 
        const cursor = gymsCollection.find();
        let gyms = [];
        for await (const doc of cursor) {
            gyms.push(doc);
        }

        // Count number of checkIns for each gym, for-loop loops through each gym
        for (let i = 0; i < gyms.length; i++) {
            // call mongodb count documents function to return number of checkedIn documents for a gym
            const numOfGymGoers = await checkedInCollection.countDocuments({ "gymID" : gyms[i].gymID });
            // add number of people in a gym as object attribute into the current gym object of this for-loop iteration
            gyms[i].occupants = numOfGymGoers;
        }

        return res.status(200).json(gyms);
    } 
    catch (err) {
        console.log(`Something went wrong trying to find the documents: ${err}\n`);
        return res.sendStatus(500);
    }
});

// Update occupancy by adding check-in record/document
// Each user should only be able to check in at one gym at a time
app.post('/api/check-in', async (req, res) => {
    // TO-DO: 
    // validate check-in by checking if user is already checked in to the same gym. 
    
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
    // TO-DO: 
    // validate check-out by checking if user has checked in to a gym. 

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

app.listen(PORT, () => {
    console.log(`Occupancy service running on port ${PORT}`);
});