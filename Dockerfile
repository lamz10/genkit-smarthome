# To build image:
# docker build -t genkit-smarthome .

# To run with just shell
# docker run --rm -it -p 3000:3000 --env-file .env --name genkit-smarthome genkit-smarthome /bin/bash

# To run app locally:
# docker run --rm -d -p 3000:3000 --env-file .env --name genkit-smarthome genkit-smarthome

FROM node as genkit-smarthome-base

RUN mkdir /opt/genkit-smarthome
WORKDIR /opt/genkit-smarthome
COPY package.json .
COPY package-lock.json .

RUN npm install

FROM genkit-smarthome-base as genkit-smarthome-runtime

WORKDIR /opt/genkit-smarthome

COPY --from=genkit-smarthome-base /opt/genkit-smarthome/node_modules ./node_modules
COPY . .

RUN npm run build

CMD ["npm", "run", "server"]
