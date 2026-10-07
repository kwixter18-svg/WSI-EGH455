/*------------------------------------------------------Variables------------------------------------------------------*/
const logList = document.getElementById("logList");
const entryCount = document.getElementById("entryCount");
let logEntries = [];
/*------------------------------------------------------/Variables-----------------------------------------------------*/

/*------------------------------------------------------Helper_Functions------------------------------------------------------*/
function formatTime(time) {
    const date = new Date(time);
    return Number.isNaN(date.getTime()) ? String(time ?? "") : date.toLocaleString();
}

function createLogEntry(row) {
    const entry = document.createElement("div");
    entry.className = "history-entry log-entry";

    const id = document.createElement("span");
    id.className = "entry-id";
    id.textContent = row.id;

    const action = document.createElement("span");
    action.className = "entry-value";
    action.textContent = row.action_type ?? "";

    const content = document.createElement("span");
    content.className = "entry-value log-content";
    content.textContent = row.log_content ?? "";

    const time = document.createElement("span");
    time.className = "entry-time";
    time.textContent = formatTime(row.time_logged);

    entry.append(id, action, content, time);
    return entry;
}

function renderLogs() {
    logList.innerHTML = "";
    entryCount.textContent = `${logEntries.length} entries`;

    if (logEntries.length === 0) {
        logList.innerHTML = '<div class="empty-message">No log entries found.</div>';
        return;
    }

    logEntries.forEach((row) => logList.appendChild(createLogEntry(row)));
}

async function requestLogs() {
    try {
        const response = await fetch("/api/logs/all");
        const result = await response.json();
        if (!response.ok || !result.success) throw new Error(result.error || "Failed to load logs");
        logEntries = Array.isArray(result.data) ? result.data : [];
        renderLogs();
    }
    catch (error) {
        console.error(error);
        logList.innerHTML = '<div class="empty-message">Could not load extended logs.</div>';
        entryCount.textContent = "Unavailable";
    }
}

function addLiveLog(row) {
    if (!row || row.id == null) return;
    logEntries = logEntries.filter((entry) => Number(entry.id) !== Number(row.id));
    logEntries.unshift(row);
    renderLogs();
}
/*------------------------------------------------------/Helper_Functions-----------------------------------------------------*/

/*------------------------------------------------------WebSocket------------------------------------------------------*/
const protocol = window.location.protocol === "https:" ? "wss" : "ws";
const socket = new WebSocket(`${protocol}://${window.location.host}/ws`);

socket.addEventListener("message", (event) => {
    try {
        const message = JSON.parse(event.data);
        if (message.type === "log") addLiveLog(message.data);
    }
    catch (error) {
        console.error("Invalid WebSocket message:", error);
    }
});
/*------------------------------------------------------/WebSocket-----------------------------------------------------*/

/*------------------------------------------------------Initialisation------------------------------------------------------*/
requestLogs();
/*------------------------------------------------------/Initialisation-----------------------------------------------------*/
