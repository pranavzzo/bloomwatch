// server.js
const express = require("express");
const cors = require("cors");
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// --- HELPER FUNCTIONS ---

/**
 * Generates a random floating-point number between a specified minimum and maximum value.
 * @param {number} min - The minimum value (inclusive).
 * @param {number} max - The maximum value (exclusive).
 * @returns {number} A random float.
 */
function getRandomFloat(min, max) {
    return Math.random() * (max - min) + min;
}

/**
 * Generates a random integer between a specified minimum and maximum value.
 * @param {number} min - The minimum value (inclusive).
 * @param {number} max - The maximum value (inclusive).
 * @returns {number} A random integer.
 */
function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// --- DATA GENERATION LOGIC ---

/**
 * Generates simulated bloom phenology data as a GeoJSON FeatureCollection.
 * This version uses the location and date range to create more realistic data.
 * @param {number} lat - The latitude of the center point.
 * @param {number} lon - The longitude of the center point.
 * @param {number} radius - The half-width/height of the data generation area.
 * @param {string} startDateStr - The start date string (e.g., "2025-03-01").
 * @param {string} endDateStr - The end date string (e.g., "2025-05-31").
 * @returns {object} A GeoJSON FeatureCollection object.
 */
function generateBloomData(lat, lon, radius, startDateStr, endDateStr) {
    const features = [];
    // Prevent excessive points from being generated on a bad request
    const numberOfPoints = getRandomInt(150, 350);

    const minLat = lat - radius;
    const maxLat = lat + radius;
    const minLon = lon - radius;
    const maxLon = lon + radius;

    // *** NEW: Use dates to make data more relevant ***
    const startDate = new Date(startDateStr);
    const endDate = new Date(endDateStr);

    for (let i = 0; i < numberOfPoints; i++) {
        const pointLat = getRandomFloat(minLat, maxLat);
        const pointLon = getRandomFloat(minLon, maxLon);

        // *** NEW: Generate a random date for each point WITHIN the user's selected range ***
        const randomTimestamp = getRandomInt(startDate.getTime(), endDate.getTime());
        const randomDate = new Date(randomTimestamp);

        // *** NEW: Make intensity more realistic based on location ***
        // Let's simulate that blooms are more intense closer to the equator.
        const latitudeFactor = (90 - Math.abs(pointLat)) / 90; // Value from 0 (poles) to 1 (equator)
        const intensity = Math.random() * latitudeFactor; // Intensity is now biased by latitude

        const feature = {
            type: "Feature",
            geometry: {
                type: "Point",
                coordinates: [pointLon, pointLat]
            },
            properties: {
                intensity: intensity,
                trend: ["earlier", "stable", "later"][getRandomInt(0, 2)],
                prediction: ["significant", "moderate", "slight", "no_change"][getRandomInt(0, 3)],
                // Use the new dynamic date
                date: randomDate.toISOString().split('T')[0], // Format as YYYY-MM-DD
            },
        };
        features.push(feature);
    }
    return { type: "FeatureCollection", features };
}


// --- API ROUTES ---

app.get("/api/bloom-data", (req, res) => {
    // Destructure all expected query parameters
    const { lat, lon, radius, startDate, endDate } = req.query;

    // --- NEW: Enhanced Validation ---
    if (!lat || !lon || !radius || !startDate || !endDate) {
        return res.status(400).json({
            error: "Missing required query parameters. Required: lat, lon, radius, startDate, endDate."
        });
    }

    const latNum = parseFloat(lat);
    const lonNum = parseFloat(lon);
    const radiusNum = parseFloat(radius);

    // Check if conversion resulted in valid numbers
    if (isNaN(latNum) || isNaN(lonNum) || isNaN(radiusNum)) {
         return res.status(400).json({ error: "Invalid geographic parameters. lat, lon, and radius must be numbers." });
    }

    // --- NEW: Better Logging for Debugging ---
    console.log(`✅ Received data request:`);
    console.log(`  -> Center: [${latNum.toFixed(4)}, ${lonNum.toFixed(4)}]`);
    console.log(`  -> Radius: ${radiusNum.toFixed(4)} degrees`);
    console.log(`  -> Dates: ${startDate} to ${endDate}`);


    // Generate data using the new function signature
    const data = generateBloomData(latNum, lonNum, radiusNum, startDate, endDate);
    res.json(data);
});

app.listen(PORT, () => console.log(`✅ Backend server is running at http://localhost:${PORT}`));
