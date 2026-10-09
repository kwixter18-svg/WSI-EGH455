/*------------------------------------------------------Variables------------------------------------------------------*/

// Select correct WebSocket protocol
const webSocketProtocol =
    window.location.protocol === "https:" ? "wss:" : "ws:";


// Create WebSocket connection
const socket =
    new WebSocket(
        `${webSocketProtocol}//${window.location.host}/ws`
    );


// Sensor configuration
const sensors = {

    temp: {
        name: "Temperature",
        shortName: "Temp.",
        unit: "°C",
        min: 0,
        max: 50,
        value: null,
        valueElement: "temperature",
        barElement: "temperatureBar"
    },

    atmp: {
        name: "Atm Pressure",
        shortName: "Atm",
        unit: "hPa",
        min: 900,
        max: 1100,
        value: null,
        valueElement: "pressure",
        barElement: "pressureBar"
    },

    hum: {
        name: "Humidity",
        shortName: "Humid",
        unit: "%",
        min: 0,
        max: 100,
        value: null,
        valueElement: "humidity",
        barElement: "humidityBar"
    },

    lux: {
        name: "Light Level",
        shortName: "Lux",
        unit: "lux",
        min: 0,
        max: 1000,
        value: null,
        valueElement: "light",
        barElement: "lightBar"
    },

    gas: {
        name: "Gas Concentration",
        shortName: "Gas",
        unit: "ppm",
        min: 0,
        max: 10,
        value: null,
        values: {
            co: null,
            no2: null,
            nh3: null
        },
        valueElement: "gas",
        barElement: null
    }

};


// Sensor currently displayed on graph
let selectedSensor =
    "temp";


// Current graph time range
let selectedTime =
    10;

let selectedTimeUnit =
    "SECOND";


// Historical data currently loaded
let telemetryHistory =
    [];


// Telemetry graph
let telemetryChart = null;


// Historical request sequence
let telemetryRequestSequence = 0;


// Get sensor buttons
const sensorButtons =
    document.querySelectorAll(
        ".sensor-button"
    );


// Get sensor reading buttons
const sensorReadings =
    document.querySelectorAll(
        ".sensor-reading"
    );


// Get graph range buttons
const rangeButtons =
    document.querySelectorAll(
        ".range-button"
    );

/*------------------------------------------------------/Variables-----------------------------------------------------*/





/*------------------------------------------------------WebSocket------------------------------------------------------*/

// WebSocket connected
socket.addEventListener(
    "open",
    () => {

        console.log(
            "WebSocket connected"
        );

    }
);


// Receive message from server
socket.addEventListener(
    "message",
    (event) => {

        try {

            const message =
                JSON.parse(
                    event.data
                );


            switch (message.type) {

                case "connection":

                    console.log(
                        message.message
                    );

                    break;


                case "telemetry":

                    /*
                        Update the CURRENT telemetry.

                        This updates the wheel and sensor
                        bars only.
                    */
                    updateTelemetry(
                        message.data
                    );


                    /*
                        Add the new telemetry sample to
                        the graph history.
                    */
                    addLiveTelemetryToHistory(
                        message.data
                    );

                    break;


                case "log":

                    addLog(
                        message.data
                    );

                    break;


                case "detection":

                    addLiveDetection(message.data);

                    break;

            }

        }
        catch (error) {

            console.error(
                "Invalid WebSocket message:"
            );

            console.error(
                error
            );

        }

    }
);


// WebSocket disconnected
socket.addEventListener(
    "close",
    () => {

        console.log(
            "WebSocket disconnected"
        );

    }
);


// WebSocket error
socket.addEventListener(
    "error",
    (error) => {

        console.error(
            "WebSocket error:"
        );

        console.error(
            error
        );

    }
);

/*------------------------------------------------------/WebSocket-----------------------------------------------------*/





/*------------------------------------------------------Sensor_Controls------------------------------------------------------*/

// Wheel sensor buttons
sensorButtons.forEach(
    (button) => {

        button.addEventListener(
            "click",
            () => {

                selectSensor(
                    button.dataset.sensor
                );

            }
        );

    }
);


