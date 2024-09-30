const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { MongoClient } = require('mongodb');

// MongoDB connection string
const uri = "mongodb+srv://csc3104grp:9FzZmCSr5pDRqvL9@userdatabase.gfv68.mongodb.net/?retryWrites=true&w=majority&appName=userdatabase";
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

// Register
router.post('/register', async (req, res) => {
  const { username, password, role } = req.body;

  try {
    const db = await connectDB();
    const usersCollection = db.collection('users');
    const userExists = await usersCollection.findOne({ username });

    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = { username, password: hashedPassword, role: role || 'user' };
    await usersCollection.insertOne(newUser);

    res.status(201).send({ message: 'User registered successfully' });
  } catch (error) {
    console.error('Error during registration:', error);
    res.status(500).json({ message: 'Failed to register user.' });
  }
});

// Login route
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    const db = await connectDB();
    const usersCollection = db.collection('users');
    const user = await usersCollection.findOne({ username });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).send('Invalid credentials');
    }

    const token = jwt.sign({ username, role: user.role }, 'secretkey', { expiresIn: '1h' });
    res.json({ token });
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).send('Failed to log in.');
  }
});

// Middleware to verify JWT token and role with error handling
const authenticateToken = (role) => (req, res, next) => {
  const authHeader = req.header('Authorization');
  if (!authHeader) return res.status(403).send('Access denied');

  const token = authHeader.split(' ')[1];
  if (!token) return res.status(403).send('Access denied');

  jwt.verify(token, 'secretkey', (err, user) => {
    if (err) return res.status(403).send('Invalid token');
    if (role && user.role !== role) return res.status(403).send('Insufficient permissions');
    req.user = user;
    next();
  });
};

// Admin-only route
router.get('/admin-dashboard', authenticateToken('admin'), (req, res) => {
  res.send('Welcome to the Admin Dashboard');
});

// User-only route
router.get('/gym-dashboard', authenticateToken('user'), (req, res) => {
  res.send('Welcome to the Gym Dashboard');
});

module.exports = router;
