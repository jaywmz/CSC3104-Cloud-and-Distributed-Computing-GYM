# Use the official Node.js image as the base
FROM node:18

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json for installing dependencies
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application files
COPY . .

# Copy and set permissions for the entrypoint script
COPY entrypoint.sh /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh

# Expose the ports for Express (5003), gRPC (50053), and WebSocket (8080)
EXPOSE 5003 50053 8080

# Use the entrypoint script to run both server.js and mqttDummyPublisher.js
ENTRYPOINT ["/app/entrypoint.sh"]