// Sensor bar buttons
sensorReadings.forEach(
    (button) => {

        button.addEventListener(
            "click",
            () => {

                selectSensor(
                    button.dataset.sensor
                );

            }
        );

    }
);

/*------------------------------------------------------/Sensor_Controls-----------------------------------------------------*/





/*------------------------------------------------------Graph_Controls------------------------------------------------------*/

rangeButtons.forEach(
    (button) => {

        button.addEventListener(
            "click",
            () => {


                // Remove active state
                rangeButtons.forEach(
                    (rangeButton) => {

                        rangeButton.classList.remove(
                            "active"
                        );

                    }
                );


                // Set selected button
                button.classList.add(
                    "active"
                );


                // Store graph time range
                selectedTime =
                    Number(
                        button.dataset.time
                    );

                selectedTimeUnit =
                    button.dataset.unit;


                /*
                    Only request historical graph data.

                    This no longer changes the current
                    wheel or sensor bar readings.
                */
                requestTelemetryHistory();

            }
        );

    }
);

/*------------------------------------------------------/Graph_Controls-----------------------------------------------------*/





/*------------------------------------------------------Telemetry------------------------------------------------------*/

// Update current telemetry
function updateTelemetry(data) {


    // Temperature
    if (data.temp !== undefined) {

        sensors.temp.value =
            Number(
                data.temp
            );

    }


    // Atmospheric pressure
    if (data.atmp !== undefined) {

        sensors.atmp.value =
            Number(
                data.atmp
            );

    }


    // Humidity
    if (data.hum !== undefined) {

        sensors.hum.value =
            Number(
                data.hum
            );

    }


    // Light level
    if (data.lux !== undefined) {

        sensors.lux.value =
            Number(
                data.lux
            );

    }


    // Gas levels
    if (data.co !== undefined) {
        sensors.gas.values.co = Number(data.co);
    }

    if (data.no2 !== undefined) {
        sensors.gas.values.no2 = Number(data.no2);
    }

    if (data.nh3 !== undefined) {
        sensors.gas.values.nh3 = Number(data.nh3);
    }

    // Use CO as the primary gas value for the centre display
    sensors.gas.value = sensors.gas.values.co;


    // Update wheel and bars
    updateSensorDisplays();

}


/*
    Add live telemetry to the historical
    data currently being displayed.

    This allows the graph to continue
    updating as new telemetry arrives.
*/
function addLiveTelemetryToHistory(data) {

    // Create timestamp if one was not supplied
    const telemetry =
    {
        ...data,

        time_logged:
            data.time_logged ||
            new Date().toISOString()
    };


    // Add newest telemetry without replacing existing graph data
    telemetryHistory = mergeTelemetryRows(
        telemetryHistory,
        [telemetry]
    );


    // Update graph immediately
    updateGraph();

}


/*
    Remove historical telemetry older
    than the currently selected graph range.
*/
function trimTelemetryHistory() {

    const rangeMilliseconds =
        getGraphRangeSeconds() * 1000;


    const validRows =
        telemetryHistory.map((row) => ({
            row: row,
            time: parseTelemetryTime(row.time_logged)
        })).filter((item) => Number.isFinite(item.time));


    if (validRows.length === 0) {
        telemetryHistory = [];
        return;
    }


    const newestTime =
        Math.max(...validRows.map((item) => item.time));


    const minimumTime =
        newestTime - rangeMilliseconds;


    telemetryHistory =
        validRows.filter((item) => {
            return item.time >= minimumTime && item.time <= newestTime;
        }).map((item) => item.row);

}

/*------------------------------------------------------/Telemetry-----------------------------------------------------*/





/*------------------------------------------------------Logs------------------------------------------------------*/

