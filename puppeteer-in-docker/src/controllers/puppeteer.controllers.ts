import { FastifyReply, FastifyRequest } from "fastify";
import puppeteer, { Browser, Page } from "puppeteer";

export const FetchPageTitleHandler = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  let browser: Browser | null = null;
  let page: Page | null = null;

  try {
    // --- CHECK ENVIRONMENT ---
    const environment = process.env.NODE_ENV;
    const isProduction = environment === "production";

    // --- LAUNCH BROWSER ---
    browser = await puppeteer.launch({
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
      ...(isProduction && { executablePath: process.env.CHROMIUM_PATH }), // CHROMIUM PATH REQUIRED WHEN USING DOCKER (PRODUCTION)
    });

    if (!browser) {
      throw new Error("Failed to launch Puppeteer.");
    }

    // --- CREATE PAGE ---
    page = await browser.newPage();

    // --- GO TO URL ---
    await page.goto("https://www.example.com");

    // --- GET TITLE ---
    const title = await page.title();

    return reply.send({ message: "Fetched title successfully", title });
  } catch (error) {
    // --- CATCH ERRORS ---
    console.error("Error fetching title:", error);
    return reply.status(500).send({
      message: "Error fetching title",
      error: error instanceof Error ? error.message : String(error),
    });
  } finally {
    // --- CLOSE PAGE FIRST ---
    if (page) {
      await page.close();
    }

    // --- CLOSE BROWSER AFTER PAGE ---
    if (browser) {
      await browser.close();
    }
  }
};
