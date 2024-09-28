const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const path = require('path');

// Initialize the Express app
const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(bodyParser.json());

// Mock user data
const users = [
  { username: 'testuser', email: 'test@example.com', password: 'test123', role: 'user' },
  { username: 'adminuser', email: 'admin@example.com', password: 'admin123', role: 'admin' }
];

// Login Route
app.post('/api/users/login', (req, res) => {
  const { username, password } = req.body;
  const user = users.find(u => u.username === username && u.password === password);
  
  if (user) {
    res.json({ token: 'fake-jwt-token', user: { username: user.username, email: user.email, role: user.role } });
  } else {
    res.status(401).json({ message: 'Invalid credentials' });
  }
});

// Register Route (Optional for real data usage)
app.post('/api/users/register', (req, res) => {
  const { username, password, email } = req.body;
  if (users.find(u => u.username === username)) {
    return res.status(400).json({ message: 'User already exists' });
  }
  const newUser = { username, password, email, role: 'user' };
  users.push(newUser);
  res.status(201).json({ message: 'User registered successfully', user: newUser });
});

// gRPC server setup
const PROTO_PATH = path.join(__dirname, 'user.proto');
const packageDefinition = protoLoader.loadSync(PROTO_PATH, {});
const userProto = grpc.loadPackageDefinition(packageDefinition).UserService;

// gRPC method implementation
const getUser = (call, callback) => {
  const user = users.find(u => u.username === call.request.username);
  if (user) {
    callback(null, { username: user.username, email: user.email, role: user.role });
  } else {
    callback({
      code: grpc.status.NOT_FOUND,
      details: "User not found"
    });
  }
};

// Start gRPC server
const grpcServer = new grpc.Server();
grpcServer.addService(userProto.service, { GetUser: getUser });
grpcServer.bindAsync('0.0.0.0:50051', grpc.ServerCredentials.createInsecure(), () => {
  console.log('gRPC server running at http://0.0.0.0:50051');
  grpcServer.start();
});

// Start Express server
app.listen(PORT, () => {
  console.log(`User service running on port ${PORT}`);
});
