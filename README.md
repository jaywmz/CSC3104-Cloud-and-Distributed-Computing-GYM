# Project Structure Overview:
This section explains the overall organization of the project and how different services (microservices) interact with each other.

# Project Folder Structure:
```
|-- client/
|   |-- gym-booking/
|       |-- src/               // React application code
|       |-- package.json        // Frontend dependencies and scripts
|
|-- server/
|   |-- booking-service/        // Booking microservice
|       |-- server.js           // Main server code for handling bookings and gRPC
|       |-- node_modules/       // Dependencies for the booking service
|       |-- package.json        // Backend dependencies for booking service
|   
|   |-- occupancy-service/      // Occupancy microservice (placeholder for other service logic)
|       |-- server.js           // Main server code for occupancy (if needed)
|       |-- node_modules/       // Dependencies for occupancy service
|       |-- package.json        // Backend dependencies for occupancy service
|   
|   |-- user-service/           // User microservice
|       |-- server.js           // Main server code for handling user authentication and gRPC
|       |-- routes/             // API routes for user service (e.g., register, login)
|       |-- user.proto          // gRPC protocol definition for user service
|       |-- node_modules/       // Dependencies for user service
|       |-- package.json        // Backend dependencies for user service
|
|-- .gitignore                  // Ignored files/folders for git
```
# Steps to Set Up and Run the Project:
# 1. Install Dependencies:
In each microservice folder (booking-service, occupancy-service, user-service), and the frontend folder (gym-booking), install the required dependencies by running:
- npm install

Do this for the following folders:
- client/gym-booking/
- server/booking-service/
- server/user-service/

  In the microservice folder (Occupancy-service), install the dependencies:
  -npm install mqtt


# 2. Run the User Service:
Navigate to the user-service folder:
- cd server/user-service

Start the server:
- node server.js
- This will start the user microservice on http://localhost:5001 and also start the gRPC service on port 50051.

# 3. Run the Booking Service:
Navigate to the booking-service folder:
- cd server/booking-service

Start the server:
- node server.js
- This will start the booking microservice on http://localhost:5002 and communicate with the user-service via gRPC.

# 4. Run the Occupancy Service:
Navigate to the occupancy-service folder:
- cd server/occupancy-service

Start the server:
- node server.js
- This will start the occupancy microservice on http://localhost:5003 and communicate with the user-service via gRPC and connect to the mqtt broker.
- Open another command prompt at the occupancy microservice folder, and run node mqttDummyPublish.js to simulate as IoT devices publishing data to the database.


# 4. Run the Frontend (Gym Booking):
Navigate to the gym-booking folder:
- cd client/gym-booking

Start the React frontend:
- npm start
- This will start the React frontend on http://localhost:3000.

# 5. Interacting with the System:
Register a User:
- Go to http://localhost:3000/register.
- Create a new user by providing a username, password, and role (either user or admin).

Log In:
- Go to http://localhost:3000/login.
- Log in using the registered user credentials.

Create a Booking:
- After logging in, go to http://localhost:3000/bookings.
- Create a new gym booking.
- The booking service will validate the user through gRPC with the user service and store the booking in the database.

# Explanation of Services:
User-Service:
- Manages user registration and login.
- Provides gRPC communication for validating users in the booking service.
- Stores user data in MongoDB.

Booking-Service:
- Manages gym bookings.
- Communicates with the user-service via gRPC to validate users before creating bookings.
- Stores bookings in a MongoDB database.

Frontend (Gym Booking):
- React frontend for user interaction.
- Provides UI for user registration, login, and gym booking.
- Communicates with the backend booking service via REST API.

Points to Emphasize for the Team:
- Each service runs independently, and they communicate via gRPC.
- The user-service and booking-service both connect to MongoDB Atlas for data storage.
- The React frontend uses Axios to interact with the backend services via REST APIs.
