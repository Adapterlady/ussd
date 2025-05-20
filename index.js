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

  // Language selection
  if (text === "") {
    response = `CON Choose language / Hitamo ururimi
1. English
2. Kinyarwanda`;
  }

  // English language selected
  else if (textValue[0] === "1") {
    const level = textValue.length;

    if (level === 1) {
      response = `CON Welcome to Our Service
1. My Account
2. My Phone Number
3. Buy Airtime
4. Check Balance
5. Contact Support
6. Transfer Money
7. Change PIN
n. Next
0. Back`;
    }

    // My Account
    else if (textValue[1] === "1") {
      if (level === 2) {
        response = `CON Account Info
1. Account Number
2. Account Type
0. Back`;
      } else if (textValue[2] === "1") {
        response = `END Your account number is ACC123456`;
      } else if (textValue[2] === "2") {
        response = `END Your account type is Savings`;
      } else if (textValue[2] === "0") {
        response = `CON Welcome to Our Service
1. My Account
2. My Phone Number
3. Buy Airtime
4. Check Balance
5. Contact Support
6. Transfer Money
7. Change PIN
n. Next
0. Back`;
      } else {
        response = `END Invalid input`;
      }
    }

    // My Phone Number
    else if (textValue[1] === "2") {
      response = `END Your phone number is ${phoneNumber}`;
    }

    // Buy Airtime
    else if (textValue[1] === "3") {
      if (level === 2) {
        response = `CON Enter amount of airtime
0. Back`;
      } else if (textValue[2] === "0") {
        response = `CON Welcome to Our Service
1. My Account
2. My Phone Number
3. Buy Airtime
4. Check Balance
5. Contact Support
6. Transfer Money
7. Change PIN
n. Next
0. Back`;
      } else {
        const amount = textValue[2];
        response = `END You have purchased RWF ${amount} airtime`;
      }
    }

    // Check Balance
    else if (textValue[1] === "4") {
      response = `END Your account balance is RWF 5,000`;
    }

    // Contact Support
    else if (textValue[1] === "5") {
      response = `END For support, call 1234 or email help@support.com`;
    }

    // Transfer Money
    else if (textValue[1] === "6") {
      if (level === 2) {
        response = `CON Enter recipient phone number
0. Back`;
      } else if (textValue[2] === "0") {
        response = `CON Welcome to Our Service
1. My Account
2. My Phone Number
3. Buy Airtime
4. Check Balance
5. Contact Support
6. Transfer Money
7. Change PIN
n. Next
0. Back`;
      } else if (level === 3) {
        response = `CON Enter amount to send`;
      } else if (level === 4) {
        const recipient = textValue[2];
        const amount = textValue[3];
        response = `END You have sent RWF ${amount} to ${recipient}`;
      } else {
        response = `END Invalid transfer input`;
      }
    }

    // Change PIN
    else if (textValue[1] === "7") {
      if (level === 2) {
        response = `CON Enter old PIN
0. Back`;
      } else if (textValue[2] === "0") {
        response = `CON Welcome to Our Service
1. My Account
2. My Phone Number
3. Buy Airtime
4. Check Balance
5. Contact Support
6. Transfer Money
7. Change PIN
n. Next
0. Back`;
      } else if (level === 3) {
        response = `CON Enter new PIN`;
      } else if (level === 4) {
        response = `END PIN changed successfully`;
      } else {
        response = `END Invalid input`;
      }
    }

    // Next page placeholder
    else if (textValue[1] === "n") {
      response = `END No more services available`;
    }

    // Back to language select
    else if (textValue[1] === "0") {
      response = `CON Choose language / Hitamo ururimi
1. English
2. Kinyarwanda`;
    }

    else {
      response = `END Invalid input`;
    }
  }

  // Kinyarwanda selected
  else if (textValue[0] === "2") {
    response = `END Serivisi z'Ikinyarwanda zirimo gutegurwa. Murakoze.`;
  }

  // Invalid base input
  else {
    response = `END Invalid input`;
  }

  res.set("Content-Type", "text/plain");
  res.send(response);
});

app.listen(port, () => {
  console.log(`USSD app listening on port ${port}`);
});
