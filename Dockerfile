# Use official lightweight Node image
FROM node:18-bullseye

# Set working directory
WORKDIR /app

# Copy package.json first (for caching)
COPY package.json ./

# Install only production dependencies
RUN npm install --omit=dev

# Copy the rest of the project files
COPY . .

# Expose your app port
EXPOSE 5000

# Start the app
CMD ["npm", "start"]
