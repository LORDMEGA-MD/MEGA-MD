# Use a modern Node.js base
FROM node:20-buster

# Install system dependencies for Baileys (media handling)
RUN apt-get update && \
  apt-get install -y ffmpeg imagemagick webp && \
  apt-get clean && rm -rf /var/lib/apt/lists/*

# Create app directory
WORKDIR /usr/src/app

# Copy package.json and package-lock.json first for caching
COPY package*.json ./

# Install only production dependencies
RUN npm install --omit=dev && npm install -g pm2 qrcode-terminal

# Copy the rest of the app
COPY . .

# Ensure session folder exists (Baileys needs it)
RUN mkdir -p ./session

# Expose your Express port
EXPOSE 5000

# Healthcheck (optional)
HEALTHCHECK CMD curl --fail http://localhost:5000/ || exit 1

# Start the app using PM2 for stability
CMD ["pm2-runtime", "index.js"]
