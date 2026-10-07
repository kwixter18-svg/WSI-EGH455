/*------------------------------------------------------Imports------------------------------------------------------*/
// Database objects
import { db, dataTables } from "../database.js";
/*------------------------------------------------------/Imports-----------------------------------------------------*/


/*------------------------------------------------------Variables------------------------------------------------------*/
// Allowed telemetry time units
const timeUnits = Object.freeze(
    ["SECOND", "MINUTE", "HOUR"]
);
/*------------------------------------------------------/Variables-----------------------------------------------------*/


/*------------------------------------------------------Helper_Functions------------------------------------------------------*/

// Get telemetry since selected time
async function getDataSince(time, unit) {

    if (!timeUnits.includes(unit)) {
        throw new Error("Invalid time unit");
    }

    const [data] = await db.query(
        `SELECT *
        FROM ${dataTables.telemetry}
        WHERE time_logged >= NOW() - INTERVAL ? ${unit}
        ORDER BY time_logged ASC`,
        [time]
    );

    return data;
}



// Get most recent logs
async function getRecentLogs(limit) {

    // Limit number of returned logs
    const logLimit = Math.min(
        Math.max(Number(limit), 1),
        100
    );

    const [data] = await db.query(
        `SELECT *
        FROM ${dataTables.log}
        ORDER BY time_logged DESC
        LIMIT ?`,
        [logLimit]
    );

    // Return oldest to newest
    return data.reverse();
}



// Get all telemetry entries
async function getAllTelemetry() {

    const [data] = await db.query(
        `SELECT *
        FROM ${dataTables.telemetry}
        ORDER BY id DESC`
    );

    return data;
}



// Get all log entries
async function getAllLogs() {

    const [data] = await db.query(
        `SELECT *
        FROM ${dataTables.log}
        ORDER BY id DESC`
    );

    return data;
}



// Get detection image metadata
async function getDetections(limit = null) {
    if (limit == null) {
        const [data] = await db.query(
            `SELECT id, image_type, description, image_mime, time_logged
            FROM ${dataTables.detection}
            ORDER BY id DESC`
        );
        return data;
    }

    const imageLimit = Math.min(Math.max(Number(limit) || 6, 1), 100);
    const [data] = await db.query(
        `SELECT id, image_type, description, image_mime, time_logged
        FROM ${dataTables.detection}
        ORDER BY id DESC
        LIMIT ?`,
        [imageLimit]
    );
    return data;
}

// Get one detection image
async function getDetectionImage(id) {
    const [data] = await db.query(
        `SELECT image_mime, image
        FROM ${dataTables.detection}
        WHERE id = ?`,
        [id]
    );
    return data[0] ?? null;
}

/*------------------------------------------------------/Helper_Functions-----------------------------------------------------*/


/*------------------------------------------------------Exports------------------------------------------------------*/

// Telemetry
export { getDataSince, getAllTelemetry };


// Logs
export { getRecentLogs, getAllLogs };

// Detection images
export { getDetections, getDetectionImage };

/*------------------------------------------------------/Exports-----------------------------------------------------*/