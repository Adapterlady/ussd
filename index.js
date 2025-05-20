require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const mysql = require("mysql2/promise");

const app = express();
const port = process.env.PORT || 3000;

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

let db;
(async () => {
  try {
    db = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME
    });

    // Create tables
    await db.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        phone VARCHAR(20) NOT NULL UNIQUE,
        balance DECIMAL(15,2) NOT NULL DEFAULT 0.00,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS sessions (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        session_id VARCHAR(100) NOT NULL,
        phone VARCHAR(20) NOT NULL,
        service_code VARCHAR(50),
        text TEXT,
        action_done VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log("Database and tables ready.");
    app.listen(port, () => console.log(`USSD app running on port ${port}`));
  } catch (err) {
    console.error("Database connection error:", err);
    process.exit(1);
  }
})();

async function ensureUserExists(phone) {
  const [rows] = await db.execute("SELECT id FROM users WHERE phone = ?", [phone]);
  if (rows.length === 0) {
    await db.execute("INSERT INTO users (phone, balance) VALUES (?, 0)", [phone]);
  }
}

async function storeSession(sessionId, phone, serviceCode, text, action = null) {
  try {
    await db.execute(
      "INSERT INTO sessions (session_id, phone, service_code, text, action_done) VALUES (?, ?, ?, ?, ?)",
      [sessionId, phone, serviceCode, text, action]
    );
  } catch (err) {
    console.error("Error storing session:", err);
  }
}

function mainMenuEng() {
  return `CON Welcome:
1. My Account
2. My Phone Number
3. Buy Airtime
4. Check Balance
5. Contact Support
6. Deposit
n. Next
00. Main Menu`;
}

function moreServicesEng() {
  return `CON More Services:
7. Transfer Money
8. Change PIN
9. Loan Request
10. Pay Bills
11. Settings
0. Back
00. Main Menu`;
}

function mainMenuKiny() {
  return `CON Murakaza neza:
1. Konti Yanjye
2. Nimero Yanjye
3. Kugura Amafaranga Y’ifatabuguzi
4. Kureba Umutungo
5. Serivisi y’Ubufasha
6. Kubitsa
n. Ibikurikira
00. Tangira bushya`;
}

