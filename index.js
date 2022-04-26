const express = require("express");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const jwt = require("jsonwebtoken");
const cors = require("cors");
require("dotenv").config();
const port = process.env.PORT || 5000;
const app = express();

// madlewere
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.tnqyk.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});
async function run() {
  try {
    await client.connect();
    const geniusCollection = client.db("geniusCar").collection("service");
    const orderCollection = client.db("geniusCar").collection("order");
    //
    function verifyJWT(req, res, next) {
      const authHeader = req.headers.authorization;
      if (!authHeader) {
        return res.status(401).send({ message: "unauthorized access" });
      }
      const token = authHeader.split(" ")[1];
      jwt.verify(token, process.env.ACCESS_TOKEN, (err, decoded) => {
        if (err) {
          return res.status(403).send({ message: "Forbidden access" });
        }
        req.decoded = decoded;
        next();
      });
    }
    // AUTH
    app.post("/login", async (req, res) => {
      const user = req.body;
      const assessToken = jwt.sign(user, process.env.ACCESS_TOKEN, {
        expiresIn: "1d",
      });
      res.send({ assessToken });
    });

    // SERVER

    app.get("/service", async (req, res) => {
      const query = {};
      const cursor = geniusCollection.find(query);
      const services = await cursor.toArray();
      res.send(services);
    });

    // add user
    app.post("/service", async (req, res) => {
      const query = req.body;
      const service = await geniusCollection.insertOne(query);
      res.send(service);
    });

    app.get("/service/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const service = await geniusCollection.findOne(query);
      res.send(service);
    });

    // Delete
    app.delete("/service/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await geniusCollection.deleteOne(query);
      res.send(result);
    });
    // order function
    app.get("/order", verifyJWT, async (req, res) => {
      const decoded = req.decoded.email;
      const email = req.query.email;
      if (decoded == email) {
        const query = { email: email };
        const cursor = orderCollection.find(query);
        const result = await cursor.toArray();
        res.send(result);
      } else {
        return res.status(403).send({ message: "Forbidden access" });
      }
    });

    app.post("/order", async (req, res) => {
      const query = req.body;
      const service = await orderCollection.insertOne(query);
      res.send(service);
    });
  } finally {
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Hello World");
});
app.listen(port, (req, res) => {
  console.log("Listen to port", port);
});
