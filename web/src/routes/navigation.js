/*------------------------------------------------------Imports------------------------------------------------------*/
// Standard
import express from "express";
import path from "path";
/*------------------------------------------------------/Imports-----------------------------------------------------*/


/*------------------------------------------------------Variables------------------------------------------------------*/
// Router object
const webRouter_NAV = express.Router();

// Path to "public" folder for static file serving
const PUBLIC_ROOT = path.resolve("web/public");

// Static file names
const home = "index.html";


const pages = Object.freeze({
    home: "index.html",
    history: "history.html",
    logs: "logs.html",
    detections: "detections.html",
    debug: "debug.html"
})
/*------------------------------------------------------/Variables-----------------------------------------------------*/


/*------------------------------------------------------Helper_Functions------------------------------------------------------*/
// Serve static file
function ServeStatic(res, name) {
    res.sendFile(name, { root: PUBLIC_ROOT });
}
/*------------------------------------------------------/Helper_Functions-----------------------------------------------------*/


/*------------------------------------------------------Routes------------------------------------------------------*/
// Home page
webRouter_NAV.get("/", (req, res) => {
    ServeStatic(res, pages.home);
});

webRouter_NAV.get("/history", (req, res) => {
    ServeStatic(res, pages.history);
});

webRouter_NAV.get("/logs", (req, res) => {
    ServeStatic(res, pages.logs);
});

webRouter_NAV.get("/detections", (req, res) => {
    ServeStatic(res, pages.detections);
});

webRouter_NAV.get("/debug", (req, res) => {
    ServeStatic(res, pages.debug);
});
/*------------------------------------------------------/Routes------------------------------------------------------*/

// Export router
export default webRouter_NAV;