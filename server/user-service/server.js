require('dotenv').config();

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const userRoutes = require('./routes/userRoutes');
const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const path = require('path');
const jwt = require('jsonwebtoken');

// Initialize the Express app
const app = express();
const PORT = process.env.PORT || 5001;

// (TEST FIX FOR CORS FAILURE ERROR) Grant all origins access to server resources
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*"); // update to match the domain you will make the request from
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

// Configure CORS options if needed, for example:
const corsOptions = {
  origin: '*',  // Use '*' to allow all origins, or specify an array of allowed origins
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));
app.use(bodyParser.json());

// User Routes
app.use('/api/users', userRoutes);

// Start Express server
app.listen(PORT, () => {
  console.log(`User service running on port ${PORT}`);
});

// gRPC server setup
const PROTO_PATH = path.join(__dirname, 'user.proto');
const packageDefinition = protoLoader.loadSync(PROTO_PATH, {});
const userProto = grpc.loadPackageDefinition(packageDefinition).UserService;

// Mongoose User Schema (could reuse the same MongoDB connection from routes)
const { MongoClient } = require('mongodb');
const uri = process.env.MONGO_URI;
let db;

// Middleware to connect to MongoDB with error handling
async function connectDB() {
  if (!db) {
    try {
      const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
      await client.connect();
      db = client.db('userdatabase');
      console.log('Connected to MongoDB');
    } catch (error) {
      console.error('Error connecting to MongoDB:', error);
      throw new Error('Failed to connect to the database.');
    }
  }
  return db;
}

// gRPC method implementation
const getUser = async (call, callback) => {
  try {
    const db = await connectDB();
    const usersCollection = db.collection('users');
    const user = await usersCollection.findOne({ username: call.request.username });

    if (user) {
      callback(null, { username: user.username, email: user.email, role: user.role });
    } else {
      callback({
        code: grpc.status.NOT_FOUND,
        details: "User not found",
      });
    }
  } catch (error) {
    callback({
      code: grpc.status.INTERNAL,
      details: "Internal server error",
    });
  }
};

// GetUserByRole
const getUserByRole = async (call, callback) => {
  try {
    const db = await connectDB();
    const usersCollection = db.collection('users');
    const users = await usersCollection.find({ role: call.request.role }).toArray();

    if (users.length > 0) {
      const userList = users.map(user => ({
        username: user.username,
        email: user.email,
        role: user.role,
      }));
      callback(null, { users: userList });
    } else {
      callback({
        code: grpc.status.NOT_FOUND,
        details: "No users found with the specified role",
      });
    }
  } catch (error) {
    callback({
      code: grpc.status.INTERNAL,
      details: "Internal server error",
    });
  }
};

// GetAllUsers
const getAllUsers = async (call, callback) => {
  try {
    const db = await connectDB();
    const usersCollection = db.collection('users');
    const users = await usersCollection.find({}).toArray();

    const userList = users.map(user => ({
      username: user.username,
      email: user.email,
      role: user.role,
    }));
    callback(null, { users: userList });
  } catch (error) {
    callback({
      code: grpc.status.INTERNAL,
      details: "Internal server error",
    });
  }
};

// call consists of the token from the calling client, callback is the function injected into the parameters from the calling client.
function getUserFromToken(call, callback) {
  try {
    const token = call.request.token;
    
    // Ensure the JWT secret is securely stored in environment variables
    const secretKey = process.env.JWT_SECRET || 'fallbackSecretKey'; // Load from .env

    // Verify the token using the JWT secret
    jwt.verify(token, secretKey, (error, user) => {
      if (error) {
        console.error('Error verifying token:', error);
        // Return an error if the token is invalid
        return callback({
          code: grpc.status.UNAUTHENTICATED,
          details: "Invalid token",
        });
      }
      
      // If token is valid, return the username
      callback(null, { username: user.username, role: user.role });
    });
  } catch (error) {
    console.error('Error during token verification:', error);
    // Return an internal error if something went wrong
    callback({
      code: grpc.status.INTERNAL,
      details: "Internal server error",
    });
  }
};


// Start gRPC server
const grpcServer = new grpc.Server();
grpcServer.addService(userProto.service, {
  GetUser: getUser,
  GetUserByRole: getUserByRole,
  GetAllUsers: getAllUsers,
  GetUserFromToken: getUserFromToken
});

grpcServer.bindAsync('0.0.0.0:50051', grpc.ServerCredentials.createInsecure(), () => {
  console.log('gRPC server running at http://0.0.0.0:50051');
});
