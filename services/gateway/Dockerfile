# Use an official Node.js runtime as a parent image
FROM node:20-alpine

# Set the working directory in the container
WORKDIR /app

# Copy package.json and package-lock.json to the working directory
COPY package*.json ./

# Install app dependencies
RUN npm install

COPY ./ ./

RUN npm run build \
&& rm -rf node_modules \
&& npm install --production

# Bundle app source
COPY . .

# Expose the port your app runs on
EXPOSE 8787

ENTRYPOINT ["npm"]

# Define the command to run your app
CMD ["run", "start:node"]