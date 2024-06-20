const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const path = require("path"); // Lisätään path-moduuli

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ limit: '10mb', extended: false }));

const config = require("./config.json");
const psw = config.db.password;
const usr = config.db.username;

const host = process.env.HOST || "localhost";

// MongoDB yhteys ÄLÄ KOSKE
const uri =
  "mongodb+srv://" +
  usr +
  ":" +
  psw +
  "@huutisnet.ywwxzq6.mongodb.net/?retryWrites=true&w=majority";

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

// Globaali `db` muuttuja
let db;

async function main() {
  try {
    await client.connect();
    db = client.db("sample_mflix");
    console.log("Yhteys MongoDB:hen onnistui.");

    // Käynnistää palvelimen, kun yhteys on varmistettu
    const port = 3000;
    app.listen(port, host, () => {
      console.log('Server running at http://' + host + ':' + port);
    });

    var allowCrossDomain = function (req, res, next) {
      res.header("Access-Control-Allow-Origin", "*");
      res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE");
      res.header("Access-Control-Allow-Headers", "Content-Type");

      next();
    };

    app.use(allowCrossDomain);

    // Palvele staattiset tiedostot suoraan js ja styles kansiosta
    app.use("/js", express.static(path.join(__dirname, "js")));
    app.use("/styles", express.static(path.join(__dirname, "styles")));
    app.use("/pictures", express.static(path.join(__dirname, "pictures")));

     // Määritä reitit HTML-sivuille
     app.get("/", (req, res) => {
       res.sendFile(path.join(__dirname, "index.html"));
     });
 
     app.get("/home", (req, res) => {
       res.sendFile(path.join(__dirname, "home.html"));
     });
 
     app.get("/profile", (req, res) => {
       res.sendFile(path.join(__dirname, "profile.html"));
     });

    //TÄMÄN YLÄPUOLELLE KAIKKI API PYYNNÖT

  } catch (error) {
    console.error("Virhe yhdistettäessä MongoDB:hen:", error);
  }
}

main().catch(console.error);
