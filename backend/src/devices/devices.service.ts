import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Device, DeviceDocument } from '../schemas/device.schema';
import { DeviceReading, DeviceReadingDocument } from '../schemas/device-reading.schema';
import { Cron, CronExpression } from '@nestjs/schedule';

interface DeviceAlert {
  type: string;
  message: string;
  severity: 'low' | 'medium' | 'high';
  timestamp: Date;
}

@Injectable()
export class DevicesService {
  constructor(
    @InjectModel(Device.name) private deviceModel: Model<DeviceDocument>,
    @InjectModel(DeviceReading.name)
    private deviceReadingModel: Model<DeviceReadingDocument>,
  ) {}

  async createDevice(createDeviceDto: any): Promise<Device> {
    const newDevice = new this.deviceModel(createDeviceDto);
    return newDevice.save();
  }

  async getAllDevices(): Promise<Device[]> {
    return this.deviceModel.find().exec();
  }

  async getDevice(id: string): Promise<Device> {
    const device = await this.deviceModel.findById(id).exec();
    if (!device) {
      throw new NotFoundException('Device not found');
    }
    return device;
  }

  async updateDevice(id: string, updateDeviceDto: any): Promise<Device> {
    const device = await this.deviceModel
      .findByIdAndUpdate(id, updateDeviceDto, { new: true })
      .exec();
    if (!device) {
      throw new NotFoundException('Device not found');
    }
    return device;
  }

  async deleteDevice(id: string): Promise<void> {
    const result = await this.deviceModel.deleteOne({ _id: id }).exec();
    if (result.deletedCount === 0) {
      throw new NotFoundException('Device not found');
    }
  }

  async getDeviceReadings(deviceId: string, startDate: Date, endDate: Date) {
    return this.deviceReadingModel
      .find({
        deviceId,
        timestamp: {
          $gte: startDate,
          $lte: endDate,
        },
      })
      .sort({ timestamp: -1 })
      .exec();
  }

  private generateRandomValue(min: number, max: number): number {
    return Math.random() * (max - min) + min;
  }

  private getDeviceTypeMetrics(device: Device) {
    switch (device.type) {
      case 'camera':
        return {
          quality: this.generateRandomValue(70, 100), // Video quality (%)
          motion: Math.random() > 0.7, // 30% chance of motion detection
          temperature: this.generateRandomValue(25, 35), // Device temperature
        };
      case 'fan':
        return {
          speed: this.generateRandomValue(0, 100), // Fan speed (%)
          temperature: this.generateRandomValue(20, 30),
          humidity: this.generateRandomValue(40, 60),
        };
      case 'light':
        return {
          brightness: this.generateRandomValue(0, 100), // Light brightness (%)
          temperature: this.generateRandomValue(20, 40),
        };
      case 'ac':
        return {
          temperature: this.generateRandomValue(16, 30),
          humidity: this.generateRandomValue(40, 60),
          fanSpeed: this.generateRandomValue(0, 100),
        };
      case 'security_system':
        return {
          armed: Math.random() > 0.1, // 90% chance of being armed
          motion: Math.random() > 0.8, // 20% chance of motion detection
          doorOpen: Math.random() > 0.9, // 10% chance of door being open
        };
      default:
        return {};
    }
  }

  private generateAlerts(device: Device, metrics: any): DeviceAlert[] {
    const alerts: DeviceAlert[] = [];
    const now = new Date();

    switch (device.type) {
      case 'camera':
        if (metrics.quality < 80) {
          alerts.push({
            type: 'quality_degradation',
            message: 'Camera quality is below optimal levels',
            severity: 'medium',
            timestamp: now
          });
        }
        if (metrics.temperature > 32) {
          alerts.push({
            type: 'high_temperature',
            message: 'Camera temperature is above normal range',
            severity: 'high',
            timestamp: now
          });
        }
        break;

      case 'fan':
        if (metrics.humidity > 55) {
          alerts.push({
            type: 'high_humidity',
            message: 'Room humidity is above comfortable levels',
            severity: 'low',
            timestamp: now
          });
        }
        break;

      case 'light':
        if (metrics.temperature > 35) {
          alerts.push({
            type: 'high_temperature',
            message: 'Light fixture temperature is above normal range',
            severity: 'medium',
            timestamp: now
          });
        }
        break;

      case 'ac':
        if (metrics.temperature > 28) {
          alerts.push({
            type: 'cooling_inefficiency',
            message: 'AC is not maintaining desired temperature',
            severity: 'medium',
            timestamp: now
          });
        }
        if (metrics.humidity > 55) {
          alerts.push({
            type: 'dehumidification_required',
            message: 'Room humidity is above comfortable levels',
            severity: 'low',
            timestamp: now
          });
        }
        break;

      case 'security_system':
        if (metrics.motion && metrics.doorOpen) {
          alerts.push({
            type: 'security_breach',
            message: 'Motion detected with door open',
            severity: 'high',
            timestamp: now
          });
        }
        if (!metrics.armed) {
          alerts.push({
            type: 'system_disarmed',
            message: 'Security system is not armed',
            severity: 'medium',
            timestamp: now
          });
        }
        break;
    }

    return alerts;
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async generateMockReadings() {
    console.log('Generating mock readings...'); // Debug log
    const devices = await this.deviceModel.find().exec();
    
    for (const device of devices) {
      // Base energy consumption for each device type
      const baseConsumption = {
        camera: 5, // 5W
        fan: 60, // 60W
        light: 10, // 10W
        ac: 1500, // 1500W
        security_system: 8, // 8W
      }[device.type] || 10;

      // Add some random variation to energy consumption
      const timeOfDay = new Date().getHours();
      let usageMultiplier = 1;

      // Adjust energy consumption based on time of day
      if (device.type === 'light') {
        // Lights use more energy in evening/night
        usageMultiplier = (timeOfDay >= 18 || timeOfDay <= 6) ? 1 : 0.2;
      } else if (device.type === 'ac') {
        // AC uses more energy during hot hours of the day
        usageMultiplier = (timeOfDay >= 10 && timeOfDay <= 16) ? 1.2 : 0.8;
      }

      const variation = this.generateRandomValue(-0.2, 0.2); // ±20%
      const energyConsumption = device.isOn 
        ? baseConsumption * (1 + variation) * usageMultiplier
        : 0.5; // Standby power

      const metrics = this.getDeviceTypeMetrics(device);
      const alerts = this.generateAlerts(device, metrics);

      const reading = new this.deviceReadingModel({
        deviceId: device._id,
        timestamp: new Date(),
        energyConsumption,
        status: device.isOn,
        metrics,
        alerts
      });

      await reading.save();
      console.log(`Generated reading for device: ${device.name}`); // Debug log
      
      if (alerts.length > 0) {
        console.log(`Generated ${alerts.length} alerts for device: ${device.name}`);
      }
    }
  }

  async getDeviceStats(deviceId: string) {
    const now = new Date();
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const readings = await this.deviceReadingModel
      .find({
        deviceId,
        timestamp: { $gte: monthAgo },
      })
      .exec();

    const totalEnergyConsumption = readings.reduce(
      (sum, reading) => sum + reading.energyConsumption,
      0,
    );

    const avgEnergyConsumption = totalEnergyConsumption / readings.length || 0;

    return {
      totalEnergyConsumption,
      avgEnergyConsumption,
      readingsCount: readings.length,
      lastReading: readings[0],
    };
  }
} 