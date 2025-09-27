FROM node:18-alpine

# Set working directory
WORKDIR /usr/src/app

# Install dependencies
COPY package*.json ./
RUN npm ci --only=production --legacy-peer-deps

# Copy app source
COPY . .

# Create logs directory
RUN mkdir -p logs

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3010

# Expose port
EXPOSE 3010

# Run the application
CMD ["node", "server.js"]