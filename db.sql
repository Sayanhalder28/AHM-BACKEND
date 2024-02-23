CREATE TABLE IF NOT EXISTS users (
  `id` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `employee_id` VARCHAR(255) NOT NULL UNIQUE,
  `username` VARCHAR(255) NOT NULL UNIQUE,
  `password` VARCHAR(255) NOT NULL,
  `first_name` VARCHAR(255) NOT NULL,
  `last_name` VARCHAR(255) NOT NULL,
  `phone_number` VARCHAR(20) NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS workshops (
  `workshop_id` VARCHAR(20),
  `workshop_name` VARCHAR(50) NOT NULL,
  `workshop_address` VARCHAR(50) NOT NULL,
  `workshop_description` TEXT NULL,
  `Workshop_image` VARCHAR(255) NULL,
  PRIMARY KEY (`workshop_id`),
  UNIQUE INDEX `workshop_name_UNIQUE` (`workshop_name` ASC) VISIBLE)
ENGINE = InnoDB;

CREATE TABLE IF NOT EXISTS assets (
  `asset_id` VARCHAR(100) ,
  `workshop_id_fk` VARCHAR(20) NOT NULL,
  `asset_type` VARCHAR(100) NOT NULL,
  `site` VARCHAR(100) NOT NULL,
  `application` VARCHAR(250) NOT NULL,
  `sensors_connected` JSON NULL,
  `asset_image` TEXT NULL,
  `asset_description` TEXT NOT NULL,
  PRIMARY KEY (`asset_id`),
  INDEX `fk_assets_table11_idx` (`workshop_id_fk` ASC) VISIBLE,
  CONSTRAINT `fk_assets_table11`
    FOREIGN KEY (`workshop_id_fk`)
    REFERENCES `workshops` (`workshop_id`)
    ON DELETE CASCADE
    ON UPDATE NO ACTION)
  ENGINE = InnoDB;

CREATE TABLE IF NOT EXISTS sensors (
  `sensor_id` VARCHAR(15) NOT NULL,
  `sensor_type` VARCHAR(15) NOT NULL DEFAULT 'skin',
  `asset_id_fk` VARCHAR(100) NOT NULL,
  `temperature_min` INT NOT NULL DEFAULT 0,
  `temperature_healthy` INT NOT NULL DEFAULT 75,
  `temperature_warning` INT NOT NULL DEFAULT 85,
  `temperature_max` INT NOT NULL DEFAULT 100,
  `vibration_min` INT NOT NULL DEFAULT 0,
  `vibration_healthy` INT NOT NULL DEFAULT 5,
  `vibration_warning` INT NOT NULL DEFAULT 9,
  `vibration_max` INT NOT NULL DEFAULT 14,
  `magnetic_flux_min` INT NOT NULL DEFAULT 0,
  `magnetic_flux_healthy` INT NOT NULL DEFAULT 5,
  `magnetic_flux_warning` INT NOT NULL DEFAULT 9,
  `magnetic_flux_max` INT NOT NULL DEFAULT 14,
  `ultrasound_min` INT NOT NULL DEFAULT 0,
  `ultrasound_healthy` INT NOT NULL DEFAULT 8,
  `ultrasound_warning` INT NOT NULL DEFAULT 16,
  `ultrasound_max` INT NOT NULL DEFAULT 32,
  PRIMARY KEY (`sensor_id`),
  INDEX `fk_sensors_assets_idx` (`asset_id_fk` ASC) VISIBLE,
  CONSTRAINT `fk_sensors_assets`
    FOREIGN KEY (`asset_id_fk`)
    REFERENCES `assets` (`asset_id`)
    ON DELETE CASCADE
    ON UPDATE NO ACTION)
  ENGINE = InnoDB;

-- INSERT INTO users (username,password,first_name,last_name,employee_id,phone_number) VALUES ("sayan12","9433607337","sayan","halder","ST012312","8620871723")
-- INSERT INTO assets (asset_id, asset_type, asset_name, client_address, client_site, application, sensors_connected, asset_image, asset_description) VALUES ('A1234', 'Machine', 'My Machine', '123 Main Street', 'Site A', 'Manufacturing', '{"sensor_id":[12341234,1234123]}', 'http://example.com/images/machine.jpg', 'This is a machine used in the manufacturing process.');