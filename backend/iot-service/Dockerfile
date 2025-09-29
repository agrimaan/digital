FROM node:18-alpine

WORKDIR /usr/src/app

# Copy package.json and package-lock.json
COPY package*.json ./

# Copy shared library first
#COPY shared ../../shared/

# Install dependencies
RUN npm i --only=production --legacy-peer-deps

# Copy app source code
COPY . .

# Expose the service port
EXPOSE 3004

# Start the service
CMD ["npm", "start"]