/*------------------------------------------------------Imports------------------------------------------------------*/
// Standard
import express from "express";

// Database interface
import { insertData, writeLog } from "../data_interface/control.js";
import { getDataSince, getRecentLogs, getAllTelemetry, getAllLogs, getDetections, getDetectionImage } from "../data_interface/diagnostic.js";
/*------------------------------------------------------/Imports-----------------------------------------------------*/


/*------------------------------------------------------Variables------------------------------------------------------*/
// Create API router
const databaseRouter_API = express.Router();
/*------------------------------------------------------/Variables-----------------------------------------------------*/


/*------------------------------------------------------Telemetry------------------------------------------------------*/

// Get telemetry data
databaseRouter_API.get("/telemetry", async (req, res) => {
    try {

        const time = Number(req.query.time);
        const unit = String(req.query.unit).toUpperCase();

        // Validate time
        if (!Number.isFinite(time) || time <= 0) {
            return res.status(400).json({
                success: false,
                error: "Invalid time value"
            });
        }

        // Get telemetry data
        const data = await getDataSince(time, unit);

        return res.json({
            success: true,
            count: data.length,
            data: data
        });
    }

    catch (error) {
        console.error("Failed to get telemetry:");
        console.error(error);

        return res.status(500).json({
            success: false,
            error: error.message
        });
    }
});


// Get complete telemetry history
databaseRouter_API.get("/history", async (req, res) => {
    try {

        const data = await getAllTelemetry();

        return res.json({
            success: true,
            count: data.length,
            data: data
        });
    }

    catch (error) {
        console.error("Failed to get telemetry history:");
        console.error(error);

        return res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/*------------------------------------------------------/Telemetry-----------------------------------------------------*/


/*------------------------------------------------------Logs------------------------------------------------------*/

// Get recent logs
databaseRouter_API.get("/logs", async (req, res) => {
    try {

        const limit = Number(req.query.limit ?? 50);

        // Validate limit
        if (!Number.isInteger(limit) || limit <= 0) {
            return res.status(400).json({
                success: false,
                error: "Invalid log limit"
            });
        }

        // Get recent logs
        const data = await getRecentLogs(limit);

        return res.json({
            success: true,
            count: data.length,
            data: data
        });
    }

    catch (error) {
        console.error("Failed to get logs:");
        console.error(error);

        return res.status(500).json({
            success: false,
            error: error.message
        });
    }
});


// Get complete log history
databaseRouter_API.get("/logs/all", async (req, res) => {
    try {

        const data = await getAllLogs();

        return res.json({
            success: true,
            count: data.length,
            data: data
        });
    }

    catch (error) {
        console.error("Failed to get complete logs:");
        console.error(error);

        return res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/*------------------------------------------------------/Logs-----------------------------------------------------*/




/*------------------------------------------------------Detections------------------------------------------------------*/

// Get recent detection metadata
databaseRouter_API.get("/detections", async (req, res) => {
    try {
        const data = await getDetections(req.query.limit ?? 6);
        res.setHeader("Cache-Control", "no-store");
        return res.json({ success: true, count: data.length, data: data });
    }
    catch (error) {
        console.error("Failed to get detections:");
        console.error(error);
        return res.status(500).json({ success: false, error: error.message });
    }
});

// Get complete detection metadata history
databaseRouter_API.get("/detections/all", async (req, res) => {
    try {
        const data = await getDetections();
        return res.json({ success: true, count: data.length, data: data });
    }
    catch (error) {
        console.error("Failed to get detection history:");
        console.error(error);
        return res.status(500).json({ success: false, error: error.message });
    }
});

// Get stored image bytes
databaseRouter_API.get("/detections/:id/image", async (req, res) => {
    try {
        const id = Number(req.params.id);
        if (!Number.isInteger(id) || id <= 0) return res.status(400).send("Invalid detection ID");

        const detection = await getDetectionImage(id);
        if (!detection) return res.status(404).send("Detection image not found");

        res.set("Content-Type", detection.image_mime || "image/jpeg");
        res.setHeader("Cache-Control", "no-store");
        return res.send(detection.image);
    }
    catch (error) {
        console.error("Failed to get detection image:");
        console.error(error);
        return res.status(500).send("Failed to get detection image");
    }
});

/*------------------------------------------------------/Detections-----------------------------------------------------*/


/*------------------------------------------------------Debug_Status------------------------------------------------------*/

// Check database handler
databaseRouter_API.get("/debug/status", (req, res) => {

    return res.json({
        success: true,
        status: "online"
    });
});

/*------------------------------------------------------/Debug_Status-----------------------------------------------------*/


/*------------------------------------------------------Debug_Telemetry------------------------------------------------------*/

// Manually insert telemetry
databaseRouter_API.post("/debug/telemetry", async (req, res) => {
    try {

        const { temp, atmp, hum, lux, co, no2, nh3 } = req.body;

        // Convert values
        const TEMP = Number(temp);
        const ATMP = Number(atmp);
        const HUM = Number(hum);
        const LUX = Number(lux);
        const CO = Number(co);
        const NO2 = Number(no2);
        const NH3 = Number(nh3);

        // Validate values
        const values = [TEMP, ATMP, HUM, LUX, CO, NO2, NH3];

        if (values.some((value) => !Number.isFinite(value))) {
            return res.status(400).json({
                success: false,
                error: "All telemetry values must be valid numbers"
            });
        }

        // Insert telemetry
        const result = await insertData(TEMP, ATMP, HUM, LUX, CO, NO2, NH3);

        console.log("Manual telemetry inserted:");
        console.log({
            TEMP,
            ATMP,
            HUM,
            LUX,
            CO,
            NO2,
            NH3
        });

        return res.status(201).json({
            success: true,
            message: "Telemetry inserted",
            id: result.insertId
        });
    }

    catch (error) {
        console.error("Manual telemetry insert failed:");
        console.error(error);

        return res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/*------------------------------------------------------/Debug_Telemetry-----------------------------------------------------*/


/*------------------------------------------------------Debug_Log------------------------------------------------------*/

// Manually insert log
databaseRouter_API.post("/debug/log", async (req, res) => {
    try {

        const action = String(req.body.action ?? "").trim();
        const description = String(req.body.description ?? "").trim();

        // Validate log
        if (action.length === 0 || description.length === 0) {
            return res.status(400).json({
                success: false,
                error: "Action and description are required"
            });
        }

        // Insert log
        const result = await writeLog(action, description);

        console.log("Manual log inserted:");
        console.log({
            action,
            description
        });

        return res.status(201).json({
            success: true,
            message: "Log inserted",
            id: result.insertId
        });
    }

    catch (error) {
        console.error("Manual log insert failed:");
        console.error(error);

        return res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/*------------------------------------------------------/Debug_Log-----------------------------------------------------*/


/*------------------------------------------------------Exports------------------------------------------------------*/
export default databaseRouter_API;
/*------------------------------------------------------/Exports-----------------------------------------------------*/