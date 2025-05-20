require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const mysql = require("mysql2/promise");

const app = express();
const port = process.env.PORT || 3000;

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

let db;

// Initialize DB connection and tables
(async () => {
  try {
    db = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME
    });

    await db.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        phone VARCHAR(20) NOT NULL UNIQUE,
        balance DECIMAL(15, 2) DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS sessions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        session_id VARCHAR(100),
        phone VARCHAR(20),
        service_code VARCHAR(50),
        text TEXT,
        action_done VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log("✅ Database connected.");
    app.listen(port, () => console.log(`🚀 USSD app running on port ${port}`));
  } catch (err) {
    console.error("❌ Database connection error:", err.message);
    process.exit(1);
  }
})();

// Utility: Ensure user record exists
async function ensureUser(phone) {
  const [rows] = await db.execute("SELECT id FROM users WHERE phone = ?", [phone]);
  if (rows.length === 0) {
    await db.execute("INSERT INTO users (phone, balance) VALUES (?, 0)", [phone]);
  }
}

// Utility: Save session
async function saveSession(sessionId, phone, serviceCode, text, action = null) {
  try {
    await db.execute(
      "INSERT INTO sessions (session_id, phone, service_code, text, action_done) VALUES (?, ?, ?, ?, ?)",
      [sessionId, phone, serviceCode, text, action]
    );
  } catch (err) {
    console.error("❌ Session error:", err.message);
  }
}

// USSD Handler
app.post("/ussd", async (req, res) => {
  const { sessionId, serviceCode, phoneNumber, text } = req.body;
  const input = text.trim().split("*");
  const lang = input[0];
  const level = input.length;

  await saveSession(sessionId, phoneNumber, serviceCode, text);
  await ensureUser(phoneNumber);

  let response = "";

  // LANGUAGE CHOICE
  if (text === "") {
    return res.send(`CON Choose language / Hitamo ururimi:
1. English
2. Kinyarwanda`);
  }

  // ENGLISH FLOW
  if (lang === "1") {
    const menu = input.slice(1);

    switch (menu[0]) {
      case undefined:
      case "00":
      case "0":
        response = `CON Welcome:
1. My Account
2. My Phone Number
3. Buy Airtime
4. Check Balance
5. Contact Support
6. Deposit
n. Next
00. Main Menu`;
        break;

      case "1": // My Account
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
        }
        break;

      case "2": // Phone Number
        response = `END Your phone number is ${phoneNumber}`;
        break;

      case "3": // Buy Airtime
        if (level === 2) {
          response = `CON Enter airtime amount (RWF):`;
        } else {
          const amount = parseFloat(menu[1]);
          if (isNaN(amount) || amount <= 0) return res.send("END Invalid amount.");
          const [[user]] = await db.execute("SELECT balance FROM users WHERE phone = ?", [phoneNumber]);
          if (!user || user.balance < amount) return res.send("END Insufficient balance.");

          await db.execute("UPDATE users SET balance = balance - ? WHERE phone = ?", [amount, phoneNumber]);
          await saveSession(sessionId, phoneNumber, serviceCode, text, "buy_airtime");
          return res.send(`END Airtime purchase of RWF ${amount} successful.`);
        }
        break;

      case "4": // Check Balance
        const [[userBal]] = await db.execute("SELECT balance FROM users WHERE phone = ?", [phoneNumber]);
        return res.send(`END Your balance is RWF ${userBal.balance}`);
      
      case "5": // Support
        response = `END Call 1234 or email support@service.com`;
        break;

      case "6": // Deposit
        if (level === 2) {
          response = `CON Enter deposit amount (RWF):`;
        } else {
          const amount = parseFloat(menu[1]);
          if (isNaN(amount) || amount <= 0) return res.send("END Invalid amount.");
          await db.execute("UPDATE users SET balance = balance + ? WHERE phone = ?", [amount, phoneNumber]);
          await saveSession(sessionId, phoneNumber, serviceCode, text, "deposit");
          return res.send(`END Deposit of RWF ${amount} successful.`);
        }
        break;

      case "n":
        response = `CON More Services:
7. Transfer Money
8. Change PIN
9. Loan Request
10. Pay Bills
11. Settings
0. Back
00. Main Menu`;
        break;

      case "7":
      case "8":
      case "9":
      case "10":
      case "11":
        response = `END Feature under development.`;
        break;

      default:
        response = `END Invalid input.`;
    }

  // KINYARWANDA FLOW
  } else if (lang === "2") {
    const menu = input.slice(1);

    switch (menu[0]) {
      case undefined:
      case "00":
      case "0":
        response = `CON Murakaza neza:
1. Konti Yanjye
2. Nimero Yanjye
3. Kugura Amafaranga Y’ifatabuguzi
4. Kureba Umutungo
5. Serivisi y’Ubufasha
6. Kubitsa
n. Ibikurikira
00. Tangira bushya`;
        break;

      case "1":
        response = `END Nimero ya konti ni ACC123456`;
        break;

      case "2":
        response = `END Nimero yawe ni ${phoneNumber}`;
        break;

      case "3":
        response = `END Serivisi yo kugura amafaranga iri gutegurwa.`;
        break;

      case "4":
        const [[userK]] = await db.execute("SELECT balance FROM users WHERE phone = ?", [phoneNumber]);
        return res.send(`END Umutungo wawe ni RWF ${userK.balance}`);
      
      case "5":
        response = `END Hamagara 1234 cyangwa andikira support@service.com`;
        break;

      case "6":
        if (level === 2) {
          response = `CON Andika amafaranga ushaka kubitsa (RWF):`;
        } else {
          const amount = parseFloat(menu[1]);
          if (isNaN(amount) || amount <= 0) return res.send("END Umubare winjije si wo.");
          await db.execute("UPDATE users SET balance = balance + ? WHERE phone = ?", [amount, phoneNumber]);
          await saveSession(sessionId, phoneNumber, serviceCode, text, "deposit");
          return res.send(`END Kubitsa RWF ${amount} byagenze neza.`);
        }
        break;

      default:
        response = `END Ibyinjiye si byo.`;
    }
  } else {
    response = `END Invalid input`;
  }

  res.set("Content-Type", "text/plain");
  res.send(response);
});
