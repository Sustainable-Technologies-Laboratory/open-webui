import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
//
// __dirname für ES Module erzeugen
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

// ==== Konfiguration ====
// ✏️ Hier musst du deine lokalen Einstellungen eintragen
const URL = 'https://chatbot.hs-bochum.de/';            // ✅ URL deiner lokalen Seite
const USERNAME = 'ecodesign@kein.date';            // ✅ Benutzername zum Einloggen
const PASSWORD = 'test123';                // ✅ Passwort zum Einloggen
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Datei mit den Testfällen laden (UTF-8, ; als Trenner)
const testfaellePath = path.join(__dirname, '2025-08 Testfaelle.txt');
const CHAT_COMMANDS = fs.readFileSync(testfaellePath, 'utf8')
  .replace(//g, '')
  .split(';')
  .map(s => s.trim())
  .filter(Boolean);
   // ✅ Befehl, der an den Chat gesendet wird

// ✅ Optional: Pfad zur Log-Datei
const LOG_FILE = path.join(__dirname, 'chat-log.txt');

// ==== Hauptfunktion ====
(async () => {
  // Docker-spezifische Anpassungen (NEU)
  const browser = await puppeteer.launch({
   //≈ executablePath: '/usr/bin/chromium', // Expliziter Chromium-Pfad
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage' // Wichtig für Docker
    ]
  });

  const page = await browser.newPage();

  try {
    // 1. Lokale Seite laden
    await page.goto(URL, { waitUntil: 'networkidle2' });

    //Warten auf Eingabe 
    await sleep(4000);

    // 2. Login durchführen
    // ✏️ Passe hier die CSS-Selektoren an deine Seite an
    await page.type('[type ="email"]', USERNAME);       // ✅ Eingabefeld für Benutzernamen
    await page.type('[type ="password"]', PASSWORD);       // ✅ Eingabefeld für Passwort

    //Warten auf Eingabe
    await sleep(4000);

    // ✏️ Button zum Einloggen
    await Promise.all([
      page.click('[type ="submit"]'),                 // ✅ Login-Button
      page.waitForNavigation({ waitUntil: 'networkidle2' }),
    ]);

    // 3. Warten auf das Chatfenster
    // ✏️ Chat-Eingabefeld, sobald Login erfolgreich war    
    console.log('Warte auf das Chat-Eingabe-div...');
    await page.waitForSelector('#chat-input', { visible: true });

    //Warten auf Eingabe
    await sleep(4000);

    //Nachricht eingeben
    console.log('Fokussiere Chat-Eingabe und sende Nachricht...');
    await page.focus('#chat-input');
    for (let i = 0; i < CHAT_COMMANDS.length; i++) {
  const cmd = CHAT_COMMANDS[i];
  await page.keyboard.type(cmd);
  await page.keyboard.press('Enter');
  console.log(`Gesendet [${i+1}/${CHAT_COMMANDS.length}]:`, cmd);
  // Antwort abwarten und loggen
  await page.waitForSelector('#response-content-container', {timeout: 60000}).catch(() => {});
  let responseText = '';
  try {
    responseText = await page.$eval('#response-content-container', el => el.textContent || '');
  } catch(e) {}
  console.log(`Antwort [${i+1}]:`, responseText);
}
    await page.keyboard.press('Enter');

    console.log('Nachricht wurde gesendet.');

    // Chat-Log starten
    logMessage('USER', CHAT_COMMAND);

    // 5. Auf die Antwort des Chatbots warten
    // ✏️ Hier muss ggf. angepasst werden, je nachdem wie die Antwort angezeigt wird
    await page.waitForSelector('#voice-input-button');

    // 6. Letzte Antwort extrahieren
    const response = await page.$eval('#response-content-container', el => el.textContent);
    console.log('Antwort vom Chatbot:', response);
    logMessage('BOT', response);

    //Warten auf Eingabe
    await sleep(4000);

  } catch (error) {
    console.error('Fehler:', error);
    logMessage('SYSTEM', `Fehler: ${error.message}`);
  } finally {
   await browser.close();
    
  }
})();

// ==== Hilfsfunktion für Chat-Log ====
function logMessage(sender, message) {
  const timestamp = new Date().toISOString();
  const entry = `[${timestamp}] ${sender}: ${message}\n`;
  fs.appendFileSync(LOG_FILE, entry, 'utf8');
}