// Add log to display
function addLog(data) {

    const logPanel =
        document.getElementById(
            "logPanel"
        );

    if (!logPanel) {
        return;
    }


    // Create log entry
    const logEntry =
        document.createElement(
            "div"
        );

    logEntry.classList.add(
        "log-entry"
    );


    // Format timestamp
    const logTime =
        new Date(
            data.time_logged
        );

    const time =
        logTime.toLocaleTimeString(
            [],
            {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit"
            }
        );


    // Create log text
    logEntry.textContent =
        `[${time}] ${data.action_type}: ${data.log_content}`;


    // Store database ID
    if (data.id !== undefined) {

        logEntry.dataset.logId =
            data.id;

    }


    // Add log to panel
    logPanel.appendChild(
        logEntry
    );


    // Scroll to newest log
    logPanel.scrollTop =
        logPanel.scrollHeight;

}


// Load recent logs
async function requestLogs() {

    try {

        const response =
            await fetch(
                "/api/logs?limit=50"
            );

        const result =
            await response.json();


        if (!response.ok) {

            throw new Error(
                result.error ||
                "Log request failed"
            );

        }


        const logPanel =
            document.getElementById(
                "logPanel"
            );

        if (!logPanel) {
            return;
        }


        // Clear current logs
        logPanel.innerHTML =
            "";


        // Add database logs
        result.data.forEach(
            (log) => {

                addLog(
                    log
                );

            }
        );

    }

    catch (error) {

        console.error(
            "Failed to request logs:"
        );

        console.error(
            error
        );

    }

}

/*------------------------------------------------------/Logs-----------------------------------------------------*/







/*------------------------------------------------------Detection_Images------------------------------------------------------*/

let detectionEntries = [];

function formatDetectionTime(time) {
    const date = new Date(time);
    return Number.isNaN(date.getTime()) ? String(time ?? "") : date.toLocaleString();
}

function openDetection(detection) {
    document.getElementById("detectionModalImage").src = `/api/detections/${detection.id}/image?v=${encodeURIComponent(detection.time_logged)}`;
    document.getElementById("detectionModalType").textContent = detection.image_type;
    document.getElementById("detectionModalDescription").textContent = detection.description;
    document.getElementById("detectionModalTime").textContent = formatDetectionTime(detection.time_logged);
    document.getElementById("detectionModal").classList.add("open");
}

function renderDetections() {
    const container = document.getElementById("detectionThumbnails");
    if (!container) return;
    container.innerHTML = "";

    if (detectionEntries.length === 0) {
        container.innerHTML = '<div class="detection-empty">No detection images</div>';
        return;
    }

    detectionEntries.slice(0, 6).forEach((detection) => {
        const button = document.createElement("button");
        button.className = "image-thumbnail";
        button.title = `${detection.image_type}: ${detection.description}`;

        const image = document.createElement("img");
        image.src = `/api/detections/${detection.id}/image?v=${encodeURIComponent(detection.time_logged)}`;
        image.alt = detection.image_type;

        const label = document.createElement("span");
        label.className = "image-thumbnail-label";
        label.textContent = detection.image_type;

        button.append(image, label);
        button.addEventListener("click", () => openDetection(detection));
        container.appendChild(button);
    });
}

async function requestDetections() {
    try {
        const response = await fetch("/api/detections?limit=6");
        const result = await response.json();
        if (!response.ok || !result.success) throw new Error(result.error || "Detection request failed");
        detectionEntries = Array.isArray(result.data) ? result.data : [];
        renderDetections();
    }
    catch (error) {
        console.error("Failed to request detection images:");
        console.error(error);
    }
}

function addLiveDetection(detection) {
    if (!detection || detection.id == null) return;
    detectionEntries = detectionEntries.filter((entry) => Number(entry.id) !== Number(detection.id));
    detectionEntries.unshift(detection);
    detectionEntries = detectionEntries.slice(0, 6);
    renderDetections();
}

document.getElementById("detectionModalClose")?.addEventListener("click", () => document.getElementById("detectionModal").classList.remove("open"));
document.getElementById("detectionModal")?.addEventListener("click", (event) => {
    if (event.target.id === "detectionModal") event.currentTarget.classList.remove("open");
});

/*------------------------------------------------------/Detection_Images-----------------------------------------------------*/


