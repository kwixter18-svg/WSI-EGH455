/*------------------------------------------------------Variables------------------------------------------------------*/
const detectionList = document.getElementById("detectionList");
const entryCount = document.getElementById("entryCount");
let detectionEntries = [];
/*------------------------------------------------------/Variables-----------------------------------------------------*/

/*------------------------------------------------------Helper_Functions------------------------------------------------------*/
function formatTime(time) {
    const date = new Date(time);
    return Number.isNaN(date.getTime()) ? String(time ?? "") : date.toLocaleString();
}

function openDetection(row) {
    document.getElementById("imageModalImage").src = `/api/detections/${detection.id}/image?v=${encodeURIComponent(detection.time_logged)}`;
    document.getElementById("imageModalType").textContent = row.image_type;
    document.getElementById("imageModalDescription").textContent = row.description;
    document.getElementById("imageModalTime").textContent = formatTime(row.time_logged);
    document.getElementById("imageModal").classList.add("open");
}

function createDetectionEntry(row) {
    const entry = document.createElement("div");
    entry.className = "history-entry detection-entry";

    const id = document.createElement("span");
    id.className = "entry-id";
    id.textContent = row.id;

    const image = document.createElement("img");
    image.className = "detection-preview";
    image.src = `/api/detections/${detection.id}/image?v=${encodeURIComponent(detection.time_logged)}`;
    image.alt = row.image_type;
    image.addEventListener("click", () => openDetection(row));

    const type = document.createElement("span");
    type.className = "detection-type";
    type.textContent = row.image_type;

    const description = document.createElement("span");
    description.className = "detection-description";
    description.textContent = row.description;

    const time = document.createElement("span");
    time.className = "entry-time";
    time.textContent = formatTime(row.time_logged);

    entry.append(id, image, type, description, time);
    return entry;
}

function renderDetections() {
    detectionList.innerHTML = "";
    entryCount.textContent = `${detectionEntries.length} entries`;

    if (detectionEntries.length === 0) {
        detectionList.innerHTML = '<div class="empty-message">No detection images found.</div>';
        return;
    }

    detectionEntries.forEach((row) => detectionList.appendChild(createDetectionEntry(row)));
}

async function requestDetections() {
    try {
        const response = await fetch("/api/detections/all");
        const result = await response.json();
        if (!response.ok || !result.success) throw new Error(result.error || "Failed to load detection history");
        detectionEntries = Array.isArray(result.data) ? result.data : [];
        renderDetections();
    }
    catch (error) {
        console.error(error);
        detectionList.innerHTML = '<div class="empty-message">Could not load detection history.</div>';
        entryCount.textContent = "Unavailable";
    }
}

function addLiveDetection(row) {
    if (!row || row.id == null) return;
    detectionEntries = detectionEntries.filter((entry) => Number(entry.id) !== Number(row.id));
    detectionEntries.unshift(row);
    renderDetections();
}
/*------------------------------------------------------/Helper_Functions-----------------------------------------------------*/

/*------------------------------------------------------Modal------------------------------------------------------*/
document.getElementById("imageModalClose").addEventListener("click", () => document.getElementById("imageModal").classList.remove("open"));
document.getElementById("imageModal").addEventListener("click", (event) => {
    if (event.target.id === "imageModal") event.currentTarget.classList.remove("open");
});
/*------------------------------------------------------/Modal-----------------------------------------------------*/

/*------------------------------------------------------WebSocket------------------------------------------------------*/
const protocol = window.location.protocol === "https:" ? "wss" : "ws";
const socket = new WebSocket(`${protocol}://${window.location.host}/ws`);

socket.addEventListener("message", (event) => {
    try {
        const message = JSON.parse(event.data);
        if (message.type === "detection") addLiveDetection(message.data);
    }
    catch (error) {
        console.error("Invalid WebSocket message:", error);
    }
});
/*------------------------------------------------------/WebSocket-----------------------------------------------------*/

/*------------------------------------------------------Initialisation------------------------------------------------------*/
requestDetections();
/*------------------------------------------------------/Initialisation-----------------------------------------------------*/
