const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 5003;

let gymOccupancy = { current: 0, max: 50 };

app.use(cors());
app.use(bodyParser.json());

// Get current occupancy
app.get('/api/occupancy', (req, res) => {
  res.json(gymOccupancy);
});

// Update occupancy
app.post('/api/occupancy', (req, res) => {
  const { change } = req.body;  // e.g., +1 or -1
  gymOccupancy.current = Math.max(0, Math.min(gymOccupancy.max, gymOccupancy.current + change));
  res.json(gymOccupancy);
});

app.listen(PORT, () => {
  console.log(`Occupancy service running on port ${PORT}`);
});
