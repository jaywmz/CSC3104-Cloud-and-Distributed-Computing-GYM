require('dotenv').config(); // Load environment variables

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const path = require('path');

// Initialize the Express app
const app = express();
app.use(cors());
app.use(bodyParser.json());

// MongoDB connection string
const { MongoClient } = require('mongodb');
const uri = process.env.MONGO_URI || "mongodb+srv://lichtwx:LzKVEOYBsPgSETjX@cluster0.obfql.mongodb.net/?retryWrites=true&w=majority";

// Middleware to connect to MongoDB with error handling
let db;
async function connectDB() {
  if (!db) {
    try {
      const client = new MongoClient(uri);
      await client.connect();
      db = client.db('bookingServiceDB');
      console.log('Connected to MongoDB');
    } catch (error) {
      console.error('Error connecting to MongoDB:', error);
      throw new Error('Failed to connect to the database.');
    }
  }
  return db;
}

// gRPC server setup for booking-service
const PROTO_PATH_BOOKING = path.join(__dirname, 'booking.proto');
const packageDefinitionBooking = protoLoader.loadSync(PROTO_PATH_BOOKING, {});
const bookingProto = grpc.loadPackageDefinition(packageDefinitionBooking).BookingService;

// gRPC client setup for user-service
const PROTO_PATH = path.join(__dirname, '../user-service/user.proto');
const packageDefinition = protoLoader.loadSync(PROTO_PATH, {});
const userProto = grpc.loadPackageDefinition(packageDefinition).UserService;

// Create a gRPC client for user-service
const userClient = new userProto('localhost:50051', grpc.credentials.createInsecure());

// gRPC server setup for occupancy-service
const PROTO_PATH_OCCUPANCY = path.join(__dirname, '../occupancy-service/occupancy.proto');
const packageDefinitionOccupancy = protoLoader.loadSync(PROTO_PATH_OCCUPANCY, {});
const occupancyProto = grpc.loadPackageDefinition(packageDefinitionOccupancy).OccupancyService;

// Create a gRPC client for occupancy-service
const occupancyClient = new occupancyProto('localhost:50053', grpc.credentials.createInsecure());

// Create a gRPC client for booking-service
// REMOVE THIS WHEN REMOVING EXPRESS ROUTES (this is so that the express routes can call the gRPC methods)
// in future it calls the gRPC methods directly, not through express routes
const bookingClient = new bookingProto('localhost:50052', grpc.credentials.createInsecure());

// Function to call user gRPC to convert token to user
function getUserFromToken(token) {
  return new Promise((resolve, reject) => {
    userClient.GetUserFromToken({ token }, (error, response) => {
      if (error) {
        console.error('Error fetching user from token:', error);
        return reject({
          code: grpc.status.INTERNAL,
          details: 'Error fetching user bookings',
        });
      }
      resolve(response.username);
    });
  });
}

// Booking route with gRPC call to validate user and saving to MongoDB
app.post('/api/bookings', (req, res) => {
  // Pass the token from request into the gRPC call metadata (in future, cannot use HTTP headers as no HTTP call into gRPC. so do this for now)
  const token = new grpc.Metadata();
  token.add('Authorization', `${req.header('Authorization').split(' ')[1]}`);

  const { slot, gymId } = req.body;

  // Save booking to MongoDB using createBooking gRPC method
  bookingClient.CreateBooking({ slot, gymId }, token, (error, booking) => {
    if (error) {
      if (error.code === grpc.status.ALREADY_EXISTS) {
        // Return 409 status code for duplicate bookings
        res.status(409).send({ details: error.details });
      }else{
        console.error('Error creating booking via gRPC:', error);
        res.status(500).send('Failed to create booking');
      }
      } else {
        res.status(200).json(booking);
    }
  });
});

// Route to fetch all gyms from occupancy-service
app.get('/api/bookings/getGyms', (req, res) => {
  occupancyClient.GetGyms({}, (error, response) => {
    if (error) {
      console.error('Error fetching gyms via gRPC:', error);
      res.status(500).send('Failed to fetch gyms.');
    } else {
      res.status(200).json(response.gyms);
    }
  });
});

