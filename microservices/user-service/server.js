const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const PROTO_PATH = 'user.proto';

const packageDef = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true
});
const grpcObject = grpc.loadPackageDefinition(packageDef);
const userPackage = grpcObject.userPackage;

const server = new grpc.Server();

// Example data just to test CRUD operations from server
let users = [
  { id: '1', name: 'John', age: "24", gender: 'Male' },
  { id: '2', name: 'Jim', age: "8", gender: 'Let him choose in future' }
];

// The services that this server provides and the functions it will call
// when the service is called
server.addService(userPackage.User.service, {
  allUsers: allUsers,
  createUser: createUser,
  readUser: readUser,
  updateUser: updateUser,
  deleteUser: deleteUser
});

// Start the server on port 50000
server.bindAsync("0.0.0.0:50000", grpc.ServerCredentials.createInsecure(), (error, port) => {
    if (error) {
        console.error(error);
        return;
    }
    console.log(`Server listening on port ${port}`);
});

function createUser (call, callback) {
    console.log("MESSAGE: User creation requested")
    const user = call.request;
    user.id = users.length + 1;
    users.push(user);
    callback(null, users[users.length - 1] );
}

function readUser (call, callback) {
    console.log("MESSAGE: Read a user data requested")
    const user = users.find(n => n.id == call.request.id);

    if (user) {
        callback(null, user);
    } else {
        callback({
            code: grpc.status.NOT_FOUND,
            details: "Not found"
        });
    }
}

function updateUser (call, callback) {
    console.log("MESSAGE: User update requested")
    const existinguser = users.find(n => n.id == call.request.id);
    if (existinguser) {
        existinguser.name = call.request.name;
        existinguser.age = call.request.age;
        existinguser.gender = call.request.gender;
        callback(null, existinguser);
        } else {
            callback({
                code: grpc.status.NOT_FOUND,
                details: "Not found"
            });
        }
}

function deleteUser (call, callback) {
    console.log("MESSAGE: User deletion requested")
    const existinguserIndex = users.findIndex((n) => n.id == call.request.id)
    if (existinguserIndex != -1) {
        users.splice(existinguserIndex, 1)
        callback(null, {})
        } else {
            callback({
                code: grpc.status.NOT_FOUND,
                details: "user not found"
            })
        }
}

function allUsers(call, callback) {
    console.log("MESSAGE: All users requested")
    callback(null, { users })
}

