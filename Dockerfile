FROM node:18-slim

WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy all files
COPY . .

# Ensure directories exist
RUN mkdir -p static/css static/js

# Build steps with logging - SCSS first, then browserify
RUN echo "Starting builds..." && \
    npm run scss-build && \
    echo "SCSS build complete" && \
    npm run build && \
    echo "Browserify build complete" && \
    ls -la static/js/

EXPOSE 5000

CMD [ "node", "server.js" ]