// Route to fetch all bookings
// USING THE EXPRESS ROUTE TO CALL THE gRPC METHOD (REMOVE THIS WHEN REMOVING EXPRESS ROUTES)
app.get('/api/bookings', (req, res) => {
  bookingClient.GetAllBookings({}, (error, response) => {
    if (error) {
      console.error('Error fetching bookings via gRPC:', error);
      res.status(500).send('Failed to fetch bookings.');
    } else {
      res.status(200).json(response.bookings);
    }
  });
});

// Route to fetch user's bookings
// USING THE EXPRESS ROUTE TO CALL THE gRPC METHOD (REMOVE THIS WHEN REMOVING EXPRESS ROUTES)
app.get('/api/bookings/user', (req, res) => {

    // Pass the token from request into the gRPC call metadata (in future, cannot use HTTP headers as no HTTP call into gRPC. so do this for now)
    const token = new grpc.Metadata();
    token.add('Authorization', `${req.header('Authorization').split(' ')[1]}`);

    bookingClient.GetUserBookings({}, token, (error, response) => {
      if (error) {
        console.error('Error fetching user bookings via gRPC:', error);
        res.status(500).send('Failed to fetch user bookings.');
      } else {
        res.status(200).json(response.bookings);
      }
    });
  });

// Route to fetch gym's bookings
// USING THE EXPRESS ROUTE TO CALL THE gRPC METHOD (REMOVE THIS WHEN REMOVING EXPRESS ROUTES)
app.get('/api/bookings/gym/:gymId', (req, res) => {
  const { gymId } = req.params;

  bookingClient.GetGymBookings({ gymId }, (error, response) => {
    if (error) {
      console.error('Error fetching gym bookings via gRPC:', error);
      res.status(500).send('Failed to fetch gym bookings.');
    } else {
      res.status(200).json(response.bookings);
    }
  });
});

// Route to delete a booking
// USING THE EXPRESS ROUTE TO CALL THE gRPC METHOD (REMOVE THIS WHEN REMOVING EXPRESS ROUTES)
app.delete('/api/bookings/delete/:id', (req, res) => {
  // Pass the token from request into the gRPC call metadata (in future, cannot use HTTP headers as no HTTP call into gRPC. so do this for now)
  const token = new grpc.Metadata();
  token.add('Authorization', `${req.header('Authorization').split(' ')[1]}`);

  const { id } = req.params;

  bookingClient.DeleteBooking({ id }, token, (error, response) => {
    if (error) {
      return res.status(500).send('Failed to delete booking.');
    }
    res.status(200).json(response);
    });
});

// gRPC methods implementation
// Get a booking by ID
async function getBooking (call, callback) {
  try{
    const db = await connectDB();
    const bookingsCollection = db.collection('bookings');
    const booking = await bookingsCollection.findOne({ id: call.request.id });
    if(booking){
      callback(null, booking);
    }else{
      callback({
        code: grpc.status.NOT_FOUND,
        details: 'Booking not found',
      });
    }
  }catch(error){
    callback({
      code: grpc.status.INTERNAL,
      details: 'Error fetching booking',
    });
  }
};

// Get all bookings
async function getAllBookings (call, callback) {
  try{
    const db = await connectDB();
    const bookingsCollection = db.collection('bookings');
    const bookings = await bookingsCollection.find({}).toArray();
    callback(null, {bookings});
  }catch(error){
    callback({
      code: grpc.status.INTERNAL,
      details: 'Error fetching bookings',
    });
  }

};

// Get all bookings for a user
async function getUserBookings (call, callback) {
  try{
    // Extract the token from the metadata
    const token = call.metadata.get('authorization')[0];
    
    // Decode the token to get the user
    const user = await getUserFromToken(token);

    const db = await connectDB();
    const bookingsCollection = db.collection('bookings');
    const bookings = await bookingsCollection.find({ user: user }).toArray();
    callback(null, {bookings});
  }catch(error){
    callback({
      code: grpc.status.INTERNAL,
      details: 'Error fetching user bookings',
    });
  }
};

