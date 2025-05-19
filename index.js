const express = require("express");
const bodyParser = require("body-parser");

const app = express();
const port = 3000;

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.post("/ussd", (req, res) => {
  const { sessionId, serviceCode, phoneNumber, text } = req.body;

  let response = "";

  if (text === "") {
    response = `CON What would you want to check
1. My Account
2. My phone number`;
  } else if (text === "1") {
    response = `CON Choose account information you want to view
1. Account number`;
  } else if (text === "2") {
    response = `END Your phone number is ${phoneNumber}`;
  } else if (text === "1*1") {
    const accountNumber = "ACC1001";
    response = `END Your account number is ${accountNumber}`;
  } else {
    response = `END Invalid input`;
  }

  res.set("Content-Type", "text/plain");
  res.send(response);
});

app.listen(port, () => {
  console.log(`USSD app listening on port ${port}`);
});
