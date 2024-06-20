const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const path = require("path");
const jwt = require("jsonwebtoken");

const multer = require("multer");


const upload = multer(); 

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ limit: '10mb', extended: false }));

const config = require("./config.json");
const psw = config.db.password;
const usr = config.db.username;
const secretKey = config.db.secretKey;

const host = process.env.HOST || "localhost";


// MongoDB yhteys ÄLÄ KOSKE
const uri =
  "mongodb+srv://" +
  usr +
  ":" +
  psw +
  "@huutisnet.ywwxzq6.mongodb.net/?retryWrites=true&w=majority&appName=HuutisNet";

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
    db = client.db("HuutisNeT");
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

    // Rekisteröi uusi käyttäjä
    app.post("/api/register", async (req, res) => {
        const username = req.body.username;
        const email = req.body.email;
        const password = req.body.password;
        const usersCollection = db.collection("user");
        try {
          const data = {
            username: username,
            email: email,
            password: password,
            profile: {
              profilePicture: "",
              bio: "",
              location: "",
              joined: new Date(),
              postsCount: 0,
              friendsHidden: "public",
            },
          };
  
          try {
            const collection = db.collection("user");
    
            const result = await collection.insertOne(data);
            // console.log("Inserted ID: ", result.insertedId)
          } catch (error) {
            console.error("Error inserting documents:", error);
          }


          res.status(200).json({ status: "OK", message: "Insert successful!" });
        } catch (error) {
          res.status(500).json({ status: "NOT OK", error: error });
        }
      });

      app.post("/api/login", async (req, res) => {
        const { username, password } = req.body;

        const user = await db.collection("user").findOne({ username, password
        });
  
        if (user) {
          // Tässä luodaan JWT token. 'secretKey' pitäisi olla monimutkainen, ainutlaatuinen avain.
          //Tulevaisuudessa tämä pitäisi olla ympäristömuuttuja, joka ei ole kovakoodattu
          const token = jwt.sign(
            { userId: user._id, username: username },
            secretKey,
            { expiresIn: "1h" }
          );
  
          res.json({
            status: "OK",
            message: "Login successful",
            token: token, // Lähetä luotu token takaisin käyttäjälle
          });
        } else {
          res
            .status(401)
            .json({ status: "Error", message: "Invalid username or password" });
        }
      });

      app.get("/api/user", async (req, res) => {
        if (
          !req.headers.authorization ||
          !req.headers.authorization.startsWith("Bearer ")
        ) {
          return res
            .status(401)
            .json({ message: "Authorization header missing or malformed" });
        }
  
        const token = req.headers.authorization.split(" ")[1];
  
        try {
          // Yritä varmentaa token
          const decoded = jwt.verify(token, secretKey);
  
          const usersCollection = db.collection("user");
          const user = await usersCollection.findOne({
            _id: new ObjectId(decoded.userId),
          });
  
          if (!user) {
            return res.status(404).json({ message: "User not found" });
          }
  
          // Nämä tiedot lähetetään vastauksena
          const userProfile = {
            id: user._id,
            username: user.username,
            email: user.email,
          };
  
          res.status(200).json(userProfile);
        } catch (error) {
          console.error("Error:", error);
  
          // Tarkista, liittyykö virhe vanhentuneeseen tai virheelliseen tokeniin
          if (error.name === "TokenExpiredError") {
            res.status(401).json({ message: "Token expired" });
          } else if (error.name === "JsonWebTokenError") {
            res.status(401).json({ message: "Invalid token" });
          } else {
            // Muut virheet
            res.status(500).json({
              message: "Error fetching user info",
              error: error.message,
            });
          }
        }
      });

      app.post("/api/posts", upload.none(), async (req, res) => {
        try {
          const token = req.headers.authorization.split(" ")[1];
          // Tarkista token ja hae käyttäjän id tokenista
          const decoded = jwt.verify(token, secretKey);
          const userId = decoded.userId;
  
          const { kuvaus, location, startDate, endDate } = req.body;
  
          console.log("kuvaus:", kuvaus, "location:", location, "startDate:", startDate, "endDate:", endDate);
  
          // Lisää uusi postaus tietokantaan
          const newPost = {
            kuvaus, location, startDate, endDate,
            timestamp: new Date(),
          };
  
          const result = await db.collection("tapahtuma").insertOne(newPost);
  
          // Päivitä käyttäjän postsCount
          await db.collection("user").updateOne(
            { _id: new ObjectId(userId) },
            { $inc: { "profile.postsCount": 1 } }
          );
  
          res.status(201).json(result); // Palauta vastauksena luotu postaus
        } catch (error) {
          console.error("Error:", error);
          res.status(401).send("Unauthorized: Invalid token");
        }
      });






    //APIT TÄMÄN YLÄPUOLELLE

  } catch (error) {
    console.error("Virhe yhdistettäessä MongoDB:hen:", error);
  }
}

main().catch(console.error);
