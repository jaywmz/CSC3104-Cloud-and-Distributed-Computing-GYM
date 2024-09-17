Hello
17th Sept 1930hrs

Microservice 'user-service' is currently used to test GRPC.
The 'Express' portion of it (REST API) has been removed
- user-service now uses server.js NOT app.js

To run:
- Similar to instruction at the beginning -> 'docker-compose up --build' at project folder
- Might need to 'npm install @grpc/grpc-js' inside \user-service\ folder if docker did not auto install
(I didn't push the node-modules folder because its too large. Just run the docker-compose and see if docker auto install. if not then manual install thru command above)
- Once built and no error, can just run the container through Docker Desktop again

To test GRPC:
- When the user-service docker is running, open a new terminal
- go to \user-service\ and run the testGrpcClient.js file (node testGrpcClient.js)

How the GRPC works:
- Once the user-service container is running, use the testGrpcClient.js in \user-service\ to test
    -> node testGrpcClient.js
- In the server.js, it establishes the 'object' type through user.proto file. 
- user.proto file is also in same folder. Acts like a interface or a file that defines the object like ENTITY IN WEB PROG OR WTV
- Then, server.js maps the services of this server to the functions. (When client call service -> run the function) + starts the server
- the testGrpcClient.js starts a 'client' connecting to the server, then it calls these services
- server.js will then run the function mapped and return

To modify server.js
- Modify code then save
- Then just restart the docker container
