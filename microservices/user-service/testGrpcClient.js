const grpc = require("@grpc/grpc-js");
const protoLoader = require("@grpc/proto-loader");

// Load the user.proto file
const packageDef = protoLoader.loadSync("user.proto", {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true
});

// Load the package definition
const grpcObject = grpc.loadPackageDefinition(packageDef);
const userPackage = grpcObject.userPackage;

// Create the gRPC client to connect to the server
// Connects to port 50001 of docker container which is mapped to 50000 of server within
const client = new userPackage.User("localhost:50001", grpc.credentials.createInsecure());

// Example: Call the allUsers method
client.allUsers({}, (err, response) => {
  if (err) {
    console.error("Error calling allUsers:", err);
  } else {
    console.log("All Users:", JSON.stringify(response));
  }
});

// Example: Call the createUser method
client.createUser({
    // Request
    "name": "Mary",
    "age": "22",
    "gender": "Female"
    }, (err, response) => {
    if (err) {
        console.error("Error creating user:", err);
    } else {
        console.log("User has been created:", JSON.stringify(response));
    }
});


// Havent test readUser and deleteUser yet