import Fastify from "fastify";
import { FetchPageTitleHandler } from "./controllers/puppeteer.controllers";

// --- SETUP ---
const fastify = Fastify({
  //   logger: true,
});

// --- ROUTES ---
fastify.get("/api/v1/title", FetchPageTitleHandler);

// --- START ---
const main = async () => {
  try {
    // --- PORT ---
    const port = process.env.PORT ?? 3002;
    await fastify.listen({ port: port as number, host: "0.0.0.0" }); // START SERVER
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

main();
