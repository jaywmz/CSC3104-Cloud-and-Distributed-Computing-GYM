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
      console.error('Error fetching user:', error);
      callback(null); // Return null if user not found
    } else {
      console.log('User data:', response);
      callback(response); // Return the user data if found
    }
  });
};

// Booking route with gRPC call to validate user
app.post('/api/bookings', (req, res) => {
  const { user, slot } = req.body;

  // Validate user with gRPC
  checkUser(user, (userData) => {
    if (!userData) {
      return res.status(404).send('User not found');
    }

    // Simulate booking creation
    const booking = { id: Math.random(), user, slot };
    res.status(201).json(booking);
  });
});

// Start the server
const PORT = process.env.PORT || 5002;
app.listen(PORT, () => {
  console.log(`Booking service running on port ${PORT}`);
});
