const express = require("express");
const bodyParser = require("body-parser");
const mysql = require("mysql2");

const app = express();
const port = 3000;

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Database connection
const db = mysql.createConnection({
  host: "mysql-bonfils.alwaysdata.net", // AlwaysData MySQL host
  user: "bonfils",                      // AlwaysData MySQL username
  password: "Bonfils@Kigali12",         // Your actual password
  database: "bonfils_ussapp"            // Your database name
});

// Ensure users table exists before starting the server
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
    } else {
      console.log("Users table ready.");
      // Start server after table check
      app.listen(port, () => {
        console.log(`USSD app running on port ${port}`);
      });
    }
  }
);

// USSD Endpoint
app.post("/ussd", (req, res) => {
  const { sessionId, serviceCode, phoneNumber, text } = req.body;
  const textValue = text.split("*");
  const level = textValue.length;
  let response = "";

  // Language Selection
  if (text === "") {
    response = `CON Choose language / Hitamo ururimi
1. English
2. Kinyarwanda`;
  }

  // English Menu
  else if (textValue[0] === "1") {
    const menu = textValue.slice(1);

    if (level === 1 || (menu[0] === "00" && level === 2)) {
      response = `CON Welcome
1. My Account
2. My Phone Number
3. Buy Airtime
4. Check Balance
5. Contact Support
n. Next
00. Main Menu`;
    }

    else if (menu[0] === "n" && level === 2) {
      response = `CON More Services
6. Transfer Money
7. Change PIN
8. Loan Request
9. Pay Utility Bills
10. Settings
0. Back
00. Main Menu`;
    }

    else if (menu[0] === "1") {
      if (level === 2) {
        response = `CON Account Info
1. Account Number
2. Account Type
0. Back
00. Main Menu`;
      } else if (menu[1] === "1") {
        response = `END Your account number is ACC123456`;
      } else if (menu[1] === "2") {
        response = `END Your account type is Savings`;
      } else if (menu[1] === "0") {
        response = `CON Welcome
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
        response = `CON Enter airtime amount
0. Back
00. Main Menu`;
      } else if (menu[1] === "0") {
        response = `CON Welcome
1. My Account
2. My Phone Number
3. Buy Airtime
4. Check Balance
5. Contact Support
n. Next
00. Main Menu`;
      } else {
        const amount = parseFloat(menu[1]);
        if (isNaN(amount)) {
          response = `END Invalid amount`;
        } else {
          // Update balance
          db.execute(
            "UPDATE users SET balance = balance - ? WHERE phone = ?",
            [amount, phoneNumber],
            (err, results) => {
              if (err) {
                response = `END Error processing request`;
                res.set("Content-Type", "text/plain");
                return res.send(response);
              }
              response = `END You have purchased RWF ${amount} airtime`;
              res.set("Content-Type", "text/plain");
              return res.send(response);
            }
          );
          return;
        }
      }
    }

    else if (menu[0] === "4") {
      db.execute(
        "SELECT balance FROM users WHERE phone = ?",
        [phoneNumber],
        (err, results) => {
          if (err || results.length === 0) {
            response = `END Error retrieving balance`;
          } else {
            const balance = results[0].balance;
            response = `END Your balance is RWF ${balance}`;
          }
          res.set("Content-Type", "text/plain");
          return res.send(response);
        }
      );
      return;
    }

    else if (menu[0] === "5") {
      response = `END Call 1234 or email support@service.com`;
    }

    else if (menu[0] === "6") {
      response = `END Transfer service coming soon`;
    }

    else if (menu[0] === "7") {
      response = `END PIN change feature coming soon`;
    }

    else if (menu[0] === "8") {
      response = `END Loan request feature coming soon`;
    }

    else if (menu[0] === "9") {
      response = `END Pay bills coming soon`;
    }

    else if (menu[0] === "10") {
      response = `END Settings coming soon`;
    }

    else if (menu[0] === "0") {
      response = `CON Welcome
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

  // Kinyarwanda placeholder
  else if (textValue[0] === "2") {
    response = `END Serivisi z'Ikinyarwanda zirimo gutegurwa. Murakoze.`;
  }

  else {
    response = `END Invalid input`;
  }

  res.set("Content-Type", "text/plain");
  res.send(response);
});