/*------------------------------------------------------Database------------------------------------------------------*/

// Request historical telemetry from database
async function requestTelemetryHistory() {

    // Identify this request so an older response cannot overwrite a newer range
    const requestSequence =
        ++telemetryRequestSequence;


    try {

        // Build browser request
        const requestURL =
            `/api/telemetry` +
            `?time=${selectedTime}` +
            `&unit=${selectedTimeUnit}`;


        console.log(
            `Requesting ${requestURL}`
        );


        // Request data
        const response =
            await fetch(
                requestURL
            );


        // Read response
        const result =
            await response.json();


        // Check request succeeded
        if (!response.ok) {

            throw new Error(
                result.error ||
                "Telemetry request failed"
            );

        }


        // Ignore an old range request that completed late
        if (requestSequence !== telemetryRequestSequence) {
            return;
        }


        const historicalTelemetry =
            Array.isArray(result.data)
                ? result.data
                : [];


        /*
            Merge database history with anything
            already received over WebSocket.

            This prevents a completed fetch from
            deleting a live sample that arrived
            while the request was in progress.
        */
        telemetryHistory = mergeTelemetryRows(
            historicalTelemetry,
            telemetryHistory
        );


        console.log(
            "Historical telemetry received:"
        );

        console.log(
            telemetryHistory
        );


        // Update graph
        updateGraph();

    }

    catch (error) {

        console.error(
            "Failed to request telemetry:"
        );

        console.error(
            error
        );

    }

}



/*
    Get an initial current reading.

    We use a larger historical request once
    when the page first loads so the wheel
    and bars are not empty while waiting for
    the next WebSocket telemetry message.

    This does NOT control the graph range.
*/
async function requestInitialTelemetry() {

    try {

        /*
            Request a reasonably large period
            only to obtain the newest row.

            Once live telemetry begins arriving,
            WebSocket messages become the source
            of the current display.
        */
        const requestURL =
            "/api/telemetry?time=24&unit=HOUR";


        console.log(
            `Requesting initial telemetry: ${requestURL}`
        );


        const response =
            await fetch(
                requestURL
            );


        const result =
            await response.json();


        if (!response.ok) {

            throw new Error(
                result.error ||
                "Initial telemetry request failed"
            );

        }


        if (
            Array.isArray(result.data) &&
            result.data.length > 0
        ) {

            const latestTelemetry =
                result.data[
                    result.data.length - 1
                ];


            console.log(
                "Initial latest telemetry:"
            );

            console.log(
                latestTelemetry
            );


            updateTelemetry(
                latestTelemetry
            );

        }
        else {

            console.log(
                "No initial telemetry available"
            );

        }

    }

    catch (error) {

        console.error(
            "Failed to request initial telemetry:"
        );

        console.error(
            error
        );

    }

}

/*------------------------------------------------------/Database-----------------------------------------------------*/





/*------------------------------------------------------Graph------------------------------------------------------*/

// Convert database timestamp to milliseconds
// Merge telemetry without duplicating database rows
function mergeTelemetryRows(firstRows, secondRows) {

    const telemetryRows =
        new Map();


    [...firstRows, ...secondRows].forEach((row) => {

        const rowTime =
            parseTelemetryTime(
                row.time_logged
            );


        if (!Number.isFinite(rowTime)) {
            return;
        }


        const key =
            row.id !== undefined && row.id !== null
                ? `id:${row.id}`
                : `time:${rowTime}`;


        telemetryRows.set(
            key,
            row
        );

    });


    return Array.from(
        telemetryRows.values()
    ).sort((a, b) => {

        return (
            parseTelemetryTime(a.time_logged) -
            parseTelemetryTime(b.time_logged)
        );

    });

}


function parseTelemetryTime(time) {

    if (!time) {
        return NaN;
    }


    let timestamp =
        String(time).trim();


    /*
        Convert MySQL timestamp format:

        YYYY-MM-DD HH:MM:SS

        into a JavaScript-compatible local
        timestamp:

        YYYY-MM-DDTHH:MM:SS
    */
    if (
        timestamp.includes(" ") &&
        !timestamp.includes("T")
    ) {

        timestamp =
            timestamp.replace(
                " ",
                "T"
            );

    }


    return new Date(
        timestamp
    ).getTime();

}


