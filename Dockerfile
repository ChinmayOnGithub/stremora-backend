# === Base Stage ===
FROM node:20-alpine AS base

# Set working directory
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install --omit=dev

# Copy only necessary files (avoids copying node_modules)
COPY . .

# Expose port
EXPOSE 5000

# Start the application
CMD ["node", "src/index.js"]
