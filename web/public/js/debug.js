/*------------------------------------------------------Variables------------------------------------------------------*/

// Forms
const telemetryForm =
    document.getElementById(
        "telemetryForm"
    );

const logForm =
    document.getElementById(
        "logForm"
    );


// Response displays
const telemetryResponse =
    document.getElementById(
        "telemetryResponse"
    );

const logResponse =
    document.getElementById(
        "logResponse"
    );


// Submit buttons
const telemetrySubmitButton =
    document.getElementById(
        "telemetrySubmitButton"
    );

const logSubmitButton =
    document.getElementById(
        "logSubmitButton"
    );


// Example buttons
const telemetryExampleButton =
    document.getElementById(
        "telemetryExampleButton"
    );

const logExampleButton =
    document.getElementById(
        "logExampleButton"
    );


// Activity
const activityLog =
    document.getElementById(
        "activityLog"
    );

const clearActivityButton =
    document.getElementById(
        "clearActivityButton"
    );


// Server status
const serverStatus =
    document.getElementById(
        "serverStatus"
    );

const statusText =
    document.getElementById(
        "statusText"
    );

/*------------------------------------------------------/Variables-----------------------------------------------------*/



/*------------------------------------------------------Telemetry------------------------------------------------------*/

// Submit telemetry
telemetryForm.addEventListener(
    "submit",
    async (event) => {

        event.preventDefault();


        const telemetry = {

            temp:
                Number(
                    document.getElementById(
                        "temp"
                    ).value
                ),

            atmp:
                Number(
                    document.getElementById(
                        "atmp"
                    ).value
                ),

            hum:
                Number(
                    document.getElementById(
                        "hum"
                    ).value
                ),

            lux:
                Number(
                    document.getElementById(
                        "lux"
                    ).value
                ),

            co:
                Number(
                    document.getElementById(
                        "co"
                    ).value
                ),

            no2:
                Number(
                    document.getElementById(
                        "no2"
                    ).value
                ),

            nh3:
                Number(
                    document.getElementById(
                        "nh3"
                    ).value
                )

        };


        telemetrySubmitButton.disabled =
            true;


        telemetrySubmitButton.textContent =
            "Writing...";


        clearResponse(
            telemetryResponse
        );


        try {

            const response =
                await fetch(
                    "/api/debug/telemetry",
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body:
                            JSON.stringify(
                                telemetry
                            )
                    }
                );


            const result =
                await response.json();


            if (!response.ok) {

                throw new Error(
                    result.error ||
                    "Failed to write telemetry"
                );

            }


            showResponse(
                telemetryResponse,
                "success",
                `Telemetry written successfully. Database ID: ${result.id}`
            );

        }
        catch (error) {

            showResponse(
                telemetryResponse,
                "error",
                error.message
            );

        }
        finally {

            telemetrySubmitButton.disabled =
                false;


            telemetrySubmitButton.textContent =
                "Write Telemetry";

        }

    }
);


// Load example telemetry
telemetryExampleButton.addEventListener(
    "click",
    () => {

        document.getElementById(
            "temp"
        ).value =
            26;


        document.getElementById(
            "atmp"
        ).value =
            1000;


        document.getElementById(
            "hum"
        ).value =
            50;


        document.getElementById(
            "lux"
        ).value =
            400;


        document.getElementById(
            "co"
        ).value =
            4.47;


        document.getElementById(
            "no2"
        ).value =
            0.15;


        document.getElementById(
            "nh3"
        ).value =
            0.84;

    }
);

/*------------------------------------------------------/Telemetry-----------------------------------------------------*/



/*------------------------------------------------------Logs------------------------------------------------------*/

// Submit log
logForm.addEventListener(
    "submit",
    async (event) => {

        event.preventDefault();


        const log = {

            action:
                document.getElementById(
                    "actionType"
                ).value.trim(),

            description:
                document.getElementById(
                    "logContent"
                ).value.trim()

        };


        logSubmitButton.disabled =
            true;


        logSubmitButton.textContent =
            "Writing...";


        clearResponse(
            logResponse
        );


        try {

            const response =
                await fetch(
                    "/api/debug/log",
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body:
                            JSON.stringify(
                                log
                            )
                    }
                );


            const result =
                await response.json();


            if (!response.ok) {

                throw new Error(
                    result.error ||
                    "Failed to write log"
                );

            }


            showResponse(
                logResponse,
                "success",
                `Log written successfully. Database ID: ${result.id}`
            );


        }
        catch (error) {

            showResponse(
                logResponse,
                "error",
                error.message
            );

        }
        finally {

            logSubmitButton.disabled =
                false;


            logSubmitButton.textContent =
                "Write Log";

        }

    }
);


// Load example log
logExampleButton.addEventListener(
    "click",
    () => {

        document.getElementById(
            "actionType"
        ).value =
            "DEBUG";


        document.getElementById(
            "logContent"
        ).value =
            "Manual debug log written from the GCS debug interface.";

    }
);

/*------------------------------------------------------/Logs-----------------------------------------------------*/


/*------------------------------------------------------Server_Status------------------------------------------------------*/

// Check API connection
async function checkServerStatus() {

    try {

        const response =
            await fetch(
                "/api/debug/status"
            );


        const result =
            await response.json();


        if (
            !response.ok ||
            !result.success
        ) {

            throw new Error(
                "Server unavailable"
            );

        }


        serverStatus.classList.remove(
            "offline"
        );


        serverStatus.classList.add(
            "online"
        );


        statusText.textContent =
            "Database Handler Online";

    }
    catch (error) {

        serverStatus.classList.remove(
            "online"
        );


        serverStatus.classList.add(
            "offline"
        );


        statusText.textContent =
            "Database Handler Offline";

    }

}

/*------------------------------------------------------/Server_Status-----------------------------------------------------*/



/*------------------------------------------------------Helper_Functions------------------------------------------------------*/

// Display response
function showResponse(
    element,
    type,
    message
) {

    element.className =
        `response-message ${type}`;


    element.textContent =
        message;

}


// Clear response
function clearResponse(element) {

    element.className =
        "response-message";


    element.textContent =
        "";

}


// Escape HTML
function escapeHTML(value) {

    return String(value)

        .replaceAll(
            "&",
            "&amp;"
        )

        .replaceAll(
            "<",
            "&lt;"
        )

        .replaceAll(
            ">",
            "&gt;"
        )

        .replaceAll(
            "\"",
            "&quot;"
        )

        .replaceAll(
            "'",
            "&#039;"
        );

}

/*------------------------------------------------------/Helper_Functions-----------------------------------------------------*/



/*------------------------------------------------------Initialise------------------------------------------------------*/

// Check connection when page loads
checkServerStatus();

/*------------------------------------------------------/Initialise-----------------------------------------------------*/