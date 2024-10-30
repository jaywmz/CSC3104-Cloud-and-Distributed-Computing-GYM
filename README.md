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

Machine Learning Graph Plot:
- npm install recharts

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
(choco should be installed when you installed Python, maybe)

Ensure that the containers are all NOT running BUT your docker engine is running

Install k3d, a lightweight wrapper to run k3s in Docker (Windows):
- choco install -y k3d
(if encounter file access error during install, run the terminal in Administrator mode)

Check if kubectl is installed:
- kubectl version --client

# 2. Create the k3d kubernetes cluster:
Create the cluster, the cluster will listen to incoming requests at port 8081 (client to cluster):
- k3d cluster create my-cluster --api-port 6443 --port "5001:5001@loadbalancer" --port "5002:5002@loadbalancer" --port "5003:5003@loadbalancer" --port "5004:5004@loadbalancer"
This is to expose port 5001, 5002, 5003 and 5004 respectively, to be used for each microservice

You can verify that the cluster is up by:
- kubectl get nodes
and
- k3d cluster list

# 3. Apply yaml files into k3d cluster
To deploy containers onto the cluster:
- kubectl apply -f k8s/deployments/

Each yaml file specifies the image and the configurations for each pod.
It configures port 50051, 50052 and 50052 for internal gRPC calls
and configure port 5001, 5002 and 5003 for calls from the external web client.

To see the status of your deployed pods:
- kubectl get pods
(Wait until STATUS RUNNING to be able to use the microservice)

To see logs of each pods:
Get the name of the pods from: kubectl get pods
- kubectl logs <name of pods>
e.g. kubectl logs booking-service-749945fd58-4shp6
e.g. OUTPUT:
Booking service running on port 5002
gRPC server running at http://0.0.0.0:50052

To see services info:
- kubectl get svc
NOTE: even though there is an EXTERNAL-IP for the microservices, we use localhost:500X for the web client axios calls

To stop the cluster:
- k3d cluster stop my-cluster

To delete the cluster:
- k3d cluster delete my-cluster

# 4. Access the Web App
Run the web application: (during testing, the non-dockerised version was ran)
- cd client\gym-booking
- npm install
- npm start
Open browser and use as normal.


The following commands is for Felix to push the images onto the Docker Hub repository 
(if any changes to microservice, need to ask Felix to push to Docker Hub repo as the kubernetes deployment yaml pulls from his repo):
docker tag csc3104-booking-service:latest felixzzh/csc3104-team25-booking:latest
docker push felixzzh/csc3104-team25-booking:latest

docker tag csc3104-user-service:latest felixzzh/csc3104-team25-user:latest
docker push felixzzh/csc3104-team25-user:latest

docker tag csc3104-occupancy-service:latest felixzzh/csc3104-team25-occupancy:latest
docker push felixzzh/csc3104-team25-occupancy:latest

docker tag csc3104-ml-service:latest felixzzh/csc3104-team25-ml:latest
docker push felixzzh/csc3104-team25-ml:latest
