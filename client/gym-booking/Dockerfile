# Use the official Node.js image for development
FROM node:16-alpine

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json to install dependencies
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Expose the default React development port
EXPOSE 80

# Start the React development server
CMD ["npm", "start"]