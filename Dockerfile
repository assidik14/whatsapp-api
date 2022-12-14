FROM node:16.16.0-buster

# Install Chromium.
RUN \
  wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add - && \
  echo "deb http://dl.google.com/linux/chrome/deb/ stable main" > /etc/apt/sources.list.d/google.list && \
  apt-get update && \
  apt-get install -y google-chrome-stable && \
  rm -rf /var/lib/apt/lists/*s

# Install Dependencies
RUN apt-get install -y gconf-service libasound2 libatk1.0-0 libc6 libcairo2 libcups2 libdbus-1-3 libexpat1 libfontconfig1 libgcc1 libgconf-2-4 libgdk-pixbuf2.0-0 libglib2.0-0 libgtk-3-0 libnspr4 libpango-1.0-0 libpangocairo-1.0-0 libstdc++6 libx11-6 libx11-xcb1 libxcb1 libxcomposite1 libxcursor1 libxdamage1 libxext6 libxfixes3 libxi6 libxrandr2 libxrender1 libxss1 libxtst6 ca-certificates fonts-liberation libappindicator1 libnss3 lsb-release xdg-utils wget libgbm-dev

RUN mkdir /App
RUN mkdir /App/helpers
RUN mkdir /App/media

COPY helpers /App/helpers
COPY media /App/media
COPY app.js /App
COPY index.html /App
COPY nodemon.json /App
COPY package.json /App

WORKDIR /App

RUN npm install whatsapp-web.js
RUN npm install qrcode
RUN npm install socket.io
RUN npm install nodemon
RUN npm install http
RUN npm install express
RUN npm install express-validator

CMD ["npm", "run", "start"]
EXPOSE 7070