# Use a modern LTS Node image
FROM node:20-bullseye

# Install required system packages
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        ffmpeg \
        imagemagick \
        libwebp-dev && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /usr/src/app

# Copy package files first to leverage Docker caching
COPY package*.json ./

# Install dependencies locally & useful global tools
RUN npm install && npm install -g pm2 qrcode-terminal

# Copy the rest of your project
COPY . .

# Expose the port your app will run on
EXPOSE 5000

# Start your app using PM2 for stability
CMD ["pm2-runtime", "start", "index.js"]
