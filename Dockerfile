# Use newer Debian (bookworm) base with Node 20
FROM node:20-bookworm

# Install dependencies required by Baileys for media handling
RUN apt-get update && \
  apt-get install -y ffmpeg imagemagick libwebp-tools && \
  apt-get clean && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /usr/src/app

# Copy dependency files first
COPY package*.json ./

# Install dependencies
RUN npm install --omit=dev && npm install -g pm2 qrcode-terminal

# Copy all source code
COPY . .

# Ensure session folder exists
RUN mkdir -p ./session

# Expose backend port
EXPOSE 5000

# Optional healthcheck
HEALTHCHECK CMD curl --fail http://localhost:5000/ || exit 1

# Start using PM2 for stability
CMD ["pm2-runtime", "index.js"]
