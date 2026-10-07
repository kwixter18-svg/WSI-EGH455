CREATE TABLE IF NOT EXISTS telemetry (
    id INT AUTO_INCREMENT PRIMARY KEY,
    temp FLOAT,
    atmp FLOAT,
    hum FLOAT,
    lux FLOAT,
    co FLOAT,
    no2 FLOAT,
    nh3 FLOAT,
    time_logged TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS drone_log (
    id INT AUTO_INCREMENT PRIMARY KEY,
    action_type VARCHAR(16),
    log_content VARCHAR(100),
    time_logged TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS detection_image (
    id INT AUTO_INCREMENT PRIMARY KEY,
    image_type VARCHAR(64),
    description VARCHAR(255),
    image_mime VARCHAR(64) DEFAULT 'image/jpeg',
    image MEDIUMBLOB NOT NULL,
    time_logged TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
