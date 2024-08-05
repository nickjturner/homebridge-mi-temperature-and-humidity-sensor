import { EventEmitter } from "events";
import { Logging } from "homebridge";
import noble from "@abandonware/noble";

export class Scanner extends EventEmitter {
  private readonly log: Logging;

  private address: string;

  constructor(log: Logging, address: string) {
    super();

    this.log = log;
    this.address = address.replace(':', '').toLowerCase();
    this.log.debug(process.env.inspect ?? "no env");

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
    try {
      this.log.debug("Scanning...");
      noble.startScanning([], true);
    } catch (error) {
      this.emit("error", error);
    }
  }

  stop() {
    noble.stopScanning();
  }

  async onDiscover(peripheral) {
    if (peripheral.address) {
      if (peripheral.address.replace(':', '').toLowerCase() == this.address) {
        this.log.debug("device found: " + peripheral.address);
        const serviceData = peripheral.advertisement.serviceData;
        for (const j in serviceData) {
          let b = serviceData[j].data

          const temp = b.readUInt16LE(0) / 100;
          const humi = b.readUInt8(2);
          const bat = b.readUInt16LE(3);

          this.emit("updateValues", { temp, humi, bat });

          this.stop();
        }
      }
    }
  }

  onScanStart() {
    this.log.debug("Started scanning.");
  }

  onScanStop() {
    this.log.debug("Stopped scanning.");
  }

  onWarning(message) {
    this.log.warn("Warning: ", message);
  }

  onStateChange(state) {
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
