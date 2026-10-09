/*------------------------------------------------------Imports------------------------------------------------------*/
// Standard
import express from "express";

import { publishMQTT } from "../../../common/mqttHandler.js";
/*------------------------------------------------------/Imports-----------------------------------------------------*/


/*------------------------------------------------------Variables------------------------------------------------------*/
// Create API router
const webRouter_API = express.Router();

// Database handler address
const databaseServer = "http://gcs:3001";

// WebSocket broadcast function
let broadcastFunction = null;
/*------------------------------------------------------/Variables-----------------------------------------------------*/


/*------------------------------------------------------Telemetry------------------------------------------------------*/

// Get telemetry data
webRouter_API.get("/telemetry", async (req, res) => {
    try {

        const time = req.query.time;
        const unit = req.query.unit;

        // Validate request parameters
        if (!time || !unit) {
            return res.status(400).json({
                success: false,
                error: "Time and unit are required"
            });
        }

        // Create database handler URL
        const requestURL =
            `${databaseServer}/api/telemetry` +
            `?time=${encodeURIComponent(time)}` +
            `&unit=${encodeURIComponent(unit)}`;

        // Request telemetry
        const response = await fetch(requestURL);
        const responseText = await response.text();

        let data;

        try {
            data = JSON.parse(responseText);
        }

        catch (error) {
            return res.status(502).json({
                success: false,
                error: "Database handler returned a non-JSON response",
                response: responseText
            });
        }

        // Database handler returned an error
        if (!response.ok) {
            return res.status(response.status).json(data);
        }

        return res.json(data);
    }

    catch (error) {
        console.error("Telemetry request failed:");
        console.error(error);

        return res.status(500).json({
            success: false,
            error: "Database handler unavailable"
        });
    }
});


// Get complete telemetry history
webRouter_API.get("/history", async (req, res) => {
    try {

        const response = await fetch(`${databaseServer}/api/history`);
        const data = await response.json();

        return res.status(response.status).json(data);
    }

    catch (error) {
        console.error("Telemetry history request failed:");
        console.error(error);

        return res.status(500).json({
            success: false,
            error: "Database handler unavailable"
        });
    }
});

/*------------------------------------------------------/Telemetry-----------------------------------------------------*/


/*------------------------------------------------------Logs------------------------------------------------------*/

// Get recent logs
webRouter_API.get("/logs", async (req, res) => {
    try {

        const limit = req.query.limit ?? 50;

        // Create database handler URL
        const requestURL =
            `${databaseServer}/api/logs` +
            `?limit=${encodeURIComponent(limit)}`;

        // Request logs
        const response = await fetch(requestURL);
        const responseText = await response.text();

        let data;

        try {
            data = JSON.parse(responseText);
        }

        catch (error) {
            return res.status(502).json({
                success: false,
                error: "Database handler returned a non-JSON response",
                response: responseText
            });
        }

        // Database handler returned an error
        if (!response.ok) {
            return res.status(response.status).json(data);
        }

        return res.json(data);
    }

    catch (error) {
        console.error("Log request failed:");
        console.error(error);

        return res.status(500).json({
            success: false,
            error: "Database handler unavailable"
        });
    }
});


// Get complete log history
webRouter_API.get("/logs/all", async (req, res) => {
    try {

        const response = await fetch(`${databaseServer}/api/logs/all`);
        const data = await response.json();

        return res.status(response.status).json(data);
    }

    catch (error) {
        console.error("Extended log request failed:");
        console.error(error);

        return res.status(500).json({
            success: false,
            error: "Database handler unavailable"
        });
    }
});

/*------------------------------------------------------/Logs-----------------------------------------------------*/


/*------------------------------------------------------Live_Telemetry------------------------------------------------------*/

// Receive new telemetry from database handler
webRouter_API.post("/live/telemetry", (req, res) => {

    if (broadcastFunction) {
        broadcastFunction({
            type: "telemetry",
            data: req.body
        });
    }

    return res.json({
        success: true
    });
});

/*------------------------------------------------------/Live_Telemetry-----------------------------------------------------*/


/*------------------------------------------------------Live_Log------------------------------------------------------*/

// Receive new log from database handler
webRouter_API.post("/live/log", (req, res) => {

    if (broadcastFunction) {
        broadcastFunction({
            type: "log",
            data: req.body
        });
    }

    return res.json({
        success: true
    });
});

/*------------------------------------------------------/Live_Log-----------------------------------------------------*/




/*------------------------------------------------------Detections------------------------------------------------------*/

webRouter_API.get("/detections", async (req, res) => {
    try {
        const limit = req.query.limit ?? 6;
        const response = await fetch(`${databaseServer}/api/detections?limit=${encodeURIComponent(limit)}`);
        const data = await response.json();
        res.setHeader("Cache-Control", "no-store");
        return res.status(response.status).json(data);
    }
    catch (error) {
        console.error("Detection request failed:");
        console.error(error);
        return res.status(500).json({ success: false, error: "Database handler unavailable" });
    }
});

