import {
  AccessoryConfig,
  AccessoryPlugin,
  API,
  CharacteristicEventTypes,
  CharacteristicGetCallback,
  CharacteristicSetCallback,
  CharacteristicValue,
  HAP,
  Logging,
  Service
} from "homebridge";

import { Scanner } from "./scanner";

let hap: HAP;

export = (api: API) => {
  hap = api.hap;
  api.registerAccessory("MiSensor", MiSensor);
};

class MiSensor implements AccessoryPlugin {

  private readonly log: Logging;
  private readonly config: AccessoryConfig;

  private latestTemperature;
  private latestHumidity;
  private latestBatteryLevel;

  private lastUpdatedAt;

  private scanner;

  private readonly informationService;
  private readonly temperatureService;
  private readonly humidityService;
  private readonly batteryService;

  constructor(log: Logging, config: AccessoryConfig, api: API) {
    this.log = log;
    this.config = config
    this.informationService = this.getInformationService();
    this.temperatureService = this.getTemperatureService();
    this.humidityService = this.getHumidityService();
    this.batteryService = this.getBatteryService();

    log.info(this.config.name + " - Sensor finished initializing!");
    log.info("Config: " + this.config);

    this.scanner = this.setupScanner(this.config.deviceName);
  }

  get temperature() {
    if (this.latestTemperature == null) {
      return 0;
    }
    return this.latestTemperature;
  }

  get humidity() {
    if (this.latestHumidity == null) {
      return 0;
    }
    return this.latestHumidity;
  }

  get batteryLevel() {
    return this.latestBatteryLevel ?? 100;
  }

  get batteryStatus() {
    let batteryStatus;
    if (this.batteryLevel == null) {
      batteryStatus = undefined;
    } else if (this.batteryLevel > this.batteryLevelThreshold) {
      batteryStatus = hap.Characteristic.StatusLowBattery.BATTERY_LEVEL_NORMAL;
    } else {
      batteryStatus = hap.Characteristic.StatusLowBattery.BATTERY_LEVEL_LOW;
    }
    return batteryStatus;
  }

  get batteryLevelThreshold() {
    return 10;
  }

  getServices(): Service[] {
    return [
      this.informationService,
      this.temperatureService,
      this.humidityService,
      this.batteryService
    ];
  }

  getInformationService() {
    const packageConf = require('../package.json');
    const version = packageConf.version;
    const accessoryInformation = new hap.Service.AccessoryInformation();
    accessoryInformation
      .setCharacteristic(hap.Characteristic.Name, this.config.name)
      .setCharacteristic(hap.Characteristic.Manufacturer, "Xiaomi Mijia")
      .setCharacteristic(hap.Characteristic.Model, "LYWSD03MMC")
      .setCharacteristic(hap.Characteristic.SerialNumber, this.config.deviceName)
    return accessoryInformation;
  }

  getTemperatureService() {
    const temperatureService = new hap.Service.TemperatureSensor("Temperature");
    temperatureService
      .getCharacteristic(hap.Characteristic.CurrentTemperature)
      .on(CharacteristicEventTypes.GET, (callback: CharacteristicGetCallback) => {
        this.log.info("Current tempeature returned");
        callback(undefined, "temperature");
      })
    return temperatureService;
  }

  getHumidityService() {
    const humidityService = new hap.Service.HumiditySensor("Humidity");
    humidityService
      .getCharacteristic(hap.Characteristic.CurrentRelativeHumidity)
      .on(CharacteristicEventTypes.GET, (callback: CharacteristicGetCallback) => {
        this.log.info("Current humidity returned");
        callback(undefined, "humidity");
      })
    return humidityService;
  }

  getBatteryService() {
    const batteryService = new hap.Service.BatteryService("Battery");
    batteryService
      .getCharacteristic(hap.Characteristic.BatteryLevel)
      .on(CharacteristicEventTypes.GET, (callback: CharacteristicGetCallback) => {
        this.log.info("Current battery level returned");
        callback(undefined, "batteryLevel");
      })
    batteryService.setCharacteristic(
      hap.Characteristic.ChargingState,
      hap.Characteristic.ChargingState.NOT_CHARGEABLE
    );
    batteryService
      .getCharacteristic(hap.Characteristic.StatusLowBattery)
      .on(CharacteristicEventTypes.GET, (callback: CharacteristicGetCallback) => {
        this.log.info("Current battery status returned");
        callback(undefined, "batteryStatus");
      })
    return batteryService;
  }

  setupScanner(deviceName) {
    if (deviceName == null) {
      this.log.warn("device name is not set.");
      return;
    }
    this.log.info("Setting up");

    const scanner = new Scanner(this.log, this.config.deviceName);

    scanner.on("updateValues", (newValue => {
      const {temp, humi, bat} = newValue;
      this.latestTemperature = temp;
      this.latestHumidity = humi;
      this.latestBatteryLevel = bat;
      this.lastUpdatedAt = Date.now();

      this.temperatureService.getCharacteristic(hap.Characteristic.CurrentTemperature).updateValue(this.latestTemperature);
      this.humidityService.getCharacteristic(hap.Characteristic.CurrentRelativeHumidity).updateValue(this.latestHumidity);
      this.log.debug(`Thermometer updated: Temperature: ${temp}°C, Humidity: ${humi}%,  Battery: ${bat}%`);
    }));

    return scanner;
  };

  onCharacteristicGetValue(field, callback) {
    const value = this[field];
    if (value == null) {
      callback(new Error(`Undefined characteristic value for ${field}`));
    } else {
      callback(null, value);
    }
  }
}
