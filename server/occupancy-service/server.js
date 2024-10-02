const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const app = express();
app.use(cors());
app.use(bodyParser.json());
const PORT = process.env.PORT || 5003;

/* 
*DATABASE SET UP
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
            }
            resolve(response.username);
        });
    });
}


// Get occupancy by counting number of checkedIn users in every gym
app.get('/api/occupancy', async (req, res) => {
    try {
        // find all gym documents 
        let cursor = await gymsCollection.find();
        let gyms = [];
        for await (const doc of cursor) {
            gyms.push(doc);
        }

        // find all checkedIn documents 
        // cursor = checkedInCollection.find();
        // let checkedIns = [];
        // for await (const doc of cursor) {
        //     checkedIns.push(doc);
        // }

        // Count number of checkIns for each gym
        for (let i = 0; i < gyms.length; i++) {
            // for (let j = 0; j < checkedIns.length; j++) {
            //     if (gyms[i].gymID == checkedIns[j].gymID) {
            //         numOfGymGoers++;
            //     }
            // }
            let numOfGymGoers = await checkedInCollection.countDocuments({ "gymID" : gyms[i].gymID });
            console.log("Gym " + gyms[i].gymName + " has " + numOfGymGoers + " people inside right now");
            gyms[i].occupants = numOfGymGoers;
        }
        res.status(200).json(gyms);
    } 
    catch (err) {
        console.error(`Something went wrong trying to find the documents: ${err}\n`);
        res.sendStatus(500);
    }
});

// Update occupancy by adding check-in record/document
app.post('/api/check-in', async (req, res) => {
    // TO-DO: 
    // validate check-in by checking if user is already checked in to the same gym. 
    
    const token = req.body[0];
    const gym = req.body[1];

    const username = await getUserFromToken(token);

    const checkIn = {
        username : username,
        gymID : gym,
        timestamp : new Date().toString()
    };

    try {
        console.log(checkIn);
        // await checkedInCollection.insertOne(checkIn);
        // console.log("Inserted check-in record");
        // res.sendStatus(200);
    }
    catch (err) {
        console.error(`Something went wrong trying to find the documents: ${err}\n`);
        res.sendStatus(500);
    }
});

app.post('/api/check-out', async (req, res) => {
    // TO-DO: 
    // validate check-out by checking if user has checked in to the gym. 

    const token = req.body[0];
    const gym = req.body[1];

    const username = await getUserFromToken(token);

    const filter = {
        username : username,
        gymID : gym
    }

    try {
        await checkedInCollection.deleteOne(filter)
        console.log("Deleted check-in record");
        res.sendStatus(200);
    }
    catch (err) {
        console.error(`Something went wrong trying to find the documents: ${err}\n`);
        res.sendStatus(500);
    }
});

app.listen(PORT, () => {
    console.log(`Occupancy service running on port ${PORT}`);
});