webRouter_API.get("/detections/all", async (req, res) => {
    try {
        const response = await fetch(`${databaseServer}/api/detections/all`);
        const data = await response.json();
        return res.status(response.status).json(data);
    }
    catch (error) {
        console.error("Detection history request failed:");
        console.error(error);
        return res.status(500).json({ success: false, error: "Database handler unavailable" });
    }
});

webRouter_API.get("/detections/:id/image", async (req, res) => {
    try {
        const response = await fetch(`${databaseServer}/api/detections/${encodeURIComponent(req.params.id)}/image`);
        if (!response.ok) return res.status(response.status).send(await response.text());

        res.set("Content-Type", response.headers.get("content-type") || "image/jpeg");
        res.setHeader("Cache-Control", "no-store");
        const image = Buffer.from(await response.arrayBuffer());
        return res.send(image);
    }
    catch (error) {
        console.error("Detection image request failed:");
        console.error(error);
        return res.status(500).send("Database handler unavailable");
    }
});

webRouter_API.post("/live/detection", (req, res) => {
    if (broadcastFunction) broadcastFunction({ type: "detection", data: req.body });
    return res.json({ success: true });
});

/*------------------------------------------------------/Detections-----------------------------------------------------*/


/*------------------------------------------------------Debug_Status------------------------------------------------------*/

// Check database handler connection
webRouter_API.get("/debug/status", async (req, res) => {
    try {

        const response = await fetch(
            `${databaseServer}/api/debug/status`
        );

        const responseText = await response.text();

        let data;

        try {
            data = JSON.parse(responseText);
        }

        catch (error) {
            return res.status(502).json({
                success: false,
                error: "Database handler returned a non-JSON response",
                response: responseText
            });
        }

        return res.status(response.status).json(data);
    }

    catch (error) {
        console.error("Debug status request failed:");
        console.error(error);

        return res.status(503).json({
            success: false,
            error: "Database handler unavailable"
        });
    }
});

/*------------------------------------------------------/Debug_Status-----------------------------------------------------*/


/*------------------------------------------------------Debug_Telemetry------------------------------------------------------*/

// Manually write telemetry
webRouter_API.post("/debug/telemetry", async (req, res) => {
    try {

        const response = await fetch(
            `${databaseServer}/api/debug/telemetry`,
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify(req.body)
            }
        );

        const responseText = await response.text();

        let data;

        try {
            data = JSON.parse(responseText);
        }

        catch (error) {
            return res.status(502).json({
                success: false,
                error: "Database handler returned a non-JSON response",
                response: responseText
            });
        }

        return res.status(response.status).json(data);
    }

    catch (error) {
        console.error("Debug telemetry request failed:");
        console.error(error);

        return res.status(500).json({
            success: false,
            error: "Database handler unavailable"
        });
    }
});

/*------------------------------------------------------/Debug_Telemetry-----------------------------------------------------*/


/*------------------------------------------------------Debug_Log------------------------------------------------------*/

// Manually write log
webRouter_API.post("/debug/log", async (req, res) => {
    try {

        const response = await fetch(
            `${databaseServer}/api/debug/log`,
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify(req.body)
            }
        );

        const responseText = await response.text();

        let data;

        try {
            data = JSON.parse(responseText);
        }

        catch (error) {
            return res.status(502).json({
                success: false,
                error: "Database handler returned a non-JSON response",
                response: responseText
            });
        }

        return res.status(response.status).json(data);
    }

    catch (error) {
        console.error("Debug log request failed:");
        console.error(error);

        return res.status(500).json({
            success: false,
            error: "Database handler unavailable"
        });
    }
});

/*------------------------------------------------------/Debug_Log-----------------------------------------------------*/


/*------------------------------------------------------LCD_Control------------------------------------------------------*/
webRouter_API.post("/display/mode", (req, res) => {
    try {
        const { mode } = req.body;
        const validModes = ["temp", "atmp", "hum", "lux", "gas"];

        if (!validModes.includes(mode)) {
            return res.status(400).json({ success: false, error: "Invalid LCD mode" });
        }

        publishMQTT("gcs/aq/display/set", { mode }, { qos: 1, retain: true });
        return res.json({ success: true, mode });
    }
    catch (error) {
        console.error("LCD mode publish failed:", error);
        return res.status(500).json({ success: false, error: "Failed to publish LCD mode" });
    }
});
/*------------------------------------------------------/LCD_Control-----------------------------------------------------*/

/*------------------------------------------------------Helper_Functions------------------------------------------------------*/

// Give API router access to WebSocket broadcast
function setBroadcastFunction(broadcast) {
    broadcastFunction = broadcast;
}

/*------------------------------------------------------/Helper_Functions-----------------------------------------------------*/


/*------------------------------------------------------Exports------------------------------------------------------*/
export { setBroadcastFunction };

export default webRouter_API;
/*------------------------------------------------------/Exports-----------------------------------------------------*/