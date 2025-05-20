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

  switch (textValue[0]) {
    case "":
      response = `CON Welcome to Our Service
1. My Account
2. My Phone Number
3. Buy Airtime
4. Check Balance
5. Contact Support`;
      break;

    case "1": // My Account
      if (textValue.length === 1) {
        response = `CON Choose account information
1. Account Number
2. Account Type`;
      } else if (textValue[1] === "1") {
        response = `END Your account number is ACC123456`;
      } else if (textValue[1] === "2") {
        response = `END Your account type is Savings`;
      } else {
        response = `END Invalid account option`;
      }
      break;

    case "2": // My Phone Number
      response = `END Your phone number is ${phoneNumber}`;
      break;

    case "3": // Buy Airtime
      if (textValue.length === 1) {
        response = `CON Enter amount of airtime to buy`;
      } else if (textValue.length === 2) {
        const amount = textValue[1];
        response = `END You have purchased RWF ${amount} airtime`;
      } else {
        response = `END Invalid airtime input`;
      }
      break;

    case "4": // Check Balance
      response = `END Your account balance is RWF 5,000`;
      break;

    case "5": // Contact Support
      response = `END For support, call 1234 or email help@support.com`;
      break;

    default:
      response = `END Invalid input`;
      break;
  }

  res.set("Content-Type", "text/plain");
  res.send(response);
});

app.listen(port, () => {
  console.log(`USSD app listening on port ${port}`);
});
