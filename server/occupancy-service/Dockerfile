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

# Expose the ports for Express (5003), gRPC (50053), and WebSocket (8080)
EXPOSE 5003 50053 8080

# Command to run the application
CMD ["node", "server.js"]
