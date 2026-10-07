/*------------------------------------------------------Imports------------------------------------------------------*/
// Standard
import express from "express";
import { createServer } from "http";
import { WebSocketServer, WebSocket } from "ws";
import path from "path";
import { fileURLToPath } from "url";

// Routing
import webRouter_NAV from "./routes/navigation.js";
import webRouter_API, { setBroadcastFunction } from "./routes/api.js";

// Common import
import { webPORT } from "../../common/config.js";
/*------------------------------------------------------/Imports-----------------------------------------------------*/


/*------------------------------------------------------Variables------------------------------------------------------*/
// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create application object
const application = express();

// Define port to be exposed
const PORT = webPORT;

// Create HTTP server
const server = createServer(application);

// Create WebSocket server
const wss = new WebSocketServer({
    server: server,
    path: "/ws"
});

// WebSocket heartbeat interval
const heartbeatInterval = 30000;
/*------------------------------------------------------/Variables-----------------------------------------------------*/


/*------------------------------------------------------Middleware------------------------------------------------------*/
// Allows Express to read JSON
application.use(express.json());

// Allows server to serve static files
application.use(express.static(path.join(__dirname, "../public")));

// API routes
application.use("/api", webRouter_API);

// Navigation routes
application.use("/", webRouter_NAV);
/*------------------------------------------------------/Middleware-----------------------------------------------------*/


/*------------------------------------------------------WebSocket------------------------------------------------------*/
// Browser connects to WebSocket
wss.on("connection", (ws) => {
    console.log("Browser connected to WebSocket");

    // Mark the connection as alive
    ws.isAlive = true;

    // Browser responded to heartbeat
    ws.on("pong", () => {
        ws.isAlive = true;
    });

    // Send connection confirmation
    ws.send(JSON.stringify({
        type: "connection",
        message: "Connected to web server"
    }));

    // Receive message from browser
    ws.on("message", (message) => {
        console.log("WebSocket message received:");
        console.log(message.toString());
    });

    // Browser disconnects
    ws.on("close", (code, reason) => {
        console.log("Browser disconnected from WebSocket");
        console.log(`Close code: ${code}`);
        console.log(`Close reason: ${reason.toString() || "None"}`);
    });

    // WebSocket error
    ws.on("error", (error) => {
        console.error("WebSocket error:");
        console.error(error);
    });
});


/*
    WebSocket heartbeat.

    Every 30 seconds:

    1. Check whether each browser replied
       to the previous ping.

    2. Remove connections that are no
       longer responding.

    3. Ping active connections.

    Browsers automatically respond to
    WebSocket ping frames with pong frames.
*/
const heartbeatTimer = setInterval(() => {
    for (const client of wss.clients) {

        // Browser failed to respond to previous heartbeat
        if (client.isAlive === false) {
            console.log("Terminating inactive WebSocket");
            client.terminate();
            continue;
        }

        // Assume connection is dead until a pong is received
        client.isAlive = false;

        // Send heartbeat
        client.ping();
    }
}, heartbeatInterval);


// Stop heartbeat timer when server closes
wss.on("close", () => {
    clearInterval(heartbeatTimer);
});
/*------------------------------------------------------/WebSocket-----------------------------------------------------*/


/*------------------------------------------------------Helper_Functions------------------------------------------------------*/
// Send data to all connected browsers
function broadcast(data) {

    // Convert data to JSON
    const message = JSON.stringify(data);

    console.log(`Broadcasting to ${wss.clients.size} WebSocket client(s)`);

    // Send data to every connected browser
    for (const client of wss.clients) {
        if (client.readyState === WebSocket.OPEN) {
            client.send(message);
        }
    }
}


// Give API router access to broadcast
setBroadcastFunction(broadcast);
/*------------------------------------------------------/Helper_Functions-----------------------------------------------------*/


/*------------------------------------------------------Deploy------------------------------------------------------*/
// Host and expose server port
server.listen(PORT, () => {
    console.log(`Server Manager running on port ${PORT}: http://localhost:${PORT}/`);
});
/*------------------------------------------------------/Deploy-----------------------------------------------------*/

// Exports
export { broadcast };