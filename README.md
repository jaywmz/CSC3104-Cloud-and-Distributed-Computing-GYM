# Project Structure Overview:
This section explains the overall organization of the project and how different services (microservices) interact with each other.

# Project Folder Structure:
```
|-- client/
|   |-- gym-booking/
|       |-- public/                 // Public files like index.html, favicon, etc.
|       |-- src/                    // React application source code
|           |-- components/         // Reusable React components
|           |-- css/                // CSS for the pages
|           |-- pages/              // React pages (HomePage, LoginPage, etc.)
|           |-- services/           // API service files (Axios or Fetch functions)
|           |-- App.js              // Main app file (Routes and global styles)
|       |-- package.json            // Frontend dependencies and scripts
|       |-- .gitignore              // Ignored files/folders for the frontend
|       |-- node_modules/           // Dependencies for the React app
|
|-- server/
|   |-- booking-service/            // Booking microservice
|       |-- server.js               // Main server code for handling bookings and gRPC
|       |-- booking.proto           // gRPC protocol definition for booking service
|       |-- occupancy.proto         // gRPC protocol definition for occupancy service
|       |-- user.proto              // gRPC protocol definition for user service
|       |-- package.json            // Backend dependencies for booking service
|       |-- .env                    // Environment variables for booking service
|       |-- Dockerfile              // Docker commands for the service image
|   
|   |-- occupancy-service/          // Occupancy microservice (handling gym occupancy data)
|       |-- mqttDummyPublisher.js   // MQTT dummy publisher for occupancy updates
|       |-- server.js               // Main server code for occupancy handling
|       |-- entrypoint.sh            //Helps to run both the server and mqttDummyPublisher.js script at the start of application
|       |-- booking.proto           // gRPC protocol definition for booking service
|       |-- occupancy.proto         // gRPC protocol definition for occupancy service
|       |-- user.proto              // gRPC protocol definition for user service
|       |-- package.json            // Backend dependencies for occupancy service
|       |-- .env                    // Environment variables for occupancy service
|       |-- Dockerfile              // Docker commands for the service image
|   
|   |-- user-service/               // User microservice for authentication
|       |-- server.js               // Main server code for handling user authentication
|       |-- routes/                 // API routes for user service (register, login, etc.)
|       |-- booking.proto           // gRPC protocol definition for booking service
|       |-- occupancy.proto         // gRPC protocol definition for occupancy service
|       |-- user.proto              // gRPC protocol definition for user service
|       |-- package.json            // Backend dependencies for user service
|       |-- .env                    // Environment variables for user service
|       |-- Dockerfile              // Docker commands for the service image
|-- .gitignore                      // Ignored files/folders for the entire project
|-- README.md                       // Project documentation
|-- docker-compose.yml              // Docker Compose file for managing multiple microservices
```
# Steps to Set Up and Run the Project:
# 1. Creating the docker images
Ensure that docker engine is running, either through CLI or Docker Desktop
In the main folder (same folder as docker-compose-yaml), creating and running the containers:
- docker-compose up --build

To remove of all containers, images and volumes:
- docker-compose down -v

# 2. Run the Frontend (Gym Booking):
Navigate to the gym-booking folder:
- cd client/gym-booking

Start the React frontend:
- npm start
- This will start the React frontend on http://localhost:3000.

# 3. Interacting with the System:
Open a browser:
- Go to http://localhost:3000.

# Explanation of Services:
User-Service:
- Manages user registration and login.
- Provides gRPC communication for validating users in the booking service.
- Stores user data in MongoDB.

Booking-Service:
- Manages gym bookings.
- Communicates with the user-service via gRPC to validate users before creating bookings.
- Stores bookings in a MongoDB database.

- Occupancy-Service:
- Manages gym creation, equipment and checkin.


Frontend (Gym Booking):
- React frontend for user interaction.
- Provides UI for user registration, login, and gym booking.
- Communicates with the backend booking service via REST API.

Points to Emphasize for the Team:
- Each service runs independently, and they communicate via gRPC.
- The user-service and booking-service both connect to MongoDB Atlas for data storage.
- The React frontend uses Axios to interact with the backend services via REST APIs.


# Running Kubernete cluster
# 1. Install k3d
Requirements: Docker, kubectl and chocolatey are required to be installed
Ensure that the containers are all NOT running BUT your docker engine is running
Install k3d, a lightweight wrapper to run k3s in Docker (Windows):
- choco install -y k3d
(if encounter file access error during install, run the terminal in Administrator mode)

Check if kubectl is installed:
- kubectl version --client

# 2. Create the k3d kubernetes cluster:
Create the cluster, the cluster will listen to incoming requests at port 8081 (client to cluster):
- k3d cluster create mycluster --api-port 6550 -p "8081:80@loadbalancer"

You can verify that the cluster is up by:
- kubectl get nodes

# 3. Install Istio and install the Istio components to your cluster
istioctl version
istioctl install --set profile=demo -y
kubectl label namespace default istio-injection=enabled

# 4. Apply yaml files into k3d cluster
kubectl apply -f k8s/deployments/
kubectl apply -f k8s/services/
kubectl apply -f k8s/istio/

kubectl describe pod <pod-name> -n <namespace>

docker tag csc3104-booking-service:latest felixzzh/csc3104-team25-booking:latest
docker tag csc3104-user-service:latest felixzzh/csc3104-team25-user:latest
docker tag csc3104-occupancy-service:latest felixzzh/csc3104-team25-occupancy:latest
docker push felixzzh/csc3104-team25-booking:latest
docker push felixzzh/csc3104-team25-user:latest
docker push felixzzh/csc3104-team25-occupancy:latest

k3d cluster delete mycluster
