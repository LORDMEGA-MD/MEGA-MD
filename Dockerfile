# Use Ubuntu-based Node image (better package support than Debian slim)
FROM node:20-slim

# Install missing media dependencies
RUN apt-get update && \
  apt-get install -y --no-install-recommends \
  ffmpeg \
  imagemagick \
  libwebp-dev \
  curl && \
  apt-get clean && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /usr/src/app

# Copy dependency files first for caching
COPY package*.json ./

# Install dependencies and useful global tools
RUN npm install && npm install -g pm2 qrcode-terminal

# Copy app files
COPY . .

# Ensure session directory exists
RUN mkdir -p session

# Expose your backend port
EXPOSE 5000

# Optional healthcheck (Render-friendly)
HEALTHCHECK CMD curl --fail http://localhost:5000/ || exit 1

# Use pm2-runtime for process stability
CMD ["pm2-runtime", "index.js"]
