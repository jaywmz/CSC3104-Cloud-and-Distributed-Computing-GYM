require('dotenv').config(); // Load environment variables

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const path = require('path');

// Initialize the Express app
const app = express();
// Configure CORS options if needed, for example:
const corsOptions = {
  origin: '*',  // Use '*' to allow all origins, or specify an array of allowed origins
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));
app.use(bodyParser.json());

// MongoDB connection string
const { MongoClient, ReturnDocument } = require('mongodb');
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
const PROTO_PATH = path.join(__dirname, 'user.proto');
const packageDefinition = protoLoader.loadSync(PROTO_PATH, {});
const userProto = grpc.loadPackageDefinition(packageDefinition).UserService;

// Create a gRPC client for user-service
const userClient = new userProto('user-service-grpc:50051', grpc.credentials.createInsecure());

// gRPC server setup for occupancy-service
const PROTO_PATH_OCCUPANCY = path.join(__dirname, 'occupancy.proto');
const packageDefinitionOccupancy = protoLoader.loadSync(PROTO_PATH_OCCUPANCY, {});
const occupancyProto = grpc.loadPackageDefinition(packageDefinitionOccupancy).OccupancyService;

// Create a gRPC client for occupancy-service
const occupancyClient = new occupancyProto('occupancy-service-grpc:50053', grpc.credentials.createInsecure());

// Create a gRPC client for booking-service
// REMOVE THIS WHEN REMOVING EXPRESS ROUTES (this is so that the express routes can call the gRPC methods)
// in future it calls the gRPC methods directly, not through express routes
const bookingClient = new bookingProto('booking-service-grpc:50052', grpc.credentials.createInsecure());

// Function to call user gRPC to convert token to user
function getUserFromToken(token) {
  return new Promise((resolve, reject) => {
    userClient.GetUserFromToken({ token }, (error, response) => {
      if (error) {
        console.error('Error fetching user from token:', error);
        return reject({
          code: grpc.status.INTERNAL,
          details: 'Error fetching user details',
        });
      }
      resolve({
        username: response.username,
        role: response.role
      });
    });
  });
}


