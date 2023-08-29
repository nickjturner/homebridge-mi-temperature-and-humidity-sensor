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

    this.scanner = this.setupScanner(this.config.address);
    setInterval(() => {
      this.scanner.start();
    }, this.getScanTimeout());
  }

  getScanTimeout() {
    if (Number.isInteger(this.config.scanTimeout)){
      return parseInt(this.config.scanTimeout, 10) * 1000
    }
    return 60000 // default scan interval is 1 minute
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
    return accessoryInformation;
  }

  getTemperatureService() {
    const temperatureService = new hap.Service.TemperatureSensor("Temperature");
    temperatureService
      .getCharacteristic(hap.Characteristic.CurrentTemperature)
      .on(CharacteristicEventTypes.GET, (callback: CharacteristicGetCallback) => {
        callback(undefined, (this.latestTemperature ?? 0));
      });

    return temperatureService;
  }

  getHumidityService() {
    const humidityService = new hap.Service.HumiditySensor("Humidity");
    humidityService
      .getCharacteristic(hap.Characteristic.CurrentRelativeHumidity)
      .on(CharacteristicEventTypes.GET, (callback: CharacteristicGetCallback) => {
        callback(undefined, (this.latestHumidity ?? 0));
      });
    return humidityService;
  }

  getBatteryService() {
    const batteryService = new hap.Service.BatteryService("Battery");
    batteryService
      .getCharacteristic(hap.Characteristic.BatteryLevel)
      .on(CharacteristicEventTypes.GET, (callback: CharacteristicGetCallback) => {
        callback(undefined, this.batteryLevel());
      });
    batteryService.setCharacteristic(
      hap.Characteristic.ChargingState,
      hap.Characteristic.ChargingState.NOT_CHARGEABLE
    );
    batteryService
      .getCharacteristic(hap.Characteristic.StatusLowBattery)
      .on(CharacteristicEventTypes.GET, (callback: CharacteristicGetCallback) => {
        let batteryStatus;

        if (this.batteryLevel() > this.batteryLevelThreshold()) {
          batteryStatus = hap.Characteristic.StatusLowBattery.BATTERY_LEVEL_NORMAL;
        } else {
           batteryStatus = hap.Characteristic.StatusLowBattery.BATTERY_LEVEL_LOW;
        }
        callback(undefined, batteryStatus);
      })
    return batteryService;
  }

  batteryLevel() {
    return this.latestBatteryLevel ?? 100;
  }

  batteryLevelThreshold() {
    return 10;
  }

  setupScanner(address) {
    if (address == null) {
      this.log.warn("address is not set.");
      return;
    }
    this.log.info("Setting up");

    const scanner = new Scanner(this.log, this.config.address);

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
