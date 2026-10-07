FROM eclipse-temurin:21-jdk

# Install Node.js + npm
RUN apt-get update \
    && apt-get install -y nodejs npm \
    && rm -rf /var/lib/apt/lists/*


# ------------------------------------------------------
# Install common dependencies
# ------------------------------------------------------

WORKDIR /webserver

COPY package.json ./

RUN npm install


# ------------------------------------------------------
# Install GCS dependencies
# ------------------------------------------------------

WORKDIR /webserver/gcs

COPY gcs/package.json ./

RUN npm install


# ------------------------------------------------------
# Copy source files
# ------------------------------------------------------

COPY gcs/ /webserver/gcs/
COPY common/ /webserver/common/


# Internal port
EXPOSE 3001

CMD ["npm", "start"]