// Create a new booking
async function createBooking(call, callback) {
  try {
    const db = await connectDB();
    const bookingsCollection = db.collection('bookings');
    const booking = call.request;
    booking.id = Math.floor(Math.random() * 1000); // Generate a random ID
    booking.gymId = parseInt(booking.gymId); // Convert gymId string to integer
    await bookingsCollection.insertOne(booking);
    callback(null, booking);
  } catch (error) {
    callback({
      code: grpc.status.INTERNAL,
      details: 'Error creating booking',
    });
  }
}

// Get all bookings for a gym
async function getGymBookings (call, callback) {
  try{
    const db = await connectDB();
    const bookingsCollection = db.collection('bookings');
    const bookings = await bookingsCollection.find({ gymId: call.request.gymId }).toArray();
    callback(null, {bookings});
  }catch(error){
    callback({
      code: grpc.status.INTERNAL,
      details: 'Error fetching gym bookings',
    });
  }
};

async function createBooking(call, callback) {
  try {
    // Extract the token from the metadata 
    const token = call.metadata.get('authorization')[0]; // Get token from metadata

    // Decode the token to get the user
    const user = await getUserFromToken(token);

    const db = await connectDB();
    const bookingsCollection = db.collection('bookings');
    const { slot, gymId } = call.request;

    // Check for duplicate booking (same user, gymId, and slot)
    const duplicateBooking = await bookingsCollection.findOne({
      user: user,
      gymId: parseInt(gymId), // Make sure gymId is an integer
      slot: slot,
    });

    if (duplicateBooking) {
      // If a duplicate booking is found, return an error response
      return callback({
        code: grpc.status.ALREADY_EXISTS,
        details: 'Duplicate booking: You already have a booking at the same time and gym.',
      });
    }

    const booking = call.request;
    booking.user = user;
    booking.id = Math.floor(Math.random() * 1000); // Generate a random ID
    booking.gymId = parseInt(booking.gymId); // Convert gymId string to integer
    bookingsCollection.insertOne(booking);
    callback(null, booking);
  } catch (error) {
    console.error('Error creating booking:', error);
    callback({
      code: grpc.status.INTERNAL,
      details: 'Error creating booking',
    });
  }
}

// Delete a booking by id
async function deleteBooking(call, callback) {
  try{
    // Extract the token from the metadata
    const token = call.metadata.get('authorization')[0];
    
    // Decode the token to get the user
    const user = await getUserFromToken(token);

    const db = await connectDB();
    const bookingsCollection = db.collection('bookings');
    const booking = await bookingsCollection.findOne({ id: call.request.id });

    if(booking.user !== user){
      callback({
        code: grpc.status.PERMISSION_DENIED,
        details: 'You are not authorized to delete this booking',
      });
      return;
    }

    if(booking){
      await bookingsCollection.deleteOne({ id: call.request.id });
      callback(null, {});
    }else{
      callback({
        code: grpc.status.NOT_FOUND,
        details: 'Booking not found',
      });
    }
  }catch(error){
    callback({
      code: grpc.status.INTERNAL,
      details: 'Error deleting booking',
    });
  }
};

// Update a booking
async function updateBooking(call, callback){
    
}; 

// Start the server
const PORT = process.env.PORT || 5002;
app.listen(PORT, () => {
  console.log(`Booking service running on port ${PORT}`);
});

// Start gRPC server
const grpcServer = new grpc.Server();
grpcServer.addService(bookingProto.service, { 
  GetBooking:  getBooking,
  GetAllBookings: getAllBookings,
  GetUserBookings: getUserBookings,
  GetGymBookings: getGymBookings,
  CreateBooking: createBooking,
  DeleteBooking: deleteBooking,
  UpdateBooking: updateBooking,
});
grpcServer.bindAsync('0.0.0.0:50052', grpc.ServerCredentials.createInsecure(), () => {
  console.log('gRPC server running at http://0.0.0.0:50052');
});
