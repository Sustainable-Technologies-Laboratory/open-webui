import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
//
// __dirname für ES Module erzeugen
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ==== Konfiguration ====
// ✏️ Hier musst du deine lokalen Einstellungen eintragen
const URL = 'https://chatbot.hs-bochum.de/';            // ✅ URL deiner lokalen Seite
const USERNAME = 'ecodesign@kein.date';            // ✅ Benutzername zum Einloggen
const PASSWORD = 'test123';                // ✅ Passwort zum Einloggen
const CHAT_COMMAND = 'Hi kannst du mir Feedback zu Aufgabe 1 geben? Hier meine ergebnisse: Transport: 1,65 kg CO2 eq. Nutzung: 97,76 kg CO2 eq. Produktion: 294,242 kg CO2 eq.';   // ✅ Befehl, der an den Chat gesendet wird

// ✅ Optional: Pfad zur Log-Datei
const LOG_FILE = path.join(__dirname, 'chat-log.txt');

// ==== Hauptfunktion ====
(async () => {
  const browser = await puppeteer.launch({
  executablePath: '/usr/bin/chromium',
  headless: true,
  args: ['--no-sandbox', '--disable-setuid-sandbox']
  }); // ❗ false = sichtbarer Browser
  const page = await browser.newPage();

  try {
    // 1. Lokale Seite laden
    await page.goto(URL, { waitUntil: 'networkidle2' });

    // 2. Login durchführen
    // ✏️ Passe hier die CSS-Selektoren an deine Seite an
    await page.waitForSelector('[type ="email"]', { visible: true });
    await page.type('[type ="email"]', USERNAME);       // ✅ Eingabefeld für Benutzernamen
    await page.type('[type ="password"]', PASSWORD);       // ✅ Eingabefeld für Passwort

    // ✏️ Button zum Einloggen
    await Promise.all([
      page.click('[type ="submit"]'),                 // ✅ Login-Button
      page.waitForNavigation({ waitUntil: 'networkidle2' }),
    ]);

    // 3. Warten auf das Chatfenster
    // ✏️ Chat-Eingabefeld, sobald Login erfolgreich war    
    console.log('Warte auf das Chat-Eingabe-div...');
    await page.waitForSelector('#chat-input', { visible: true });

    //Nachricht eingeben
    console.log('Fokussiere Chat-Eingabe und sende Nachricht...');
    await page.focus('#chat-input');
    await page.keyboard.type(CHAT_COMMAND);
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
