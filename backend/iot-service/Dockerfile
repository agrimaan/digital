FROM node:18-alpine

WORKDIR /usr/src/app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production --legacy-peer-deps

# Copy app source code
COPY . .

# Expose the service port
EXPOSE 3004

# Start the service
CMD ["npm", "start"]