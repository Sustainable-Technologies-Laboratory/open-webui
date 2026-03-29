import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { performance } from 'perf_hooks';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

const CONFIG = {
    URL: 'https://chatbot.hs-bochum.de/',
    USERNAME: 'ecodesign@kein.date',
    PASSWORD: 'test123',
    REPETITIONS: 5,
    TEST_FILE_NAME: '2025-08 Testfaelle.txt',
    LOG_FILE_NAME: 'chat-log.txt',
};

const SELECTORS = {
    LAST_RESPONSE: '#response-content-container',
    INPUT: '#chat-input',
    FINISH_INDICATOR: '#voice-input-button',
    LOGIN_EMAIL: '[type="email"]',
    LOGIN_PASSWORD: '[type="password"]',
    LOGIN_SUBMIT: '[type="submit"]',
};

// Load Test Cases
const testFilePath = path.join(__dirname, CONFIG.TEST_FILE_NAME);
const CHAT_COMMANDS = fs.readFileSync(testFilePath, 'utf8')
    .replace(/\r/g, '')
    .split(';')
    .map(s => s.trim())
    .filter(Boolean);

const LOG_FILE = path.join(__dirname, CONFIG.LOG_FILE_NAME);

function logMessage(sender, message) {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] [${sender}]: ${message}\n`;
    fs.appendFileSync(LOG_FILE, logEntry);
}

async function runBenchmark() {
    logMessage('BENCHMARK', 'Starting run...');

    for (let questionIndex = 0; questionIndex < CHAT_COMMANDS.length; questionIndex++) {
        const question = CHAT_COMMANDS[questionIndex];

        for (let r = 0; r < CONFIG.REPETITIONS; r++) {
            let browser = null;
            try {
                // FIXED: Explicitly set headless to "new" or true for server environments
                browser = await puppeteer.launch({
                    headless: "new", 
                    args: [
                        '--no-sandbox', 
                        '--disable-setuid-sandbox', 
                        '--disable-dev-shm-usage',
                        '--disable-gpu'
                    ]
                });
                const page = await browser.newPage();

                // 1. Navigate
                await page.goto(CONFIG.URL, { waitUntil: 'networkidle2', timeout: 60000 });

                // 2. Login
                await page.waitForSelector(SELECTORS.LOGIN_EMAIL, { visible: true });
                await page.type(SELECTORS.LOGIN_EMAIL, CONFIG.USERNAME);
                await page.type(SELECTORS.LOGIN_PASSWORD, CONFIG.PASSWORD);
                
                // FIXED: Combined click and wait for chat input instead of waitForNavigation
                // This handles Single Page Application (SPA) logins better.
                await page.click(SELECTORS.LOGIN_SUBMIT);
                await page.waitForSelector(SELECTORS.INPUT, { visible: true, timeout: 30000 });

                logMessage('BENCHMARK', 'Login successful.');

                // --- BENCHMARK START ---
                const startTime = performance.now();

                await page.focus(SELECTORS.INPUT);
                await page.keyboard.type(question);
                await page.keyboard.press('Enter');

                console.log(`Q[${questionIndex + 1}/R${r + 1}] INPUT: ${question}`);

                // 3. Wait for Full Response
                // This checks for the button that appears when the bot stops generating
                await page.waitForSelector(SELECTORS.FINISH_INDICATOR, { visible: true, timeout: 600000 });

                const endTime = performance.now();
                const totalGenerationTime = (endTime - startTime) / 1000;

                // FIXED: Added a small delay to ensure the DOM is fully updated before scraping
                await sleep(500); 
                const fullResponseText = await page.$eval(SELECTORS.LAST_RESPONSE, el => el.textContent.trim() || '');

                console.log(`Q[${questionIndex + 1}/R${r + 1}] OUTPUT: ${fullResponseText.substring(0, 50)}... (${totalGenerationTime.toFixed(2)}s)`);
                logMessage('BOT', `[T=${totalGenerationTime.toFixed(2)}s] ${fullResponseText}`);

            } catch (error) {
                console.error(`ERROR Q[${questionIndex + 1}/R${r + 1}]: ${error.message}`);
                logMessage('ERROR', `Rep ${r + 1}: ${error.message}`);
            } finally {
                if (browser) await browser.close();
            }
        }
    }
}

runBenchmark().catch(console.error);
