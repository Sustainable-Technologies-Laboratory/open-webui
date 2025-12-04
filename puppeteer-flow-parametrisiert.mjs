import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { performance } from 'perf_hooks';

// ESM equivalent of __dirname
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Utility to pause execution
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

// --- Configuration ---
const CONFIG = {
    URL: 'https://chatbot.hs-bochum.de/',
    USERNAME: 'ecodesign@kein.date',
    PASSWORD: 'test123',
    REPETITIONS: 5,
    TEST_FILE_NAME: '2025-08 Testfaelle.txt', // Input file name
    LOG_FILE_NAME: 'chat-log.txt',           // Output log file name
};

// --- Selectors ---
const SELECTORS = {
    LAST_RESPONSE: '#response-content-container',
    INPUT: '#chat-input',
    FINISH_INDICATOR: '#voice-input-button',
    LOGIN_EMAIL: '[type="email"]',
    LOGIN_PASSWORD: '[type="password"]',
    LOGIN_SUBMIT: '[type="submit"]',
};

// --- Data & Initialization ---

// Load Test Cases
const testFilePath = path.join(__dirname, CONFIG.TEST_FILE_NAME);
const CHAT_COMMANDS = fs.readFileSync(testFilePath, 'utf8')
    .replace(/\r/g, '')
    .split(';')
    .map(s => s.trim())
    .filter(Boolean);

// Log file path
const LOG_FILE = path.join(__dirname, CONFIG.LOG_FILE_NAME);

// --- Helper Functions ---

/**
 * Logs a message to the log file.
 * Console output is strictly controlled outside this function to meet minimal output request.
 * @param {string} sender - The sender (e.g., 'BENCHMARK', 'USER', 'BOT').
 * @param {string} message - The message content.
 */
function logMessage(sender, message) {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] [${sender}]: ${message}\n`;
    fs.appendFileSync(LOG_FILE, logEntry);
}

// --- Main Benchmark Logic ---

async function runBenchmark() {
    logMessage('BENCHMARK', 'Starting parameterized test run...');

    for (let questionIndex = 0; questionIndex < CHAT_COMMANDS.length; questionIndex++) {
        const question = CHAT_COMMANDS[questionIndex];

        for (let r = 0; r < CONFIG.REPETITIONS; r++) {
            logMessage('BENCHMARK', `Starting chat for Q[${questionIndex + 1}/${CHAT_COMMANDS.length}], Repetition [${r + 1}/${CONFIG.REPETITIONS}]...`);

            let browser = null;

            try {
                // New browser for each repetition
                browser = await puppeteer.launch({
                    headless: true,
                    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
                });
                const page = await browser.newPage();

                // 1. Navigate
                await page.goto(CONFIG.URL, { waitUntil: 'networkidle2', timeout: 60000 });
                await sleep(4000);

                // 2. Login
                await page.type(SELECTORS.LOGIN_EMAIL, CONFIG.USERNAME);
                await page.type(SELECTORS.LOGIN_PASSWORD, CONFIG.PASSWORD);
                await sleep(4000);

                await Promise.all([
                    page.click(SELECTORS.LOGIN_SUBMIT),
                    page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 }),
                ]);

                // 3. Wait for Chat Window
                await page.waitForSelector(SELECTORS.INPUT, { visible: true, timeout: 30000 });
                logMessage('BENCHMARK', 'Login successful.');

                // --- BENCHMARK START ---
                const startTime = performance.now();

                // 4. Input and Send Message
                await page.focus(SELECTORS.INPUT);
                await page.keyboard.type(question);
                await page.keyboard.press('Enter');

                logMessage('USER', question);

                // Minimal console output for the input
                console.log(`Q[${questionIndex + 1}/R${r + 1}] INPUT: ${question}`);

                // 5. Wait for Full Response
                await page.waitForSelector(SELECTORS.FINISH_INDICATOR, {
                    visible: true,
                    timeout: 600000
                });

                const endTime = performance.now();
                const fullResponseText = await page.$eval(SELECTORS.LAST_RESPONSE, el => el.textContent.trim() || '');
                const totalGenerationTime = (endTime - startTime) / 1000;

                // 6. Minimal Console Output for the result
                console.log(`Q[${questionIndex + 1}/R${r + 1}] OUTPUT: ${fullResponseText.substring(0, 100)}... (Duration: ${totalGenerationTime.toFixed(2)}s)`);

                // 7. Log to File
                logMessage('BOT', `[Q${questionIndex + 1}/R${r + 1} | T=${totalGenerationTime.toFixed(2)}s] ${fullResponseText}`);

            } catch (error) {
                console.error(`ERROR Q[${questionIndex + 1}/R${r + 1}]: ${error.message}`);
                logMessage('ERROR', `Failure in R[${r + 1}] for Q[${questionIndex + 1}]: ${error.message}`);
            } finally {
                // Close browser
                if (browser) {
                    await browser.close();
                }
            }
        }
    }

    logMessage('BENCHMARK', '*** All test runs completed. ***');
    console.log('\n*** ALL TEST RUNS COMPLETED. SEE chat-log.txt FOR FULL DETAILS. ***');
}

// Run the main function
(async () => {
    try {
        await runBenchmark();
    } catch (e) {
        console.error('An unrecoverable error occurred:', e.message);
        process.exit(1);
    }
})();
