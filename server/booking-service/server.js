const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const mongoose = require('mongoose');
const path = require('path');

// Initialize the Express app
const app = express();

app.use(cors());
app.use(bodyParser.json());

// MongoDB connection using your connection string
const MONGO_URI = 'mongodb+srv://lichtwx:LzKVEOYBsPgSETjX@cluster0.obfql.mongodb.net/bookingServiceDB?retryWrites=true&w=majority';
mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('Error connecting to MongoDB:', err));

// Mongoose Booking Schema and Model
const bookingSchema = new mongoose.Schema({
  user: { type: String, required: true },
  slot: { type: String, required: true }
});
const Booking = mongoose.model('Booking', bookingSchema);

// gRPC server setup
const PROTO_PAT_BOOKING = path.join(__dirname, 'booking.proto');
const packageDefinitionBooking = protoLoader.loadSync(PROTO_PATH, {});
const bookingProto = grpc.loadPackageDefinition(packageDefinition).BookingService;

// gRPC client setup for user-service
const PROTO_PATH = path.join(__dirname, '../user-service/user.proto');
const packageDefinition = protoLoader.loadSync(PROTO_PATH, {});
const userProto = grpc.loadPackageDefinition(packageDefinition).UserService;

// Create a gRPC client for user-service
const userClient = new userProto('localhost:50051', grpc.credentials.createInsecure());

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
app.post('/api/bookings', (req, res) => {
  const { user, slot } = req.body;

  // Validate user with gRPC
  checkUser(user, (userData) => {
    if (!userData) {
      return res.status(404).send('User not found');
    }

    // Create and save booking in MongoDB
    const newBooking = new Booking({ user, slot });
    newBooking.save()
      .then((booking) => {
        console.log('Booking created:', booking);  // Log booking creation
        res.status(201).json(booking);
      })
      .catch((error) => {
        console.error('Error saving booking:', error);
        res.status(500).send('Failed to create booking.');
      });
  });
});

// Route to fetch all bookings
app.get('/api/bookings', (req, res) => {
  Booking.find()
    .then((bookings) => {
      res.status(200).json(bookings);
    })
    .catch((error) => {
      console.error('Error fetching bookings:', error);
      res.status(500).send('Failed to fetch bookings.');
    });
});

// gRPC methods implementation
const getBooking = async (call, callback) => {

};

const getAllBookings = async (call, callback) => {

};

const getUserBookings = async (call, callback) => {

};

const getGymBookings = async (call, callback) => {

};

const createBooking = async (call, callback) => {
  
};

const deleteBooking = async (call, callback) => {
  
};

const updateBooking = async (call, callback) => {
    
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
