const express = require('express');
const fetch = require('node-fetch');
const app = express();

app.get('/gaia-data', async (req, res) => {
    const { ra, dec, radius } = req.query;
    const url = "https://gea.esac.esa.int/tap-server/tap/sync";
    
    const query = `
    SELECT TOP 1000
        source_id, ra, dec, phot_g_mean_mag
    FROM gaiadr3.gaia_source
    WHERE 1=CONTAINS(
        POINT('ICRS', ra, dec),
        CIRCLE('ICRS', ${ra}, ${dec}, ${radius})
    )
    `;

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: new URLSearchParams({
                "REQUEST": "doQuery",
                "LANG": "ADQL",
                "FORMAT": "json",
                "QUERY": query
            })
        });

        if (response.ok) {
            const data = await response.json();
            res.json(data);
        } else {
            res.status(response.status).json({ error: "Failed to fetch data from GAIA API" });
        }
    } catch (error) {
        res.status(500).json({ error: "Server error" });
    }
});

app.listen(3000, () => console.log('Server running on port 3000'));