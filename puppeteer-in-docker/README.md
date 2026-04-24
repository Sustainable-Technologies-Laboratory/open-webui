# puppeteer-in-docker

This repo contains an example of using Puppeteer inside Docker! This setup allows users to scrape, fetch, and load HTML content efficiently in an isolated and reproducible environment.

## Getting Started

#### 📂 Clone the Repository

```sh
git clone https://github.com/georgelopez7/puppeteer-in-docker.git
cd puppeteer-in-docker
```

#### 🐋 Run Docker

```sh
docker-compose up
```

#### 🛰 Send HTTP request

Send `GET` request to `http://localhost:8080/api/v1/title`

**Example resonse:**

```json
{
  "message": "Fetched title successfully",
  "title": "Example Domain"
}
```

## How It Works

#### 🚀 API Setup with TypeScript and Fastify

This project uses **Typescript** and **Fastify** to set up a lightweight and efficient API service.

#### 🏗 Docker and Chromium Installation

Inside the **Dockerfile**, we install **Chromium**, which is required for **Puppeteer** to function inside the container:

```sh
RUN apt-get update && apt-get install -y --no-install-recommends \
    chromium \
    && rm -rf /var/lib/apt/lists/*

```

This ensures **Puppeteer** has a headless browser to interact with inside the **Docker container.**

#### 🖥 Setting Chromium Path in Puppeteer

When launching **Puppeteer** inside **Docker**, we must explicitly set the **Chromium path.** This is necessary in production environments where Puppeteer doesn't automatically detect the browser.

**_NOTE:_** For this project we set the `CHROMIUM_PATH` to `/usr/bin/chromium` & `NODE_ENV` must be set to `production`

```javascript
browser = await puppeteer.launch({
  args: ["--no-sandbox", "--disable-setuid-sandbox"],
  ...(isProduction && { executablePath: process.env.CHROMIUM_PATH }), // CHROMIUM PATH REQUIRED WHEN USING DOCKER (PRODUCTION)
});
```

The `--no-sandbox` and `--disable-setuid-sandbox` flags also used to run Chromium efficiently inside Docker.
