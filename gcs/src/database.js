/*------------------------------------------------------Imports------------------------------------------------------*/
// Standard
import mysql from "mysql2/promise";
/*------------------------------------------------------/Imports-----------------------------------------------------*/


/*------------------------------------------------------Variables------------------------------------------------------*/
// Database object created in yaml file
export const db = mysql.createPool({
    host: "mysql",
    user: "root",
    password: "superSneakyPassword",
    database: "gcs_data"
});

// Table names
export const dataTables = Object.freeze ({
    telemetry : "telemetry",
    log: "drone_log",
    detection: "detection_image"
});
/*------------------------------------------------------/Variables-----------------------------------------------------*/

/*------------------------------------------------------Database_Setup------------------------------------------------------*/
// Ensure gas columns exist when using an older persistent MySQL volume
async function ensureTelemetrySchema() {
    const [columns] = await db.query(`SHOW COLUMNS FROM ${dataTables.telemetry}`);
    const columnNames = new Set(columns.map((column) => column.Field));

    for (const gasColumn of ["co", "no2", "nh3"]) {
        if (!columnNames.has(gasColumn)) {
            await db.query(`ALTER TABLE ${dataTables.telemetry} ADD COLUMN ${gasColumn} FLOAT`);
            console.log(`Added telemetry column: ${gasColumn}`);
        }
    }
}

await ensureTelemetrySchema();

// Ensure detection image table exists when using an older persistent MySQL volume
async function ensureDetectionSchema() {
    await db.query(`CREATE TABLE IF NOT EXISTS ${dataTables.detection} (
        id INT AUTO_INCREMENT PRIMARY KEY,
        image_type VARCHAR(64),
        description VARCHAR(255),
        image_mime VARCHAR(64) DEFAULT 'image/jpeg',
        image MEDIUMBLOB NOT NULL,
        time_logged TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`);
}

await ensureDetectionSchema();
/*------------------------------------------------------/Database_Setup-----------------------------------------------------*/