// Get selected graph range in seconds
function getGraphRangeSeconds() {

    switch (selectedTimeUnit) {

        case "SECOND":

            return selectedTime;


        case "MINUTE":

            return selectedTime * 60;


        case "HOUR":

            return selectedTime * 60 * 60;


        default:

            return selectedTime;

    }

}


// Get graph time increment in seconds
function getGraphTimeStep() {

    if (
        selectedTime === 10 &&
        selectedTimeUnit === "SECOND"
    ) {

        return 2;

    }


    if (
        selectedTime === 1 &&
        selectedTimeUnit === "MINUTE"
    ) {

        return 10;

    }


    if (
        selectedTime === 5 &&
        selectedTimeUnit === "MINUTE"
    ) {

        return 60;

    }


    if (
        selectedTime === 30 &&
        selectedTimeUnit === "MINUTE"
    ) {

        return 300;

    }


    // Fallback
    return getGraphRangeSeconds() / 5;

}


// Format graph time axis
function formatGraphTime(seconds) {

    // Current time
    if (Math.abs(seconds) < 0.5) {

        return "Current";

    }


    const absoluteSeconds =
        Math.abs(seconds);


    // Seconds
    if (absoluteSeconds < 60) {

        return `-${Math.round(absoluteSeconds)}s`;

    }


    // Minutes
    if (absoluteSeconds < 3600) {

        const minutes =
            absoluteSeconds / 60;

        return `-${minutes}m`;

    }


    // Hours
    const hours =
        absoluteSeconds / 3600;

    return `-${hours}h`;

}


