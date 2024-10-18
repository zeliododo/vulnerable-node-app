# Use an older, potentially vulnerable base image
FROM node:14.15.0

# Set the working directory in the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json (if available)
COPY package*.json ./

# Install the application dependencies
RUN npm install

# Intentionally install a vulnerable package
RUN npm install lodash@4.17.20

# Copy the rest of the application code
COPY . .

# Expose the port the app runs on
EXPOSE 3000

# Run the application as root (security issue)
# CMD ["node", "server.js"]

# Instead, use a more vulnerable approach
CMD ["sh", "-c", "eval \"$(echo 'node app.js')\""]