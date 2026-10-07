/*------------------------------------------------------Imports------------------------------------------------------*/
// Standard
import express from "express";

// Routing
import databaseRouter_API from "./routes/api.js";

// Data interface
import { insertData, writeLog, writeDetection } from "./data_interface/control.js";

// Common Imports
import { gcsPORT } from "../../common/config.js";

import { connectMQTT, subscribeMQTT } from "../../common/mqttHandler.js";
/*------------------------------------------------------/Imports-----------------------------------------------------*/


/*------------------------------------------------------Variables------------------------------------------------------*/
// Create server object
const dbServer = express();

// Define port to be exposed
const PORT = gcsPORT;

// MQTT topics
const topic_TELEMETRY = "gcs/telemetry";
const topic_LOGS = "gcs/drone_log";
const topic_DETECTIONS = "gcs/detection";
/*------------------------------------------------------/Variables-----------------------------------------------------*/


/*------------------------------------------------------Middleware------------------------------------------------------*/
// Allows express to read json
dbServer.use(express.json());

// Server routes
dbServer.use("/api", databaseRouter_API);
/*------------------------------------------------------/Middleware-----------------------------------------------------*/


/*------------------------------------------------------MQTT------------------------------------------------------*/
// Connect to MQTT broker
const mqttClient = connectMQTT("mqtt", 1883);

// Wait for MQTT connection
mqttClient.on("connect", () => {

    /*
        Subscribe to incoming telemetry. Expect message like: {
            "timestamp": "2026-10-07T17:15:30+10:00",
            "temperature_c": 22.7,
            "pressure_hpa": 1025.6,
            "humidity_pct": 38.9,
            "light_lux": 5.2,
            "gas": {
                "co_ppm": 4.47,
                "no2_ppm": 0.15,
                "nh3_ppm": 0.84
            }
        }
    */

    subscribeMQTT(topic_TELEMETRY, async (message) => {
        try {

            console.log(`MQTT telemetry received on ${topic_TELEMETRY}:`);
            console.log(message);

            // Convert MQTT message to object
            const telemetry = JSON.parse(message);

            // Extract telemetry values
            const temp = Number(telemetry.temperature_c);
            const atmp = Number(telemetry.pressure_hpa);
            const hum = Number(telemetry.humidity_pct);
            const lux = Number(telemetry.light_lux);
            const co = Number(telemetry.gas?.co_ppm);
            const no2 = Number(telemetry.gas?.no2_ppm);
            const nh3 = Number(telemetry.gas?.nh3_ppm);
            const timestamp = telemetry.timestamp ? new Date(telemetry.timestamp) : null;

            // Validate telemetry
            if (!Number.isFinite(temp) || !Number.isFinite(atmp) || !Number.isFinite(hum) || !Number.isFinite(lux) || !Number.isFinite(co) || !Number.isFinite(no2) || !Number.isFinite(nh3) || (timestamp && Number.isNaN(timestamp.getTime()))) {

                console.error("Invalid MQTT telemetry:");
                console.error(telemetry);
                return;
            }

            // Insert telemetry into database and log
            const result = await insertData(temp, atmp, hum, lux, co, no2, nh3, timestamp);
            console.log("MQTT telemetry inserted into database");
            console.log(`Database row ID: ${result.insertId}`);
        }

        catch (error) {
            console.error("Failed to process MQTT telemetry:");
            console.error(error);
        }
    });

    // Subscribe to incoming logs
    subscribeMQTT(topic_LOGS, async (message) => {
        try {

            console.log(`MQTT log received on ${topic_LOGS}:`);
            console.log(message);

            // Convert MQTT message to object
            const log = JSON.parse(message);

            // Extract log values
            const action = String(log.action ?? "").trim();
            const content = String(log.content ?? "").trim();

            // Validate log
            if (action.length === 0 || content.length === 0) {
                console.error("Invalid MQTT log:");
                console.error(log);
                return;
            }

            // Insert log into database
            const result = await writeLog(action, content);

            console.log("MQTT log inserted into database");
            console.log(`Database row ID: ${result.insertId}`);
        }

        catch (error) {
            console.error("Failed to process MQTT log:");
            console.error(error);
        }
    });


    // Subscribe to incoming detection images
    subscribeMQTT(topic_DETECTIONS, async (message) => {
        try {
            const detection = JSON.parse(message);
            const type = String(detection.type ?? "").trim();
            const description = String(detection.description ?? "").trim();
            const timestamp = detection.timestamp ? new Date(detection.timestamp) : null;

            let imageData = String(detection.image ?? "");
            let mime = String(detection.mime ?? detection.image_mime ?? "image/jpeg").trim();
            const dataMatch = imageData.match(/^data:([^;]+);base64,(.+)$/s);
            if (dataMatch) {
                mime = dataMatch[1];
                imageData = dataMatch[2];
            }

            const image = Buffer.from(imageData, "base64");
            if (type.length === 0 || description.length === 0 || image.length === 0 || !mime.startsWith("image/") || (timestamp && Number.isNaN(timestamp.getTime()))) {
                console.error("Invalid MQTT detection image metadata");
                return;
            }

            const result = await writeDetection(type, description, mime, image, timestamp);
            console.log(`MQTT detection inserted into database: ID ${result.insertId}, ${type}, ${image.length} bytes`);
        }
        catch (error) {
            console.error("Failed to process MQTT detection:");
            console.error(error);
        }
    });
});
/*------------------------------------------------------/MQTT-----------------------------------------------------*/


/*------------------------------------------------------Debug------------------------------------------------------------*/

/*------------------------------------------------------/Debug-----------------------------------------------------------*/


/*------------------------------------------------------Deploy------------------------------------------------------*/
// Host and expose server port
dbServer.listen(PORT, () => {
    console.log(`Database Handler running on port ${PORT}: http://localhost:${PORT}/`);
});
/*------------------------------------------------------/Deploy-----------------------------------------------------*/