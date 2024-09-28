const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 5002;

app.use(cors());
app.use(bodyParser.json());

const bookings = [];

// Get all bookings
app.get('/api/bookings', (req, res) => {
  res.json(bookings);
});

// Create a booking
app.post('/api/bookings', (req, res) => {
  const booking = { id: bookings.length + 1, ...req.body };
  bookings.push(booking);
  res.status(201).json(booking);
});

app.listen(PORT, () => {
  console.log(`Booking service running on port ${PORT}`);
});
