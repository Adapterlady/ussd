require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const mysql = require("mysql2");

const app = express();
const port = process.env.PORT || 3000;

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// DB connection
const db = mysql.createConnection({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});

// Create users table if not exists
db.execute(
  `CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    phone VARCHAR(20) NOT NULL UNIQUE,
    balance DECIMAL(15,2) DEFAULT 0
  )`,
  (err) => {
    if (err) {
      console.error("Error creating users table:", err);
      process.exit(1);
    }
    console.log("Users table ready.");
    app.listen(port, () => {
      console.log(`USSD app running on port ${port}`);
    });
  }
);

// Ensure user exists
function ensureUserExists(phone, callback) {
  db.execute("SELECT id FROM users WHERE phone = ?", [phone], (err, results) => {
    if (err) return callback(err);
    if (results.length === 0) {
      db.execute("INSERT INTO users (phone, balance) VALUES (?, 0)", [phone], (insertErr) => callback(insertErr));
    } else {
      callback(null);
    }
  });
}

// USSD route
app.post("/ussd", (req, res) => {
  const { sessionId, serviceCode, phoneNumber, text } = req.body;
  const input = text.split("*");
  const level = input.length;

  ensureUserExists(phoneNumber, (err) => {
    if (err) {
      res.set("Content-Type", "text/plain");
      return res.send("END Error initializing user.");
    }

    let response = "";

    // Language Selection
    if (text === "") {
      response = `CON Choose language / Hitamo ururimi:
1. English
2. Kinyarwanda`;
    }

    // ===== ENGLISH MENU =====
    else if (input[0] === "1") {
      const menu = input.slice(1);

      if (level === 1 || (menu[0] === "00" && level === 2)) {
        response = `CON Welcome:
1. My Account
2. My Phone Number
3. Buy Airtime
4. Check Balance
5. Contact Support
n. Next
00. Main Menu`;
      }

      else if (menu[0] === "n" && level === 2) {
        response = `CON More Services:
6. Transfer Money
7. Change PIN
8. Loan Request
9. Pay Bills
10. Settings
0. Back
00. Main Menu`;
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
          response = `CON Welcome:
1. My Account
2. My Phone Number
3. Buy Airtime
4. Check Balance
5. Contact Support
n. Next
00. Main Menu`;
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
        } else if (menu[1] === "0") {
          response = `CON Welcome:
1. My Account
2. My Phone Number
3. Buy Airtime
4. Check Balance
5. Contact Support
n. Next
00. Main Menu`;
        } else {
          const amount = parseFloat(menu[1]);
          if (isNaN(amount) || amount <= 0) return res.send("END Invalid amount.");

          db.execute("SELECT balance FROM users WHERE phone = ?", [phoneNumber], (err, results) => {
            if (err || results.length === 0) return res.send("END Error retrieving balance.");
            const current = results[0].balance;
            if (current < amount) return res.send("END Insufficient balance.");

            db.execute("UPDATE users SET balance = balance - ? WHERE phone = ?", [amount, phoneNumber], (err2) => {
              if (err2) return res.send("END Error processing transaction.");
              return res.send(`END Airtime purchase of RWF ${amount} successful.`);
            });
          });
          return;
        }
      }

      else if (menu[0] === "4") {
        db.execute("SELECT balance FROM users WHERE phone = ?", [phoneNumber], (err, results) => {
          if (err || results.length === 0) {
            return res.send("END Error retrieving balance.");
          } else {
            return res.send(`END Your balance is RWF ${results[0].balance}`);
          }
        });
        return;
      }

      else if (menu[0] === "5") {
        response = `END Call 1234 or email support@service.com`;
      }

      else if (["6", "7", "8", "9", "10"].includes(menu[0])) {
        response = `END Feature under development.`;
      }

      else if (menu[0] === "0") {
        response = `CON Welcome:
1. My Account
2. My Phone Number
3. Buy Airtime
4. Check Balance
5. Contact Support
n. Next
00. Main Menu`;
      }

      else {
        response = `END Invalid input`;
      }
    }

    // ===== KINYARWANDA MENU =====
    else if (input[0] === "2") {
      const menu = input.slice(1);

      if (level === 1 || (menu[0] === "00" && level === 2)) {
        response = `CON Murakaza neza:
1. Konti Yanjye
2. Nimero Yanjye
3. Kugura Amafaranga Y’ifatabuguzi
4. Kureba Umutungo
5. Serivisi y’Ubufasha
n. Ibikurikira
00. Tangira bushya`;
      }

      else if (menu[0] === "n" && level === 2) {
        response = `CON Serivisi Ziyongera:
6. Kohereza Amafaranga
7. Hindura PIN
8. Gusaba Inguzanyo
9. Kwishyura Serivisi
10. Ibindi
0. Subira inyuma
00. Tangira bushya`;
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
        db.execute("SELECT balance FROM users WHERE phone = ?", [phoneNumber], (err, results) => {
          if (err || results.length === 0) {
            return res.send("END Ntibishobotse kubona umutungo.");
          } else {
            return res.send(`END Umutungo wawe ni RWF ${results[0].balance}`);
          }
        });
        return;
      }

      else if (menu[0] === "5") {
        response = `END Hamagara 1234 cyangwa andikira support@service.com`;
      }

      else if (["6", "7", "8", "9", "10"].includes(menu[0])) {
        response = `END Iyi serivisi iri gutegurwa.`;
      }

      else if (menu[0] === "0") {
        response = `CON Murakaza neza:
1. Konti Yanjye
2. Nimero Yanjye
3. Kugura Amafaranga Y’ifatabuguzi
4. Kureba Umutungo
5. Serivisi y’Ubufasha
n. Ibikurikira
00. Tangira bushya`;
      }

      else {
        response = `END Ibyinjiye si byo`;
      }
    }

    // Invalid language choice
    else {
      response = `END Invalid input`;
    }

    res.set("Content-Type", "text/plain");
    res.send(response);
  });
});