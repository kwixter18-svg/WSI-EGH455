/*------------------------------------------------------Imports------------------------------------------------------*/
// Database objects
import { db, dataTables } from "../database.js";
/*------------------------------------------------------/Imports-----------------------------------------------------*/


/*------------------------------------------------------Variables------------------------------------------------------*/
// Web server address
const webServer = "http://web:3000";
/*------------------------------------------------------/Variables-----------------------------------------------------*/


/*------------------------------------------------------Helper_Functions------------------------------------------------------*/

// Add data to telemetry
async function insertData(TEMP, ATMP, HUM, LUX, CO, NO2, NH3, TIMESTAMP = null) {

    // Insert telemetry into database
    const [response] = await db.query(
        `INSERT INTO ${dataTables.telemetry}
        (temp, atmp, hum, lux, co, no2, nh3, time_logged)
        VALUES (?, ?, ?, ?, ?, ?, ?, COALESCE(?, CURRENT_TIMESTAMP))`,
        [TEMP, ATMP, HUM, LUX, CO, NO2, NH3, TIMESTAMP]
    );


    // Read back the exact row stored by MySQL
    const [rows] = await db.query(
        `SELECT *
        FROM ${dataTables.telemetry}
        WHERE id = ?`,
        [response.insertId]
    );


    const telemetry =
        rows[0];


    // Send exact database row to browser
    try {

        await fetch(
            `${webServer}/api/live/telemetry`,
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify(
                    telemetry
                )
            }
        );

    }
    catch (error) {

        console.error("Failed to send live telemetry to web server:");
        console.error(error);

    }


    return response;
}



// Add log to drone_log
async function writeLog(ACTION, DESCRIPTION) {

    // Insert log into database
    const [response] = await db.query(
        `INSERT INTO ${dataTables.log}
        (action_type, log_content)
        VALUES (?, ?)`,
        [ACTION, DESCRIPTION]
    );

    // Read back the exact row stored by MySQL
    const [rows] = await db.query(
        `SELECT *
        FROM ${dataTables.log}
        WHERE id = ?`,
        [response.insertId]
    );


    const log =
        rows[0];


    // Send exact database row to browser
    try {

        await fetch(
            `${webServer}/api/live/log`,
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify(
                    log
                )
            }
        );

    }
    catch (error) {

        /*
            Failure to notify the browser
            should not cause a successful
            database insert to fail.
        */
        console.error("Failed to send live log to web server:");
        console.error(error);

    }

    return response;
}



// Add detection image to detection_image
async function writeDetection(TYPE, DESCRIPTION, MIME, IMAGE, TIMESTAMP = null) {

    const [response] = await db.query(
        `INSERT INTO ${dataTables.detection}
        (image_type, description, image_mime, image, time_logged)
        VALUES (?, ?, ?, ?, COALESCE(?, CURRENT_TIMESTAMP))`,
        [TYPE, DESCRIPTION, MIME, IMAGE, TIMESTAMP]
    );

    // Send metadata only to browser; image bytes are fetched separately
    const [rows] = await db.query(
        `SELECT id, image_type, description, image_mime, time_logged
        FROM ${dataTables.detection}
        WHERE id = ?`,
        [response.insertId]
    );

    try {
        await fetch(`${webServer}/api/live/detection`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(rows[0])
        });
    }
    catch (error) {
        console.error("Failed to send live detection to web server:");
        console.error(error);
    }

    return response;
}

/*------------------------------------------------------/Helper_Functions-----------------------------------------------------*/


/*------------------------------------------------------Exports------------------------------------------------------*/

// Telemetry
export { insertData };


// Log
export { writeLog };

// Detection images
export { writeDetection };

/*------------------------------------------------------/Exports-----------------------------------------------------*/