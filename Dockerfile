FROM node:latest

COPY . /
CMD ["node", "--prof", "server.js"]