// Booking route with gRPC call to validate user and saving to MongoDB
app.post('/api/bookings', (req, res) => {
  const token = new grpc.Metadata();
  token.add('Authorization', `${req.header('Authorization').split(' ')[1]}`);

  const { date, slot, gymId } = req.body;

  bookingClient.CreateBooking({ date, slot, gymId }, token, (error, booking) => {
    if (error) {
      if (error.code === grpc.status.ALREADY_EXISTS) {
        return res.status(409).send({ details: error.details }); // Ensure return to avoid sending multiple responses
      }
      if (error.code === grpc.status.RESOURCE_EXHAUSTED) {
        return res.status(429).send({ details: error.details }); // Ensure return
      }
      console.error('Error creating booking via gRPC:', error);
      return res.status(500).send('Failed to create booking'); // Ensure return
    }
    res.status(200).json(booking); // Only one response sent
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
async function getBooking(call, callback) {
  try {
    const db = await connectDB();
    const bookingsCollection = db.collection('bookings');
    const booking = await bookingsCollection.findOne({ id: call.request.id });
    if (booking) {
      callback(null, booking);
    } else {
      callback({
        code: grpc.status.NOT_FOUND,
        details: 'Booking not found',
      });
    }
  } catch (error) {
    callback({
      code: grpc.status.INTERNAL,
      details: 'Error fetching booking',
    });
  }
};

// Get all bookings
async function getAllBookings(call, callback) {
  try {
    const db = await connectDB();
    const bookingsCollection = db.collection('bookings');
    const bookings = await bookingsCollection.find({}).toArray();
    callback(null, { bookings });
  } catch (error) {
    callback({
      code: grpc.status.INTERNAL,
      details: 'Error fetching bookings',
    });
  }

};

// Get all bookings for a user
async function getUserBookings(call, callback) {
  try {
    // Extract the token from the metadata
    const token = call.metadata.get('authorization')[0];

    // Decode the token to get the user
    const user = await getUserFromToken(token);

    const db = await connectDB();
    const bookingsCollection = db.collection('bookings');
    const bookings = await bookingsCollection.find({ user: user.username }).toArray();
    callback(null, { bookings });
  } catch (error) {
    callback({
      code: grpc.status.INTERNAL,
      details: 'Error fetching user bookings',
    });
  }
};

// Get all bookings for a gym
async function getGymBookings(call, callback) {
  try {
    const db = await connectDB();
    const bookingsCollection = db.collection('bookings');
    const bookings = await bookingsCollection.find({ gymId: call.request.gymId }).toArray();
    callback(null, { bookings });
  } catch (error) {
    callback({
      code: grpc.status.INTERNAL,
      details: 'Error fetching gym bookings',
    });
  }
};

// Create a new booking
async function createBooking(call, callback) {
  try {
    const token = call.metadata.get('authorization')[0];
    const user = await getUserFromToken(token);

    const db = await connectDB();
    const bookingsCollection = db.collection('bookings');
    const bookingsQuotaCollection = db.collection('bookingsQuota');
    const { date, slot, gymId } = call.request;
    console.log(slot);
    const gymIdInt = parseInt(gymId);

    // Check for duplicate booking
    const duplicateBooking = await bookingsCollection.findOne({
      user: user.username,
      date: date,
      gymId: gymIdInt,
      slot: slot,
    });

    if (duplicateBooking) {
      return callback({
        code: grpc.status.ALREADY_EXISTS,
        details: 'Duplicate booking: You already have a booking at the same time and gym.',
      });
    }


    // Use findOneAndUpdate to check and update the quota atomically
    const quotaUpdate = await bookingsQuotaCollection.findOneAndUpdate(
      { gymId: gymIdInt, date: date },
      {
        $inc: { [slot]: 1 },
      },
      {
        upsert: true, // Insert if not found
        returnOriginal: false,
      }
    );


    if (quotaUpdate != null && quotaUpdate[slot] >= 10) {
      // If slot quota exceeded, roll back the increment
      await bookingsQuotaCollection.updateOne(
        { gymId: gymIdInt, date: date },
        { $inc: { [slot]: -1 } }
      );
      return callback({
        code: grpc.status.RESOURCE_EXHAUSTED,
        details: 'Slot quota exceeded. Please choose another slot.',
      });
    }

    // Proceed to create the booking
    const booking = { ...call.request, user: user.username, gymId: gymIdInt, role: user.role, id: Math.floor(Math.random() * 1000) };
    await bookingsCollection.insertOne(booking);

    console.log("check4")

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
  try {
    // Extract the token from the metadata
    const token = call.metadata.get('authorization')[0];

    // Decode the token to get the user and role
    const user  = await getUserFromToken(token);

    const db = await connectDB();
    const bookingsCollection = db.collection('bookings');
    const bookingsQuotaCollection = db.collection('bookingsQuota');
    const booking = await bookingsCollection.findOne({ id: call.request.id });

    // Allow admins to delete any booking, bypassing ownership check
    if (user.role !== 'admin' && booking.user !== user.username) {
      callback({
        code: grpc.status.PERMISSION_DENIED,
        details: 'You are not authorized to delete this booking',
      });
      return;
    }

    if (booking) {
      // Delete the booking
      await bookingsCollection.deleteOne({ id: call.request.id });

      // Remove booking from slot quota
      await bookingsQuotaCollection.updateOne({ gymId: booking.gymId, date: booking.date, [booking.slot]: { $exists: true } }, { $inc: { [booking.slot]: -1 } });

      callback(null, {});
    } else {
      callback({
        code: grpc.status.NOT_FOUND,
        details: 'Booking not found',
      });
    }
  } catch (error) {
    callback({
      code: grpc.status.INTERNAL,
      details: 'Error deleting booking',
    });
  }
};


// Update a booking
async function updateBooking(call, callback) {
  try {

    const token = call.metadata.get('authorization')[0]; // Get token from metadata

    // Decode the token to get the user
    const user = await getUserFromToken(token);

    const db = await connectDB();
    const bookingsCollection = db.collection('bookings');
    const bookingsQuotaCollection = db.collection('bookingsQuota');
    const { id, date, slot, gymId } = call.request;

    // Check if new booking is a duplicate of existing booking by user
    const duplicateBooking = await bookingsCollection.findOne({ user: user.username, date: date, gymId: parseInt(gymId), slot: slot });
    if (duplicateBooking) {
      return callback({
        code: grpc.status.ALREADY_EXISTS,
        details: 'Duplicate booking: You already have a booking at the same time and gym.',
      });
    }

    // Check if new slot quota by new gym booking has exceeded 10
    const checkQuota = await bookingsQuotaCollection.findOne({ gymId: parseInt(gymId), date: date });
    if (checkQuota && checkQuota[slot] >= 10) {
      return callback({
        code: grpc.status.RESOURCE_EXHAUSTED,
        details: 'Slot quota exceeded. Please choose another slot.',
      });
    }

    // Find the booking by id
    const booking = await bookingsCollection.findOne({ id: parseInt(id) });

    if (!booking) {
      // Booking not found
      return callback({
        code: grpc.status.NOT_FOUND,
        details: 'Booking not found',
      });
    }

    // Check if the user making the request owns the booking
    if (booking.user !== user.username) {
      return callback({
        code: grpc.status.PERMISSION_DENIED,
        details: 'You are not authorized to update this booking',
      });
    }

    // Update the booking details
    const updatedBooking = {
      ...booking,
      date: date || booking.date, // Update date if provided
      slot: slot || booking.slot, // Update slot if provided
      gymId: gymId ? parseInt(gymId) : booking.gymId, // Update gymId if provided
    };

    await bookingsCollection.updateOne({ id: parseInt(id) }, { $set: updatedBooking });
    // Remove booking from old slot quota
    await bookingsQuotaCollection.updateOne({ gymId: booking.gymId, date: booking.date }, { $inc: { [booking.slot]: -1 } });

    // Check if new slot quota exists by date and gymId
    const quota = await bookingsQuotaCollection.findOne({ gymId: updatedBooking.gymId, date: updatedBooking.date });
    // if exists, check if slot exists in this date and gymId
    if (quota) {
      if (quota[updatedBooking.slot]) {
        await bookingsQuotaCollection.updateOne({ gymId: updatedBooking.gymId, date: updatedBooking.date }, { $inc: { [updatedBooking.slot]: 1 } });
      } else {
        await bookingsQuotaCollection.updateOne({ gymId: updatedBooking.gymId, date: updatedBooking.date }, { $set: { [updatedBooking.slot]: 1 } });
      }
    } else {
      await bookingsQuotaCollection.insertOne({ gymId: updatedBooking.gymId, date: updatedBooking.date, [updatedBooking.slot]: 1 });
    };

    callback(null, updatedBooking); // Respond with the updated booking
  } catch (error) {
    console.error('Error updating booking:', error);
    callback({
      code: grpc.status.INTERNAL,
      details: 'Error updating booking',
    });
  }
}


// Update a booking
app.put('/api/bookings/update/:id', (req, res) => {
  const token = new grpc.Metadata();
  token.add('Authorization', `${req.header('Authorization').split(' ')[1]}`);

  const { id } = req.params;
  const { date, slot, gymId } = req.body;

  bookingClient.UpdateBooking({ id, date, slot, gymId }, token, (error, booking) => {
    if (error) {
      if (error.code === grpc.status.ALREADY_EXISTS) {
        return res.status(409).send({ details: error.details }); // Ensure return to avoid sending multiple responses
      }
      if (error.code === grpc.status.RESOURCE_EXHAUSTED) {
        return res.status(429).send({ details: error.details }); // Ensure return
      }
      console.error('Error creating booking via gRPC:', error);
      return res.status(500).send('Failed to create booking'); // Ensure return
    }
    res.status(200).json(booking);
  });
});



// Start the server
const PORT = process.env.PORT || 5002;
app.listen(PORT, () => {
  console.log(`Booking service running on port ${PORT}`);
});

// Start gRPC server
const grpcServer = new grpc.Server();
grpcServer.addService(bookingProto.service, {
  GetBooking: getBooking,
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
