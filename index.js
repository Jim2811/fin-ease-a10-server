const express = require("express");
const cors = require("cors");
const app = express();
const port = process.env.PORT || 3000;
const dotenv = require("dotenv");
dotenv.config();

const { MongoClient, ServerApiVersion } = require("mongodb");
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

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const db = client.db("FinEase");
    const myTransactionsCol = db.collection("transactions");
    // Transaction API
    app.get("/transactions", async (req, res) => {
      const result = await myTransactionsCol.find().toArray();
      res.send(result);
    });
    // post api
    app.post("/transactions", async (req, res) => {
      const data = req.body
      console.log(data);
      const result = await myTransactionsCol.insertOne(data)
      res.send({
        success: true,
        result
      });
    });

    await client.db("admin").command({ ping: 1 });
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
