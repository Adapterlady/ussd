const express = require("express");
const bodyParser = require("body-parser");

const app = express();
const port = 3000;

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.post("/ussd", (req, res) => {
  const { sessionId, serviceCode, phoneNumber, text } = req.body;
  let response = "";

  const textValue = text.split("*");
  const level = textValue.length;

  // Language Selection
  if (text === "") {
    response = `CON Choose language / Hitamo ururimi
1. English
2. Kinyarwanda`;
  }

  // English Menu Flow
  else if (textValue[0] === "1") {
    const currentMenu = textValue.slice(1);

    // Main Menu Page 1
    if (level === 1 || (level === 2 && currentMenu[0] === "00")) {
      response = `CON Welcome to Our Service
1. My Account
2. My Phone Number
3. Buy Airtime
4. Check Balance
5. Contact Support
n. Next
00. Main Menu`;
    }

    // Page 2 Menu
    else if (level === 2 && currentMenu[0] === "n") {
      response = `CON More Services
6. Transfer Money
7. Change PIN
8. Loan Request
9. Pay Utility Bills
10. Settings
0. Back
00. Main Menu`;
    }

    // 1. My Account
    else if (currentMenu[0] === "1") {
      if (level === 2) {
        response = `CON Account Info
1. Account Number
2. Account Type
0. Back
00. Main Menu`;
      } else if (currentMenu[1] === "1") {
        response = `END Your account number is ACC123456`;
      } else if (currentMenu[1] === "2") {
        response = `END Your account type is Savings`;
      } else if (currentMenu[1] === "0") {
        response = `CON Welcome to Our Service
1. My Account
2. My Phone Number
3. Buy Airtime
4. Check Balance
5. Contact Support
n. Next
00. Main Menu`;
      } else {
        response = `END Invalid input`;
      }
    }

    // 2. Phone Number
    else if (currentMenu[0] === "2") {
      response = `END Your phone number is ${phoneNumber}`;
    }

    // 3. Buy Airtime
    else if (currentMenu[0] === "3") {
      if (level === 2) {
        response = `CON Enter airtime amount
0. Back
00. Main Menu`;
      } else if (currentMenu[1] === "0") {
        response = `CON Welcome to Our Service
1. My Account
2. My Phone Number
3. Buy Airtime
4. Check Balance
5. Contact Support
n. Next
00. Main Menu`;
      } else {
        response = `END You have purchased RWF ${currentMenu[1]} airtime`;
      }
    }

    // 4. Check Balance
    else if (currentMenu[0] === "4") {
      response = `END Your account balance is RWF 5,000`;
    }

    // 5. Contact Support
    else if (currentMenu[0] === "5") {
      response = `END Call 1234 or email help@support.com`;
    }

    // 6. Transfer Money
    else if (currentMenu[0] === "6") {
      if (level === 2) {
        response = `CON Enter recipient number
0. Back
00. Main Menu`;
      } else if (currentMenu[1] === "0") {
        response = `CON More Services
6. Transfer Money
7. Change PIN
8. Loan Request
9. Pay Utility Bills
10. Settings
0. Back
00. Main Menu`;
      } else if (level === 3) {
        response = `CON Enter amount to send`;
      } else {
        const recipient = currentMenu[1];
        const amount = currentMenu[2];
        response = `END You have sent RWF ${amount} to ${recipient}`;
      }
    }

    // 7. Change PIN
    else if (currentMenu[0] === "7") {
      if (level === 2) {
        response = `CON Enter old PIN
0. Back
00. Main Menu`;
      } else if (level === 3) {
        response = `CON Enter new PIN`;
      } else if (level === 4) {
        response = `END PIN changed successfully`;
      } else {
        response = `END Invalid input`;
      }
    }

    // 8. Loan Request
    else if (currentMenu[0] === "8") {
      response = `END Loan of RWF 10,000 has been requested.`;
    }

    // 9. Pay Utility Bills
    else if (currentMenu[0] === "9") {
      response = `END Utility bill payment feature coming soon.`;
    }

    // 10. Settings
    else if (currentMenu[0] === "10") {
      response = `END Settings menu under development.`;
    }

    // 0. Back from Page 2
    else if (currentMenu[0] === "0") {
      response = `CON Welcome to Our Service
1. My Account
2. My Phone Number
3. Buy Airtime
4. Check Balance
5. Contact Support
n. Next
00. Main Menu`;
    }

    // 00. Main Menu
    else if (currentMenu[0] === "00") {
      response = `CON Choose language / Hitamo ururimi
1. English
2. Kinyarwanda`;
    }

    else {
      response = `END Invalid input`;
    }
  }

  // Kinyarwanda
  else if (textValue[0] === "2") {
    response = `END Serivisi z'Ikinyarwanda zirimo gutegurwa. Murakoze.`;
  }

  else {
    response = `END Invalid input`;
  }

  res.set("Content-Type", "text/plain");
  res.send(response);
});

app.listen(port, () => {
  console.log(`USSD app listening on port ${port}`);
});
