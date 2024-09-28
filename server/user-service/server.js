const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const userRoutes = require('./routes/userRoutes');

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(bodyParser.json());

// User Routes
app.use('/api/users', userRoutes);

// Start server
app.listen(PORT, () => {
  console.log(`User service running on port ${PORT}`);
});
