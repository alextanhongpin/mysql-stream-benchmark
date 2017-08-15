FROM node:latest

COPY . /
CMD ["node", "--prof", "setup.js"]