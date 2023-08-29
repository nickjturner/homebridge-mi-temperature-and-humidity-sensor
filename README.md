
<span align="center">

# homebridge-mi-temperature-and-humidity-sensor

[![npm version](https://badgen.net/npm/v/homebridge-mi-temperature-and-humidity-sensor)](https://www.npmjs.com/package/homebridge-mi-temperature-and-humidity-sensor)
[![npm downloads](https://badgen.net/npm/dt/homebridge-mi-temperature-and-humidity-sensor)](https://www.npmjs.com/package/homebridge-mi-temperature-and-humidity-sensor)

<p>The Homebridge Mi Temperature and Humidity Sensor plugin allows you to add your Mi Sensor from HomeKit with
  <a href="https://homebridge.io">Homebridge</a>. 
</p>

</span>

## Compatibility

The LYWSD03MMC sensor is currently the only supported sensor for this plugin.

<img src="https://user-images.githubusercontent.com/67937058/188974059-88d12728-a846-4c14-8133-3424432ddb0e.jpeg" width="200" />

Before starting the installation you will have to flash the sensor to remove the encryption.

There are several ways to do this, but I recommend using this [flashing tool](https://pvvx.github.io/ATC_MiThermometer/TelinkMiFlasher.html) (This tool is not made by or supported by me).

For the BLE connection look at the noble [prerequisites](https://github.com/abandonware/noble#prerequisites) for your OS.

## Installation

### With [Homebridge Config UI X](https://github.com/oznu/homebridge-config-ui-x)
  1. Search for "homebridge-mi-temperature-and-humidity-sensor" on the plugin screen.
  2. Click **Install** on `homebridge-mi-temperature-and-humidity-sensor`
  3. Give the sensor a useful name. (This will appear in the HomeKit app).
  4. Add the MAC address. This can be found by using the above flashing tool, or by running `bluetoothctl scan le` from the terminal. The address will start with `A4:C1:38`.
  5. Restart Homebridge to pick up the new accessory.
  6. Repeat with as many sensors as you want.

### From Terminal
  1. Run the following to install the plugin:
  ```
  sudo npm i -g homebridge-mi-temperature-and-humidity-sensor@latest
  ```
  2. The config should look like:
  ```
  "accessories": [
      {
          "accessory": "MiSensor",
          "name": "Living Room Mi Sensor",
          "address": "a4:c1:38:b9:3f:72",
          "scanTimeout": 3600
      }
  ]
  ```
  3. `name` should be a useful name for the sensor. (This will appear in the HomeKit app).
  4. `address` is the device MAC address. This can be found by using the above flashing tool, or by running `bluetoothctl scan le` from the terminal. The address will start with `A4:C1:38`.
  5. `scanTimeout` is the interval in seconds between sensor scans. For example, 3600 (1 hour) can reduce sensor battery drain. The default is 1 minute.
  6. Restart Homebridge to pick up the new accessory.
  7. Repeat with as many sensors as you want.

## Troubleshooting

If you are having any problems open an issue in this repo and I will try to help.
