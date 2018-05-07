FROM node:alpine

RUN apk add --no-cache make gcc g++ python git

COPY . /src/ark-json-rpc

RUN cd /src/ark-json-rpc \
    && npm install -g pm2 \
    && npm install

WORKDIR /src/ark-json-rpc
ENTRYPOINT ["pm2","./server.js"]

EXPOSE 8080
