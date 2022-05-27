const express = require("express");
const app = express();
const jwt = require("jsonwebtoken");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();
const port = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send(
    "Hello from gadgetly || test commit for recheck and heroku Application error solving commit. "
  );
});

function verifyJWT(req, res, next) {
  const authHeader = req?.headers?.authorization;
  if (!authHeader) {
    return res.status(401).send({ message: "Unauthorized access" });
  }
  const token = authHeader.split(" ")[1];
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).send({ message: "Forbidden access" });
    }
    req.decoded = decoded;
  });
  next();
}

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.jv7le.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});
// client.connect((err) => {
//   const collection = client.db("test").collection("devices");
//   // perform actions on the collection object
//   console.log("db connected test msgs");
//   client.close();
// });

async function run() {
  try {
    await client.connect();
    const productCollection = client.db("gadgetlydb").collection("products");
    const prDeliveredCollection = client
      .db("gadgetlydb")
      .collection("deliveredProducts");

    app.post("/login", (req, res) => {
      const user = req.body;
      const accessToken = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "1d",
      });
      res.send({ accessToken });
    });

    // code for search implement -- failed
    app.get("/product", async (req, res) => {
      const supplier = req.query.supplier;
      // const query = { supplier: supplier };
      const result = await productCollection
        .find({
          $or: [{ supplier: { $regex: `${supplier}` } }],
        })
        .toArray();
      return res.send(result);
    });

    app.get("/products", async (req, res) => {
      const query = {};
      const cursor = productCollection.find(query);
      const result = await cursor.toArray();
      res.send(result);
    });

    app.get("/product/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const product = await productCollection.findOne(query);
      res.send(product);
    });

    //==========updating delivered================
    //==========================
    app.put("/product/:id", async (req, res) => {
      const id = req.params.id;
      const updated = req.body;
      console.log("Updated quantity", updated);
      const filter = { _id: ObjectId(id) };
      const options = { upsert: true };
      const updatedDoc = {
        $set: {
          quantity: updated.quantity,
        },
      };
      const result = await productCollection.updateOne(
        filter,
        updatedDoc,
        options
      );
      res.send(result);
    });

    app.get("/delivered/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const product = await productCollection.findOne(query);
      res.send(product);
    });
    //==========updating delivered end================
    //==========================

    app.delete("/product/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await productCollection.deleteOne(query);
      res.send(result);
    });

    app.post("/product", async (req, res) => {
      const newProduct = req.body;
      console.log(newProduct);
      const result = await productCollection.insertOne(newProduct);
      res.send(result);
    });

    // my item collection
    app.get("/myproduct", verifyJWT, async (req, res) => {
      const decodedEmail = req?.decoded?.email;
      const email = req?.query?.email;
      if (email === decodedEmail) {
        const query = { email: email };
        const cursor = productCollection.find(query);
        const item = await cursor.toArray();
        res.send(item);
      } else {
        res.status(403).send({ message: "Forbidden access" });
      }
    });

    // =========================================
    // =========================================
    // This is also Working [working by email query as like top code]
    // app.get("/myproduct", verifyJWT, async (req, res) => {
    //   const email = req?.query?.email;
    //   const decodedEmail = req?.decoded?.email;
    //   if (email === decodedEmail) {
    //     const query = { email: email };
    //     const cursor = await productCollection.find(query).toArray();
    //     res.send(cursor);
    //   } else {
    //     res.status(403).send({ message: "Forbidden access" });
    //   }
    // });

    // =========================================
    // =========================================
    // This is also Working [working by email params]

    // app.get("/myproduct/:email", verifyJWT, async (req, res) => {
    //   const email = req?.params?.email;
    //   const decodedEmail = req?.decoded?.email;
    //   if (email === decodedEmail) {
    //     const query = { email: email };
    //     const result = await productCollection.find(query).toArray();

    //     res.send(result);
    //   } else {
    //     return res.status(403).send({ message: "Forbidden Access" });
    //   }
    // });

    app.delete("/myproduct/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await productCollection.deleteOne(query);
      res.send(result);
    });
  } finally {
    // await client.close();
  }
}
run().catch(console.dir);

app.listen(port, () => {
  console.log("Server running on port-", port);
});
