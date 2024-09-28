const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const app = express();
const PORT = process.env.PORT || 5003;
const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = "mongodb+srv://leooh29:DoHTA3c5W08GHGQq@occupancydb.xq4hb.mongodb.net/?retryWrites=true&w=majority&appName=OccupancyDB";

app.use(cors());
app.use(bodyParser.json());

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    }
});

// Get occupancy by counting number of checkedIn users in every gym
app.get('/api/occupancy', async (req, res) => {
    // TO-DO: 
    // finding all gym documents as well as all checkedIn documents, 
    // then counting number of checkedIn documents for each gym.
    // Put into an array of gym objects, each object is { id, gymName, checkedInNum, maxCap }

    await client.connect();

    const dbName = "GymOccupancy";

    const database = client.db(dbName);
    const gymsCollection = database.collection("gyms");
    // const occupancyCollection = database.collection("checkedIn");

    try {
        const cursor = gymsCollection.find();
        let response = [];
        for await (const doc of cursor) {
            response.push(doc);
        }
        res.status(201).json(response);
    } 
    catch (err) {
        console.error(`Something went wrong trying to find the documents: ${err}\n`);
    }
});

// Update occupancy by adding check-in record/document
app.post('/api/check-in', (req, res) => {
    // TO-DO: 
    // From request, get user ID and gym ID.
    // Then get timestamp from current time. 
    // Make a new document with these 3 pieces of data,
    // then insert into "checkedIn" collection
});

app.listen(PORT, () => {
    console.log(`Occupancy service running on port ${PORT}`);
});
