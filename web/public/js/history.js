/*------------------------------------------------------Variables------------------------------------------------------*/
const historyList = document.getElementById("historyList");
const entryCount = document.getElementById("entryCount");
let telemetryEntries = [];
/*------------------------------------------------------/Variables-----------------------------------------------------*/

/*------------------------------------------------------Helper_Functions------------------------------------------------------*/
function formatTime(time) {
    const date = new Date(time);
    return Number.isNaN(date.getTime()) ? String(time ?? "") : date.toLocaleString();
}

function formatValue(value, unit) {
    const number = Number(value);
    return `${Number.isFinite(number) ? number : "--"}${unit}`;
}

function createValue(label, value) {
    const container = document.createElement("span");
    container.className = "entry-value";

    const labelElement = document.createElement("span");
    labelElement.className = "entry-label";
    labelElement.textContent = label;

    const valueElement = document.createElement("span");
    valueElement.textContent = value;

    container.append(labelElement, valueElement);
    return container;
}

function createTelemetryEntry(row) {
    const entry = document.createElement("div");
    entry.className = "history-entry telemetry-entry";

    const id = document.createElement("span");
    id.className = "entry-id";
    id.textContent = row.id;

    const time = document.createElement("span");
    time.className = "entry-time";
    time.textContent = formatTime(row.time_logged);

    entry.append(
        id,
        createValue("Temperature", formatValue(row.temp, " °C")),
        createValue("Pressure", formatValue(row.atmp, " hPa")),
        createValue("Humidity", formatValue(row.hum, " %")),
        createValue("Light", formatValue(row.lux, " lux")),
        createValue("CO", formatValue(row.co, " ppm")),
        createValue("NO₂", formatValue(row.no2, " ppm")),
        createValue("NH₃", formatValue(row.nh3, " ppm")),
        time
    );

    return entry;
}

function renderHistory() {
    historyList.innerHTML = "";
    entryCount.textContent = `${telemetryEntries.length} entries`;

    if (telemetryEntries.length === 0) {
        historyList.innerHTML = '<div class="empty-message">No telemetry entries found.</div>';
        return;
    }

    telemetryEntries.forEach((row) => historyList.appendChild(createTelemetryEntry(row)));
}

async function requestHistory() {
    try {
        const response = await fetch("/api/history");
        const result = await response.json();
        if (!response.ok || !result.success) throw new Error(result.error || "Failed to load telemetry history");
        telemetryEntries = Array.isArray(result.data) ? result.data : [];
        renderHistory();
    }
    catch (error) {
        console.error(error);
        historyList.innerHTML = '<div class="empty-message">Could not load telemetry history.</div>';
        entryCount.textContent = "Unavailable";
    }
}

function addLiveTelemetry(row) {
    if (!row || row.id == null) return;
    telemetryEntries = telemetryEntries.filter((entry) => Number(entry.id) !== Number(row.id));
    telemetryEntries.unshift(row);
    renderHistory();
}
/*------------------------------------------------------/Helper_Functions-----------------------------------------------------*/

/*------------------------------------------------------WebSocket------------------------------------------------------*/
const protocol = window.location.protocol === "https:" ? "wss" : "ws";
const socket = new WebSocket(`${protocol}://${window.location.host}/ws`);

socket.addEventListener("message", (event) => {
    try {
        const message = JSON.parse(event.data);
        if (message.type === "telemetry") addLiveTelemetry(message.data);
    }
    catch (error) {
        console.error("Invalid WebSocket message:", error);
    }
});
/*------------------------------------------------------/WebSocket-----------------------------------------------------*/

/*------------------------------------------------------Initialisation------------------------------------------------------*/
requestHistory();
/*------------------------------------------------------/Initialisation-----------------------------------------------------*/
