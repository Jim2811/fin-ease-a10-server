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
const sdkMiddleware = async (req, res, next) => {
  const authorization = req.headers.authorization;
  if (!authorization) {
    return res.status(401).send({ message: "Unauthorized access!" });
  }
  const token = authorization.split(" ")[1];
  try {
    const decode = await admin.auth().verifyIdToken(token);
    req.user = decode;
    next();
  } catch {
    return res.status(401).send({ message: "Unauthorized access!" });
  }
};

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();

    const db = client.db("FinEase");
    const myTransactionsCol = db.collection("transactions");
    const reviewCollection = db.collection("reviews");
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
    // category total
    app.get("/category-total-amount", sdkMiddleware, async (req, res) => {
      const category = req.query.category;
      const userEmail = req.user.email;
      const result = await myTransactionsCol
        .aggregate([
          {
            $match: {
              category: category,
              email: userEmail,
            },
          },
          {
            $group: {
              _id: "$category",
              total: { $sum: "$amount" },
            },
          },
        ])
        .toArray();
      res.send(result);
    });

    // review
    app.post("/reviews", sdkMiddleware, async (req, res) => {
  try {
    const review = req.body;
    const existingReview = await reviewCollection.findOne({ email: review.email });
    if (existingReview) {
      return res
        .status(400)
        .send({ success: false, message: "You have already submitted a review." });
    }
    const result = await reviewCollection.insertOne(review);
    res.send({ success: true, insertedId: result.insertedId });
  } catch (error) {
    res.status(500).send({ success: false, message: error.message });
  }
});

     app.get("/reviews", async (req, res) => {
      const cursor = reviewCollection.find({}).sort({ date: -1 }).limit(8);
      const reviews = await cursor.toArray();
      res.send(reviews);
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