app.post("/ussd", async (req, res) => {
  const { sessionId, serviceCode, phoneNumber, text = "" } = req.body;
  const input = text.trim().split("*");
  const lang = input[0];
  const level = input.length;

  await storeSession(sessionId, phoneNumber, serviceCode, text);
  await ensureUserExists(phoneNumber);

  let response = "";

  // Reset to language selection on empty input or '00'
  if (text === "" || text === "00") {
    response = `CON Choose language / Hitamo ururimi:
1. English
2. Kinyarwanda`;
    return res.send(response);
  }

  if (lang === "1") {
    const menu = input.slice(1);

    // If user typed '00' anywhere, reset
    if (menu.includes("00")) {
      response = `CON Choose language / Hitamo ururimi:
1. English
2. Kinyarwanda`;
      return res.send(response);
    }

    // Handle Back ('0')
    if (menu.includes("0")) {
      if (menu[0] === "0" && level === 2) {
        response = mainMenuEng();
        return res.send(response);
      }
      if (level === 1 || (level === 2 && menu[0] === "0")) {
        // Back at main menu goes to language select
        response = `CON Choose language / Hitamo ururimi:
1. English
2. Kinyarwanda`;
        return res.send(response);
      }
      // For deeper menus, just go back one level - simplify to main menu for now
      if (level > 2 && menu[0] === "0") {
        response = mainMenuEng();
        return res.send(response);
      }
    }

    // Handle Next ('n')
    if (menu[0] === "n" && level === 2) {
      response = moreServicesEng();
      return res.send(response);
    }

    // MAIN MENU OPTIONS ENGLISH

    // Main menu first page
    if (level === 1 || (menu[0] === "00" && level === 2)) {
      response = mainMenuEng();
    }
    else if (menu[0] === "1") {
      if (level === 2) {
        response = `CON Account Info:
1. Account Number
2. Account Type
0. Back
00. Main Menu`;
      } else if (menu[1] === "1") {
        response = `END Your account number is ACC123456`;
      } else if (menu[1] === "2") {
        response = `END Your account type is Savings`;
      } else if (menu[1] === "0") {
        response = mainMenuEng();
      } else {
        response = `END Invalid input`;
      }
    }
    else if (menu[0] === "2") {
      response = `END Your phone number is ${phoneNumber}`;
    }
    else if (menu[0] === "3") {
      if (level === 2) {
        response = `CON Enter airtime amount (RWF):
0. Back
00. Main Menu`;
      } else {
        const amount = parseFloat(menu[1]);
        if (isNaN(amount) || amount <= 0) return res.send("END Invalid amount.");

        const [[user]] = await db.execute("SELECT balance FROM users WHERE phone = ?", [phoneNumber]);
        if (!user || user.balance < amount) return res.send("END Insufficient balance.");

        await db.execute("UPDATE users SET balance = balance - ? WHERE phone = ?", [amount, phoneNumber]);
        await storeSession(sessionId, phoneNumber, serviceCode, text, "buy_airtime");

        return res.send(`END Airtime purchase of RWF ${amount} successful.`);
      }
    }
    else if (menu[0] === "4") {
      const [[user]] = await db.execute("SELECT balance FROM users WHERE phone = ?", [phoneNumber]);
      return res.send(`END Your balance is RWF ${user.balance}`);
    }
    else if (menu[0] === "5") {
      response = `END Call 1234 or email support@service.com`;
    }
    else if (menu[0] === "6") {
      if (level === 2) {
        response = `CON Enter deposit amount (RWF):
0. Back
00. Main Menu`;
      } else {
        const amount = parseFloat(menu[1]);
        if (isNaN(amount) || amount <= 0) return res.send("END Invalid amount.");

        await db.execute("UPDATE users SET balance = balance + ? WHERE phone = ?", [amount, phoneNumber]);
        await storeSession(sessionId, phoneNumber, serviceCode, text, "deposit");

        return res.send(`END Deposit of RWF ${amount} successful.`);
      }
    }
    else if (["7", "8", "9", "10", "11"].includes(menu[0])) {
      response = `END Feature under development.`;
    }
    else if (menu[0] === "0") {
      response = mainMenuEng();
    }
    else {
      response = `END Invalid input`;
    }
  }
  else if (lang === "2") {
    const menu = input.slice(1);

    // Reset to language selection
    if (menu.includes("00")) {
      response = `CON Choose language / Hitamo ururimi:
1. English
2. Kinyarwanda`;
      return res.send(response);
    }

    // Back '0'
    if (menu.includes("0")) {
      if (menu[0] === "0" && level === 2) {
        response = mainMenuKiny();
        return res.send(response);
      }
      if (level === 1 || (level === 2 && menu[0] === "0")) {
        response = `CON Choose language / Hitamo ururimi:
1. English
2. Kinyarwanda`;
        return res.send(response);
      }
      if (level > 2 && menu[0] === "0") {
        response = mainMenuKiny();
        return res.send(response);
      }
    }

    // Next 'n' (Ibikurikira)
    if (menu[0] === "n" && level === 2) {
      response = `CON Ibindi bikorwa:
7. Kohereza amafaranga
8. Guhindura PIN
9. Gusaba inguzanyo
10. Kwishyura fagitire
11. Igenamiterere
0. Subira inyuma
00. Tangira bushya`;
      return res.send(response);
    }

    // MAIN MENU OPTIONS KINYARWANDA

    if (level === 1 || (menu[0] === "00" && level === 2)) {
      response = mainMenuKiny();
    }
    else if (menu[0] === "1") {
      response = `END Nimero ya konti ni ACC123456`;
    }
    else if (menu[0] === "2") {
      response = `END Nimero yawe ni ${phoneNumber}`;
    }
    else if (menu[0] === "3") {
      response = `END Serivisi yo kugura amafaranga iri gutegurwa.`;
    }
    else if (menu[0] === "4") {
      const [[user]] = await db.execute("SELECT balance FROM users WHERE phone = ?", [phoneNumber]);
      return res.send(`END Umutungo wawe ni RWF ${user.balance}`);
    }
    else if (menu[0] === "5") {
      response = `END Hamagara 1234 cyangwa andikira support@service.com`;
    }
    else if (menu[0] === "6") {
      if (level === 2) {
        response = `CON Andika amafaranga ushaka kubitsa (RWF):
0. Subira inyuma
00. Tangira bushya`;
      } else {
        const amount = parseFloat(menu[1]);
        if (isNaN(amount) || amount <= 0) return res.send("END Umubare winjije si wo.");

        await db.execute("UPDATE users SET balance = balance + ? WHERE phone = ?", [amount, phoneNumber]);
        await storeSession(sessionId, phoneNumber, serviceCode, text, "deposit");

        return res.send(`END Kubitsa RWF ${amount} byagenze neza.`);
      }
    }
    else if (["7", "8", "9", "10", "11"].includes(menu[0])) {
      response = `END Serivisi iri gutegurwa.`;
    }
    else if (menu[0] === "0") {
      response = mainMenuKiny();
    }
    else {
      response = `END Ibyinjiye si byo`;
    }
  } else {
    response = `END Invalid input`;
  }

  res.set("Content-Type", "text/plain");
  res.send(response);
});
