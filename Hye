FROM node:20-slim

RUN apt-get update && \
  apt-get install -y --no-install-recommends \
  ffmpeg \
  imagemagick \
  libwebp-dev \
  curl && \
  apt-get clean && rm -rf /var/lib/apt/lists/*

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install && npm install -g pm2 qrcode-terminal

COPY . .

EXPOSE 5000

CMD ["pm2-runtime", "index.js"]
