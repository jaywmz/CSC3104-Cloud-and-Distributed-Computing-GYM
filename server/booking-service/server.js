const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const path = require('path');
const jwt = require('jsonwebtoken');

// Initialize the Express app
const app = express();

app.use(cors());
app.use(bodyParser.json());


// MongoDB connection string
const { MongoClient } = require('mongodb');
const uri = "mongodb+srv://lichtwx:LzKVEOYBsPgSETjX@cluster0.obfql.mongodb.net/?retryWrites=true&w=majority";
let db;

// Middleware to connect to MongoDB with error handling
async function connectDB() {
  if (!db) {
    try {
      const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
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

// JWT Middleware to extract and decode the token
const authenticateToken = (req, res, next) => {
  const token = req.header('Authorization')?.split(' ')[1];
  if (!token) {
    return res.status(401).send('Access denied. No token provided.');
  }

  jwt.verify(token, 'secretkey', (err, user) => {
    if (err) {
      return res.status(403).send('Invalid token.');
    }
    req.user = user; // Attach the user info (decoded JWT) to the request
    next();
  });
};

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

// Create a gRPC client for booking-service
// REMOVE THIS WHEN REMOVING EXPRESS ROUTES (this is so that the express routes can call the gRPC methods)
// in future it calls the gRPC methods directly, not through express routes
const bookingClient = new bookingProto('localhost:50052', grpc.credentials.createInsecure());

// Function to validate user using gRPC
const checkUser = (username, callback) => {
  userClient.GetUser({ username }, (error, response) => {
    if (error) {
      console.error('Error fetching user via gRPC:', error);
      callback(null); // Return null if user not found
    } else {
      console.log('User data:', response);
      callback(response); // Return the user data if found
    }
  });
};

// Booking route with gRPC call to validate user and saving to MongoDB
app.post('/api/bookings', authenticateToken, (req, res) => {
  const { username } = req.user; // Extract the username from the token
  const { slot, gymId } = req.body;

  // Validate user with gRPC
  checkUser(username, (userData) => {
    if (!userData) {
      return res.status(404).send('User not found');
    }

    // Save booking to MongoDB using createBooking gRPC method
    bookingClient.CreateBooking({ user: username, slot, gymId }, (error, booking) => {
      if (error) {
        console.error('Error creating booking via gRPC:', error);
        res.status(500).send('Failed to create booking');
      } else {
        res.status(200).json(booking);
      }
    });
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
app.get('/api/bookings/user', authenticateToken, (req, res) => {
    const { username } = req.user; // Extract the username from the decoded token
  
    bookingClient.GetUserBookings({ user: username }, (error, response) => {
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
app.delete('/api/bookings/delete/:id', authenticateToken, (req, res) => {
  const { username } = req.user; // Extract the username from the token
  const { id } = req.params;

  // Fetch booking first
  bookingClient.GetBooking({ id }, (error, booking) => {
    if (error || !booking) {
      return res.status(404).send('Booking not found.');
    }

    // Ensure that only the owner can delete their booking
    if (booking.user === username) {
      bookingClient.DeleteBooking({ id }, (error, response) => {
        if (error) {
          return res.status(500).send('Failed to delete booking.');
        }
        res.status(200).json(response);
      });
    } else {
      res.status(403).send('You are not authorized to delete this booking.');
    }
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
    const db = await connectDB();
    const bookingsCollection = db.collection('bookings');
    const bookings = await bookingsCollection.find({ user: call.request.user }).toArray();
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

// Create a new booking
async function createBooking (call, callback) {
  try{
    const db = await connectDB();
    const bookingsCollection = db.collection('bookings');
    const booking = call.request;
    booking.id = Math.floor(Math.random() * 1000); // Generate a random ID (but can be duplicated right now with existing entries)
    booking.gymId = parseInt(booking.gymId); // Convert gymId string to integer
    bookingsCollection.insertOne(booking);
    callback(null, booking);
  }catch(error){
    callback({
      code: grpc.status.INTERNAL,
      details: 'Error creating booking',
    });
  }
};

// Delete a booking by id
async function deleteBooking(call, callback) {
  // TODO: check if the user is the owner of the booking first before deleting (currently doesn't check)
  try{
    const db = await connectDB();
    const bookingsCollection = db.collection('bookings');
    const booking = await bookingsCollection.findOne({ id: call.request.id });
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