// Update graph using selected telemetry
function updateGraph() {

    const sensor = sensors[selectedSensor];
    const graphCanvas = document.getElementById("telemetryGraph");

    if (!graphCanvas) {
        return;
    }

    const rangeSeconds = getGraphRangeSeconds();
    const timeStep = getGraphTimeStep();

    // Use newest telemetry sample as Current
    let newestTime = 0;

    telemetryHistory.forEach((row) => {
        const rowTime = parseTelemetryTime(row.time_logged);

        if (Number.isFinite(rowTime) && rowTime > newestTime) {
            newestTime = rowTime;
        }
    });

    // Create graph points for a telemetry field
    function createGraphData(field) {
        return telemetryHistory.map((row) => {
            const rowTime = parseTelemetryTime(row.time_logged);

            return {
                x: (rowTime - newestTime) / 1000,
                y: Number(row[field])
            };
        }).filter((point) => {
            return Number.isFinite(point.x) && Number.isFinite(point.y) && point.x >= -rangeSeconds && point.x <= 0;
        }).sort((a, b) => a.x - b.x);
    }

    let datasets;

    // Gas displays CO, NO2 and NH3 together
    if (selectedSensor === "gas") {
        datasets = [
            {
                label: "CO",
                data: createGraphData("co"),
                borderColor: "#00aeef",
                backgroundColor: "rgba(0, 174, 239, 0.10)",
                borderWidth: 2,
                pointRadius: 3,
                pointHoverRadius: 5,
                tension: 0.15,
                fill: false,
                spanGaps: false
            },
            {
                label: "NO₂",
                data: createGraphData("no2"),
                borderColor: "#f28e2b",
                backgroundColor: "rgba(242, 142, 43, 0.10)",
                borderWidth: 2,
                pointRadius: 3,
                pointHoverRadius: 5,
                tension: 0.15,
                fill: false,
                spanGaps: false
            },
            {
                label: "NH₃",
                data: createGraphData("nh3"),
                borderColor: "#59a14f",
                backgroundColor: "rgba(89, 161, 79, 0.10)",
                borderWidth: 2,
                pointRadius: 3,
                pointHoverRadius: 5,
                tension: 0.15,
                fill: false,
                spanGaps: false
            }
        ];
    }
    else {
        datasets = [{
            label: sensor.name,
            data: createGraphData(selectedSensor),
            borderColor: "#00aeef",
            backgroundColor: "rgba(0, 174, 239, 0.10)",
            borderWidth: 2,
            pointRadius: 3,
            pointHoverRadius: 5,
            tension: 0.15,
            fill: false,
            spanGaps: false
        }];
    }

    console.log(`Graph data for ${selectedSensor}:`, datasets);

    // Create chart
    if (telemetryChart === null) {
        telemetryChart = new Chart(graphCanvas, {
            type: "line",
            data: { datasets: datasets },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: false,
                parsing: false,
                interaction: {
                    intersect: false,
                    mode: "nearest"
                },
                plugins: {
                    legend: {
                        display: selectedSensor === "gas"
                    },
                    tooltip: {
                        callbacks: {
                            title: (items) => {
                                if (items.length === 0) {
                                    return "";
                                }

                                return formatGraphTime(items[0].parsed.x);
                            },
                            label: (context) => {
                                return `${context.dataset.label}: ${context.parsed.y} ${sensors[selectedSensor].unit}`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        type: "linear",
                        min: -rangeSeconds,
                        max: 0,
                        ticks: {
                            stepSize: timeStep,
                            autoSkip: false,
                            callback: (value) => formatGraphTime(Number(value))
                        },
                        title: {
                            display: true,
                            text: "Time"
                        },
                        grid: {
                            color: "#eeeeee"
                        }
                    },
                    y: {
                        suggestedMin: sensor.min,
                        suggestedMax: sensor.max,
                        afterFit: (axis) => {
                            axis.width = 65;
                        },
                        title: {
                            display: true,
                            text: sensor.unit
                        },
                        grid: {
                            color: "#eeeeee"
                        }
                    }
                }
            }
        });

        return;
    }

    // Update graph data
    telemetryChart.data.datasets = datasets;

    // Show legend for the three gas traces
    telemetryChart.options.plugins.legend.display = selectedSensor === "gas";

    // Update time range
    telemetryChart.options.scales.x.min = -rangeSeconds;
    telemetryChart.options.scales.x.max = 0;
    telemetryChart.options.scales.x.ticks.stepSize = timeStep;

    // Update sensor range
    telemetryChart.options.scales.y.suggestedMin = sensor.min;
    telemetryChart.options.scales.y.suggestedMax = sensor.max;
    telemetryChart.options.scales.y.title.text = sensor.unit;

    // Redraw graph
    telemetryChart.update();
}

/*------------------------------------------------------/Graph-----------------------------------------------------*/





/*------------------------------------------------------Helper_Functions------------------------------------------------------*/

// Select sensor to display
function selectSensor(sensor) {

    // Check sensor exists
    if (!sensors[sensor]) {
        return;
    }


    // Store selected sensor
    selectedSensor =
        sensor;

    publishDisplayMode(sensor);


    // Update wheel buttons
    sensorButtons.forEach(
        (button) => {

            button.classList.toggle(
                "active",
                button.dataset.sensor === sensor
            );

        }
    );


    // Update sensor bars
    sensorReadings.forEach(
        (button) => {

            button.classList.toggle(
                "active",
                button.dataset.sensor === sensor
            );

        }
    );


    // Update centre display
    updateSelectedSensorDisplay();


    // Update graph heading
    updateGraphHeading();


    /*
        Changing the selected sensor only
        changes which field from the existing
        telemetryHistory is graphed.
    */
    updateGraph();

}


// Update all telemetry values
function updateSensorDisplays() {

    for (
        const [sensorKey, sensor]
        of Object.entries(sensors)
    ) {

        // Gas has three separate readings
        if (sensorKey === "gas") {
            updateGasDisplay();
            continue;
        }


        const valueElement =
            document.getElementById(
                sensor.valueElement
            );


        const barElement =
            document.getElementById(
                sensor.barElement
            );


        if (
            !valueElement ||
            !barElement
        ) {
            continue;
        }


        // No sensor data
        if (sensor.value === null) {

            valueElement.textContent =
                "--";

            barElement.style.width =
                "0%";

            continue;

        }


        // Update displayed sensor value
        valueElement.textContent =
            formatSensorValue(
                sensorKey,
                sensor.value
            );


        // Calculate bar percentage
        const percentage =
            calculateBarPercentage(
                sensor.value,
                sensor.min,
                sensor.max
            );


        // Update bar
        barElement.style.width =
            `${percentage}%`;

    }


    // Update centre wheel
    updateSelectedSensorDisplay();

}


// Update gas readings
function updateGasDisplay() {

    const gasValues = sensors.gas.values;

    const gasElements = {
        co: document.getElementById("gasCO"),
        no2: document.getElementById("gasNO2"),
        nh3: document.getElementById("gasNH3")
    };

    for (const gas of Object.keys(gasElements)) {
        if (!gasElements[gas]) {
            continue;
        }

        const value = gasValues[gas];
        gasElements[gas].textContent = value === null ? "--" : `${value.toFixed(2)} ppm`;
    }
}


// Update centre wheel value
function updateSelectedSensorDisplay() {

    const sensor =
        sensors[selectedSensor];


    const nameElement =
        document.getElementById(
            "selectedSensorName"
        );

    const valueElement =
        document.getElementById(
            "selectedSensorValue"
        );


    if (
        !nameElement ||
        !valueElement
    ) {
        return;
    }


    // Update sensor name
    nameElement.textContent =
        sensor.shortName;


    // No sensor value
    if (sensor.value === null) {

        valueElement.textContent =
            "--";

        return;

    }


    // Display selected sensor value
    valueElement.textContent =
        formatSensorValue(
            selectedSensor,
            sensor.value
        );

}


// Update graph heading
function updateGraphHeading() {

    const sensor =
        sensors[selectedSensor];


    const titleElement =
        document.getElementById(
            "graphTitle"
        );

    const unitElement =
        document.getElementById(
            "graphUnit"
        );


    if (
        !titleElement ||
        !unitElement
    ) {
        return;
    }


    titleElement.textContent =
        sensor.name;

    unitElement.textContent =
        sensor.unit;

}


// Format sensor value
function formatSensorValue(
    sensorKey,
    value
) {

    switch (sensorKey) {

        case "temp":

            return `${value.toFixed(1)}°C`;


        case "atmp":

            return `${value.toFixed(1)} hPa`;


        case "hum":

            return `${value.toFixed(1)}%`;


        case "lux":

            return `${value.toFixed(0)} lux`;


        case "gas":

            return `${value.toFixed(2)} ppm`;


        default:

            return `${value}`;

    }

}


// Calculate sensor bar width
function calculateBarPercentage(
    value,
    minimum,
    maximum
) {

    let percentage =
        (
            (value - minimum) /
            (maximum - minimum)
        ) * 100;


    // Prevent percentage below 0%
    if (percentage < 0) {

        percentage =
            0;

    }


    // Prevent percentage above 100%
    if (percentage > 100) {

        percentage =
            100;

    }


    return percentage;

}


// Publish selected sensor mode to Raspberry Pi LCD
async function publishDisplayMode(mode) {
    try {
        const response = await fetch("/api/display/mode", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ mode })
        });

        if (!response.ok) throw new Error("Failed to publish LCD mode");
        console.log(`LCD mode requested: ${mode}`);
    }
    catch (error) {
        console.error("LCD mode request failed:", error);
    }
}

/*------------------------------------------------------/Helper_Functions-----------------------------------------------------*/





/*------------------------------------------------------Initialise------------------------------------------------------*/

// Select temperature
selectSensor(
    "temp"
);


// Get latest available telemetry for wheel/bars
requestInitialTelemetry();


// Load initial 10-second graph history
requestTelemetryHistory();


// Load current logs
requestLogs();


// Load recent detection images
requestDetections();

/*------------------------------------------------------/Initialise-----------------------------------------------------*/