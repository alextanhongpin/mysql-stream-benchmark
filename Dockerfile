FROM node:boron

ADD setup.js /
ADD package.json /
RUN npm install
CMD ["node", "setup.js"]