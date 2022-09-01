import { Logging } from "homebridge";
import noble from "@abandonware/noble";
import { EventEmitter } from "events";

export class Scanner extends EventEmitter {
  private readonly log: Logging;

  private deviceName: string;

  constructor(log: Logging, deviceName: string) {
    super();

    this.log = log;
    this.deviceName = deviceName;
    this.log.info("In the scanner");

    this.registerEvents();
  }

  registerEvents() {
    noble.on("discover", this.onDiscover.bind(this));
    noble.on("scanStart", this.onScanStart.bind(this));
    noble.on("scanStop", this.onScanStop.bind(this));
    noble.on("warning", this.onWarning.bind(this));
    noble.on("stateChange", this.onStateChange.bind(this));
  }

  start() {
    this.log.info("Start scanning.");
    try {
      noble.startScanning([], true);
    } catch (error) {
      this.emit("error", error);
    }
  }

  stop() {
    noble.stopScanning();
  }

  async onDiscover(peripheral) {
    if (peripheral.advertisement.localName) {
      if (peripheral.advertisement.localName == this.deviceName) {
        const serviceData = peripheral.advertisement.serviceData;
        for (const j in serviceData) {
          let b = serviceData[j].data

          let temp = b.readInt16LE(6, true) / 100.0;
          let humi = b.readInt16LE(8, true) / 100.0;
          let bat = b.readUInt8(12);

          this.emit("updateValues", {temp, humi, bat});

          this.stop();
        }
      }
    }
  }

  onScanStart() {
    this.log.info("Started scanning.");
  }

  onScanStop() {
    this.log.info("Stopped scanning.");
  }

  onWarning(message) {
    this.log.warn("Warning: ", message);
  }

  onStateChange(state) {
    this.log.info("State change?")
    if (state === "poweredOn") {
      noble.startScanning([], true);
    } else {
      noble.stopScanning();
    }
  }

  onNotify(state) {
    this.log.debug("Characteristics notification received.");
  }

  onDisconnect() {
    this.log.debug(`Disconnected.`);
  }
}
