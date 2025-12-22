const express = require("express");
const cors = require("cors");
const app = express();
const port = process.env.PORT || 3000;
const dotenv = require("dotenv");
dotenv.config();
const admin = require("firebase-admin");
const decoded = Buffer.from(process.env.FB_SERVICE_KEY, "base64").toString(
  "utf8"
);
const serviceAccount = JSON.parse(decoded);
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const uri = `mongodb+srv://FinEase:${process.env.MongoDb_pass}@cluster0.we4ne2s.mongodb.net/?appName=Cluster0`;
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

app.use(cors());
app.use(express.json());
/*
FinEase
*/
app.get("/", (req, res) => {
  res.send("FinEase Server is running");
});

// sdk middleware
app.delete("/transactions/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const objectId = new ObjectId(id);
    const filter = { _id: objectId };
    const transaction = await myTransactionsCol.findOne(filter);
    if (!transaction) {
      return res.status(404).send({ message: "Transaction not found" });
    }
    const result = await myTransactionsCol.deleteOne(filter);

    res.send({
      success: true,
      result,
    });
  } catch (err) {
    console.error("Delete error:", err);
    res.status(500).send({ message: "Server error while deleting transaction" });
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const db = client.db("FinEase");
    const myTransactionsCol = db.collection("transactions");
    // Transaction API
    app.get("/transactions", async (req, res) => {
      const mail = req.query.email;
      const result = await myTransactionsCol
        .find({ email: mail })
        .sort({
          date: -1,
          amount: -1,
        })
        .toArray();
      res.send(result);
    });
    // post api
    app.post("/transactions", async (req, res) => {
      const data = req.body;
      const result = await myTransactionsCol.insertOne(data);
      res.send({
        success: true,
        result,
      });
    });

    // single Transaction Detail api
    app.get("/transactions/:id", sdkMiddleware, async (req, res) => {
      const userEmail = req.user.email;
      const { id } = req.params;
      const objectId = new ObjectId(id);

      const result = await myTransactionsCol.findOne({ _id: objectId });
      if (!result)
        return res.status(404).send({ message: "Transaction not found" });

      if (userEmail !== result.email) {
        return res.status(401).send({ message: "Unauthorized access!" });
      }
      res.send({ result });
    });

    // Update Request API
    app.put("/transactions/:id", sdkMiddleware, async (req, res) => {
      const { id } = req.params;
      const userEmail = req.user.email;
      const data = req.body;
      const objectId = new ObjectId(id);
      const filter = { _id: objectId };

      const transaction = await myTransactionsCol.findOne({ _id: objectId });
      if (!transaction)
        return res.status(404).send({ message: "Transaction not found" });

      if (userEmail !== transaction.email) {
        return res.status(401).send({ message: "Unauthorized access!" });
      }

      const update = { $set: data };
      const result = await myTransactionsCol.updateOne(filter, update);
      res.send({ success: true, result });
    });

    // delete request api
    app.delete("/transactions/:id", sdkMiddleware, async (req, res) => {
      const { id } = req.params;
      const userEmail = req.user.email;
      const objectId = new ObjectId(id);
      const filter = { _id: objectId };
      const transaction = await myTransactionsCol.findOne({ _id: objectId });
      if (!transaction)
        return res.status(404).send({ message: "Transaction not found" });

      if (userEmail !== transaction.email) {
        return res.status(401).send({ message: "Unauthorized access!" });
      }
      const result = await myTransactionsCol.deleteOne(filter);

      res.send({
        success: true,
        result,
      });
    });

    // await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.listen(port, () => {
  console.log(`FinEase Server listening on port ${port}`);
});
