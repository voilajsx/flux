FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci --only=production

# Copy and build app
COPY . .
RUN npm run build

# Expose port and start
EXPOSE 3000
CMD ["node", "dist/server.js"]
