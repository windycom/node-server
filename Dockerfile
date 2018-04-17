FROM node:carbon

# Create app directory
WORKDIR /opt/node-server

COPY package*.json ./

RUN npm install

# ### cache end

# Bundle app source
COPY . .

RUN npm link
