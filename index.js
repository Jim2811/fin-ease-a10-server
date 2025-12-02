const express = require("express");
const cors = require("cors");
const app = express();
const port = process.env.PORT || 3000;
const dotenv = require("dotenv");
const admin = require('firebase-admin')
const serviceAccount = require('./serviceKey.json')
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

dotenv.config();

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
const sdkMiddleware = async (req, res, next) =>{
  const authorization = req.headers.authorization;
  if(!authorization){
      return res.status(401).send({message: "Unauthorized access!"})
  }
  const token = authorization.split(' ')[1]
  try{
    await admin.auth().verifyIdToken(token)
    next()
  }catch{
    return res.status(401).send({message: "Unauthorized access!"})
  }
}

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const db = client.db("FinEase");
    const myTransactionsCol = db.collection("transactions");
    // Transaction API
    app.get("/transactions", async (req, res) => {
      const mail = req.query.email
      const result = await myTransactionsCol.find({email: mail}).toArray();
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

    // single Transaction Detail api
    app.get('/transactions/:id', async (req, res) =>{
      const {id} = req.params;
      const objectId = new ObjectId(id);
      const result = await myTransactionsCol.findOne({_id: objectId});
      res.send({
        result
      })
    })

    // total price in category api
    app.get('/category-total-amount', async (req, res)=>{
      const category = req.query.category;
      const result = await myTransactionsCol.aggregate([
        {
          $match: { category: category }
        },
        {
          $group: {
            _id: "$category",
            total: {$sum: "$amount"}
          }
        }
      ]).toArray();
      res.send(result)
    })

    // Update Request API
    app.put('/transactions/:id', async (req, res)=>{
      const {id} = req.params;
      const data = req.body;
      const objectId = new ObjectId(id);
      const filter = {_id: objectId};
      const update = {
        $set: data
      }
      const result = await myTransactionsCol.updateOne(filter, update)

      res.send({
        success: true,
        result
      })
    })

    // delete request api
    app.delete('/transactions/:id', async (req, res)=>{
      const {id} = req.params;
      const objectId = new ObjectId(id);
      const filter = {_id: objectId};
      const result = await myTransactionsCol.deleteOne(filter)

      res.send({
        success: true,
        result
      })
    })
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
