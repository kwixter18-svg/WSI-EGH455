import mqtt from "mqtt"

let client = null;

export function connectMQTT(host = "mqtt", port = 1883) {

    if (client) {
        return client;
    }

    const url = `mqtt://${host}:${port}`;

    client = mqtt.connect(url);

    client.on("connect", () => {
        console.log(`Connected to MQTT broker at ${url}`);
    });

    client.on("error", (error) => {
        console.error("MQTT error:", error);
    });

    client.on("close", () => {
        console.log("MQTT connection closed");
    });

    return client;
}

export function publishMQTT(topic, data, options = {}) {

    if (!client) {
        throw new Error("MQTT client has not been connected");
    }

    const message = typeof data === "string" ? data : JSON.stringify(data);

    client.publish(topic, message, options);
}


export function subscribeMQTT(topic, callback) {

    if (!client) {
        throw new Error("MQTT client has not been connected");
    }

    client.subscribe(topic, (error) => {

        if (error) {
            console.error(`Failed to subscribe to ${topic}:`, error);
            return;
        }

        console.log(`Subscribed to ${topic}`);
    });

    client.on("message", (receivedTopic, message) => {

        if (receivedTopic === topic) {
            callback(message.toString());
        }

    });
}