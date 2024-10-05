const express = require('express');
const { MongoClient } = require('mongodb');
const axios = require('axios');
const cors = require('cors');

const app = express();
const port = 3000;

const url = 'mongodb+srv://abdallahahmadaref:xmcdf4rw36GsOmvb@clustertexteditor.ehw7q1t.mongodb.net';
const client = new MongoClient(url);

app.use(cors({
  origin: 'http://localhost:5173' // Your frontend URL
}));

app.post('/proxy/gaia', (req, res) => {
  try {
    console.log('Request:', req.body);
      const { ra, dec, radius } = req.body;
      const url = "https://gea.esac.esa.int/tap-server/tap/sync";
      
      const query = `
      SELECT TOP 50000
        source_id, ra, dec, phot_g_mean_mag
    FROM gaiadr3.gaia_source
    WHERE 1=CONTAINS(
        POINT('ICRS', ra, dec),
        CIRCLE('ICRS', ${ra}, ${dec}, ${radius})
    )
      `;

      axios.post(url, 
        new URLSearchParams({
            "REQUEST": "doQuery",
            "LANG": "ADQL",
            "FORMAT": "json",
            "QUERY": query
        }).toString(),
        {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        }
    ).then(response => {response.json();}).then(data => {
      res.json(data)});
  } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ error: 'Failed to fetch data' });
  }
});

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