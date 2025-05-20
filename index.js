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

  // Language selection menu
  if (text === "") {
    response = `CON Hitamo ururimi / Choose language:
1. Icyongereza
2. Ikinyarwanda`;
  }

  const mainMenuEN = `CON Welcome to Our Service
1. My Account
2. My Phone Number
3. Buy Airtime
4. Check Balance
5. Contact Support
n. Next
00. Main Menu`;

  const nextMenuEN = `CON More Services
6. Transfer Money
7. Change PIN
8. Loan Request
9. Pay Utility Bills
10. Settings
0. Back
00. Main Menu`;

  const mainMenuRW = `CON Murakaza neza kuri serivisi zacu
1. Konti yanjye
2. Nimero yanjye
3. Kugura umuyoboro
4. Kureba amafaranga asigaye
5. Kuvugana n'ubufasha
n. Ibikurikira
00. Ahabanza`;

  const nextMenuRW = `CON Serivisi zindi:
6. Kohereza amafaranga
7. Guhindura PIN
8. Gusaba inguzanyo
9. Kwishyura fagitire
10. Igenamiterere
0. Subira inyuma
00. Ahabanza`;

  const lang = textValue[0]; // 1 or 2

  // English Flow
  if (lang === "1") {
    const menu = textValue.slice(1);

    if (level === 1 || (level === 2 && menu[0] === "00")) {
      response = mainMenuEN;
    } else if (level === 2 && menu[0] === "n") {
      response = nextMenuEN;
    } else if (menu[0] === "1") {
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
        response = mainMenuEN;
      } else {
        response = `END Invalid input`;
      }
    } else if (menu[0] === "2") {
      response = `END Your phone number is ${phoneNumber}`;
    } else if (menu[0] === "3") {
      if (level === 2) {
        response = `CON Enter airtime amount
0. Back
00. Main Menu`;
      } else if (menu[1] === "0") {
        response = mainMenuEN;
      } else {
        response = `END You purchased RWF ${menu[1]} airtime`;
      }
    } else if (menu[0] === "4") {
      response = `END Your balance is RWF 5,000`;
    } else if (menu[0] === "5") {
      response = `END Call 1234 or email help@support.com`;
    } else if (menu[0] === "6") {
      if (level === 2) {
        response = `CON Enter recipient number
0. Back
00. Main Menu`;
      } else if (menu[1] === "0") {
        response = nextMenuEN;
      } else if (level === 3) {
        response = `CON Enter amount`;
      } else {
        response = `END You sent RWF ${menu[2]} to ${menu[1]}`;
      }
    } else if (menu[0] === "7") {
      if (level === 2) {
        response = `CON Enter old PIN`;
      } else if (level === 3) {
        response = `CON Enter new PIN`;
      } else {
        response = `END PIN changed successfully`;
      }
    } else if (menu[0] === "8") {
      response = `END You requested a loan of RWF 10,000`;
    } else if (menu[0] === "9") {
      response = `END Utility bill payment coming soon`;
    } else if (menu[0] === "10") {
      response = `END Settings under construction`;
    } else if (menu[0] === "0") {
      response = mainMenuEN;
    } else if (menu[0] === "00") {
      response = `CON Hitamo ururimi / Choose language:
1. Icyongereza
2. Ikinyarwanda`;
    } else {
      response = `END Invalid input`;
    }
  }

  // Kinyarwanda Flow
  else if (lang === "2") {
    const menu = textValue.slice(1);

    if (level === 1 || (level === 2 && menu[0] === "00")) {
      response = mainMenuRW;
    } else if (level === 2 && menu[0] === "n") {
      response = nextMenuRW;
    } else if (menu[0] === "1") {
      if (level === 2) {
        response = `CON Amakuru ya konti
1. Nimero ya konti
2. Ubwoko bwa konti
0. Subira inyuma
00. Ahabanza`;
      } else if (menu[1] === "1") {
        response = `END Nimero ya konti yawe ni ACC123456`;
      } else if (menu[1] === "2") {
        response = `END Ubwoko bwa konti ni Iyigenga`;
      } else if (menu[1] === "0") {
        response = mainMenuRW;
      } else {
        response = `END Ibyinjijwe si byo`;
      }
    } else if (menu[0] === "2") {
      response = `END Nimero yawe ni ${phoneNumber}`;
    } else if (menu[0] === "3") {
      if (level === 2) {
        response = `CON Andika amafaranga yo kugura
0. Subira inyuma
00. Ahabanza`;
      } else if (menu[1] === "0") {
        response = mainMenuRW;
      } else {
        response = `END Waguze RWF ${menu[1]} y'umuyoboro`;
      }
    } else if (menu[0] === "4") {
      response = `END Asigaye kuri konti yawe ni RWF 5,000`;
    } else if (menu[0] === "5") {
      response = `END Hamagara 1234 cyangwa andikira kuri help@support.com`;
    } else if (menu[0] === "6") {
      if (level === 2) {
        response = `CON Andika nimero woherezaho
0. Subira inyuma
00. Ahabanza`;
      } else if (menu[1] === "0") {
        response = nextMenuRW;
      } else if (level === 3) {
        response = `CON Andika amafaranga wohereza`;
      } else {
        response = `END Wohereje RWF ${menu[2]} kuri ${menu[1]}`;
      }
    } else if (menu[0] === "7") {
      if (level === 2) {
        response = `CON Andika PIN ya kera`;
      } else if (level === 3) {
        response = `CON Andika PIN nshya`;
      } else {
        response = `END PIN yahinduwe neza`;
      }
    } else if (menu[0] === "8") {
      response = `END Wasabye inguzanyo ya RWF 10,000`;
    } else if (menu[0] === "9") {
      response = `END Kwishyura fagitire biri gutegurwa`;
    } else if (menu[0] === "10") {
      response = `END Igenamiterere rirategurwa`;
    } else if (menu[0] === "0") {
      response = mainMenuRW;
    } else if (menu[0] === "00") {
      response = `CON Hitamo ururimi / Choose language:
1. Icyongereza
2. Ikinyarwanda`;
    } else {
      response = `END Ibyinjijwe si byo`;
    }
  }

  else {
    response = `END Invalid input`;
  }

  res.set("Content-Type", "text/plain");
  res.send(response);
});

app.listen(port, () => {
  console.log(`USSD app running on port ${port}`);
});
