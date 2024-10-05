const express = require('express');
const { MongoClient } = require('mongodb');
const cors = require('cors');

const app = express();
const port = 3000;

const url = 'mongodb+srv://abdallahahmadaref:xmcdf4rw36GsOmvb@clustertexteditor.ehw7q1t.mongodb.net';
const client = new MongoClient(url);

app.use(cors());

async function connectToMongo() {
  try {
    await client.connect();
    console.log("Connected to MongoDB");
    const database = client.db('celestial-engineers'); // Replace with your database name
    const collection = database.collection('exoplanetsDB'); // Replace with your collection name
    const documents = await collection.find({}).sort({ _id: -1 }).limit(100).toArray(); // Sort by _id in descending order and limit to 100
    return documents;
  } catch (error) {
    console.error(error);
  } finally {
    await client.close();
  }
}

app.get('/data', async (req, res) => {
  const documents = await connectToMongo();
  res.json(documents);
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});