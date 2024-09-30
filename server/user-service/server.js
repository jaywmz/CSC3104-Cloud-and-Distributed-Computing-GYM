const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const userRoutes = require('./routes/userRoutes');
const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const path = require('path');

// Initialize the Express app
const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
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
const uri = "mongodb+srv://csc3104grp:9FzZmCSr5pDRqvL9@userdatabase.gfv68.mongodb.net/?retryWrites=true&w=majority";
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

// Start gRPC server
const grpcServer = new grpc.Server();
grpcServer.addService(userProto.service, {
  GetUser: getUser,
  GetUserByRole: getUserByRole,
  GetAllUsers: getAllUsers,
});

grpcServer.bindAsync('0.0.0.0:50051', grpc.ServerCredentials.createInsecure(), () => {
  console.log('gRPC server running at http://0.0.0.0:50051');
});
