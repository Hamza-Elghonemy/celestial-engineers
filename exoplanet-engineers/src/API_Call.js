// Function to query the GAIA API
async function queryGaiaApi(ra, dec, radius) {
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
        
        // Debugging output
        console.log("Response JSON:", data);
        if (data.data && Array.isArray(data.data)) {
            return data.data.map(item => ({
                source_id: item[0],
                ra: item[1],
                dec: item[2],
                phot_g_mean_mag: item[3]
            }));
        } else {
            console.error("Error: Unexpected response format");
            return null;
        }
    } else {
        console.error("HTTP error:", response.status);
        throw new Error("Failed to fetch data from GAIA API");
    }
}


// Example usage
const ra = 289.2175;  // Right Ascension in degrees
const dec = 47.8845;  // Declination in degrees
const radius = 0.1;    // Radius in degrees

queryGaiaApi(ra, dec, radius)
    .catch(err => console.error(err));
