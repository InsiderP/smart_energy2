import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Device, DeviceDocument, DeviceStatus } from '../schemas/device.schema';
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
    // If we're updating isOn status, also update the device status accordingly
    if (typeof updateDeviceDto.isOn !== 'undefined') {
      updateDeviceDto.status = updateDeviceDto.isOn ? DeviceStatus.ONLINE : DeviceStatus.OFFLINE;
    }

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
    const baseMetrics = {
      temperature: this.generateRandomValue(20, 30),
      humidity: this.generateRandomValue(40, 60),
    };

    switch (device.type) {
      case 'camera':
        return {
          ...baseMetrics,
          quality: this.generateRandomValue(70, 100),
          motion: Math.random() > 0.7,
          temperature: this.generateRandomValue(25, 35),
        };
      case 'fan':
        return {
          ...baseMetrics,
          speed: this.generateRandomValue(0, 100),
          temperature: this.generateRandomValue(20, 30),
          humidity: this.generateRandomValue(40, 60),
        };
      case 'light':
        return {
          ...baseMetrics,
          brightness: this.generateRandomValue(0, 100),
          temperature: this.generateRandomValue(20, 40),
        };
      case 'ac':
        return {
          ...baseMetrics,
          temperature: this.generateRandomValue(16, 30),
          humidity: this.generateRandomValue(40, 60),
          fanSpeed: this.generateRandomValue(0, 100),
        };
      case 'security_system':
        return {
          ...baseMetrics,
          armed: Math.random() > 0.1,
          motion: Math.random() > 0.8,
          doorOpen: Math.random() > 0.9,
        };
      default:
        return baseMetrics;
    }
  }

  private calculateEnergyMetrics(device: Device, baseConsumption: number, usageMultiplier: number): any {
    const voltage = this.generateRandomValue(220, 240); // Assuming 230V ±5%
    const powerFactor = this.generateRandomValue(0.85, 0.95);
    const instantPower = device.isOn ? baseConsumption * usageMultiplier : 0.5;
    const current = instantPower / (voltage * powerFactor);
    
    return {
      instantPower,
      voltage,
      current,
      powerFactor,
      frequency: this.generateRandomValue(49.8, 50.2), // Assuming 50Hz grid
    };
  }

  private determineDeviceStatus(device: Device, metrics: any): DeviceStatus {
    // Check if device is responding (simulated with 98% uptime)
    const isResponding = Math.random() > 0.02;
    if (!isResponding) return DeviceStatus.OFFLINE;

    // Check if device needs maintenance based on metrics
    switch (device.type) {
      case 'camera':
        if (metrics.quality < 60) return DeviceStatus.MAINTENANCE;
        break;
      case 'fan':
        if (metrics.speed < 20 && device.isOn) return DeviceStatus.MAINTENANCE;
        break;
      case 'ac':
        if (Math.abs(metrics.temperature - 24) > 8 && device.isOn) return DeviceStatus.MAINTENANCE;
        break;
    }

    return DeviceStatus.ONLINE;
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
    try {
      console.log('Starting mock readings generation at:', new Date().toISOString());
    const devices = await this.deviceModel.find().exec();
      
      if (devices.length === 0) {
        console.log('No devices found to generate readings for');
        return;
      }

      console.log(`Found ${devices.length} devices to generate readings for`);
    
    for (const device of devices) {
      const baseConsumption = {
          camera: 5,
          fan: 60,
          light: 10,
          ac: 1500,
          security_system: 8,
      }[device.type] || 10;

      const timeOfDay = new Date().getHours();
      let usageMultiplier = 1;

        // Adjust energy consumption based on time of day and device type
        switch (device.type) {
          case 'light':
        usageMultiplier = (timeOfDay >= 18 || timeOfDay <= 6) ? 1 : 0.2;
            break;
          case 'ac':
            // Higher usage during peak hours (10 AM - 4 PM)
        usageMultiplier = (timeOfDay >= 10 && timeOfDay <= 16) ? 1.2 : 0.8;
            // Additional adjustment for seasonal variations (simulated)
            const month = new Date().getMonth();
            usageMultiplier *= (month >= 5 && month <= 8) ? 1.3 : 0.7; // Higher in summer months
            break;
          case 'fan':
            // Usage varies with time of day
            usageMultiplier = (timeOfDay >= 10 && timeOfDay <= 20) ? 1.1 : 0.7;
            break;
        }

        // Add random variation (±20%)
        const variation = this.generateRandomValue(-0.2, 0.2);
        usageMultiplier *= (1 + variation);

      const metrics = this.getDeviceTypeMetrics(device);
        const energyMetrics = this.calculateEnergyMetrics(device, baseConsumption, usageMultiplier);
        const deviceStatus = this.determineDeviceStatus(device, metrics);
      const alerts = this.generateAlerts(device, metrics);

        // Update device status in device collection if changed
        if (device.status !== deviceStatus) {
          await this.deviceModel.findByIdAndUpdate(device._id, { status: deviceStatus });
          console.log(`Updated status for device ${device.name} to ${deviceStatus}`);
        }

      const reading = new this.deviceReadingModel({
        deviceId: device._id,
        timestamp: new Date(),
          energyConsumption: energyMetrics.instantPower,
        status: device.isOn,
          deviceStatus,
          energyMetrics,
        metrics,
        alerts
      });

      await reading.save();
        console.log(`Generated reading for device: ${device.name} (${energyMetrics.instantPower.toFixed(2)}W)`);
      
      if (alerts.length > 0) {
        console.log(`Generated ${alerts.length} alerts for device: ${device.name}`);
          console.log('Alerts:', JSON.stringify(alerts, null, 2));
        }
      }

      console.log('Completed mock readings generation at:', new Date().toISOString());
    } catch (error) {
      console.error('Error generating mock readings:', error);
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
      .sort({ timestamp: -1 })
      .exec();

    // Calculate predictions using simple linear regression
    const predictedConsumption = this.generateMonthlyPrediction(readings);

    const totalEnergyConsumption = readings.reduce(
      (sum, reading) => sum + reading.energyConsumption,
      0
    );

    const avgEnergyConsumption = totalEnergyConsumption / readings.length || 0;

    // Calculate uptime percentage
    const totalReadings = readings.length;
    const onlineReadings = readings.filter(r => r.deviceStatus === DeviceStatus.ONLINE).length;
    const uptimePercentage = totalReadings > 0 ? (onlineReadings / totalReadings) * 100 : 0;

    // Get energy consumption by hour of day
    const hourlyConsumption = new Array(24).fill(0);
    const hourlyReadings = new Array(24).fill(0);
    
    readings.forEach(reading => {
      const hour = reading.timestamp.getHours();
      hourlyConsumption[hour] += reading.energyConsumption;
      hourlyReadings[hour]++;
    });

    const hourlyAverages = hourlyConsumption.map((total, hour) => ({
      hour,
      average: hourlyReadings[hour] ? total / hourlyReadings[hour] : 0
    }));

    // Calculate daily consumption trend
    const dailyConsumption = this.calculateDailyConsumption(readings);

    // Calculate peak usage times
    const peakUsage = this.calculatePeakUsage(readings);

    return {
      totalEnergyConsumption,
      avgEnergyConsumption,
      readingsCount: readings.length,
      lastReading: readings[0],
      uptime: uptimePercentage,
      hourlyConsumption: hourlyAverages,
      maintenanceCount: readings.filter(r => r.deviceStatus === DeviceStatus.MAINTENANCE).length,
      predictions: predictedConsumption,
      dailyConsumption,
      peakUsage,
      efficiencyScore: this.calculateEfficiencyScore(readings),
      anomalies: this.detectAnomalies(readings)
    };
  }

  private generateMonthlyPrediction(readings: DeviceReadingDocument[]): any {
    // Group readings by day
    const dailyData = readings.reduce((acc, reading) => {
      const date = reading.timestamp.toISOString().split('T')[0];
      if (!acc[date]) {
        acc[date] = { total: 0, count: 0 };
      }
      acc[date].total += reading.energyConsumption;
      acc[date].count++;
      return acc;
    }, {} as Record<string, { total: number; count: number }>);

    // Convert to daily averages
    const dailyAverages = Object.entries(dailyData)
      .map(([date, data]) => ({
        date: new Date(date),
        value: data.total / data.count
      }))
      .sort((a, b) => a.date.getTime() - b.date.getTime());

    // Simple linear regression for prediction
    const xValues = dailyAverages.map((_, i) => i);
    const yValues = dailyAverages.map(d => d.value);

    const n = xValues.length;
    const sumX = xValues.reduce((a, b) => a + b, 0);
    const sumY = yValues.reduce((a, b) => a + b, 0);
    const sumXY = xValues.reduce((sum, x, i) => sum + x * yValues[i], 0);
    const sumXX = xValues.reduce((sum, x) => sum + x * x, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    // Generate predictions for next 30 days
    const predictions = Array.from({ length: 30 }, (_, i) => {
      const predictedValue = slope * (xValues.length + i) + intercept;
      const date = new Date();
      date.setDate(date.getDate() + i);
      return {
        date: date.toISOString().split('T')[0],
        predicted: Math.max(0, predictedValue) // Ensure non-negative predictions
      };
    });

    return {
      predictions,
      trend: slope > 0 ? 'increasing' : slope < 0 ? 'decreasing' : 'stable',
      confidence: this.calculatePredictionConfidence(yValues, slope, intercept)
    };
  }

  private calculateDailyConsumption(readings: DeviceReadingDocument[]) {
    const dailyData = readings.reduce((acc, reading) => {
      const date = reading.timestamp.toISOString().split('T')[0];
      if (!acc[date]) {
        acc[date] = 0;
      }
      acc[date] += reading.energyConsumption;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(dailyData)
      .map(([date, consumption]) => ({ date, consumption }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }

  private calculatePeakUsage(readings: DeviceReadingDocument[]) {
    const hourlyUsage = new Array(24).fill(0);
    const hourlyCount = new Array(24).fill(0);

    readings.forEach(reading => {
      const hour = reading.timestamp.getHours();
      hourlyUsage[hour] += reading.energyConsumption;
      hourlyCount[hour]++;
    });

    return hourlyUsage.map((total, hour) => ({
      hour,
      average: hourlyCount[hour] ? total / hourlyCount[hour] : 0
    }))
    .sort((a, b) => b.average - a.average)
    .slice(0, 5); // Top 5 peak hours
  }

  private calculateEfficiencyScore(readings: DeviceReadingDocument[]) {
    if (readings.length === 0) return 0;

    const recentReadings = readings.slice(0, Math.min(readings.length, 100));
    const avgConsumption = recentReadings.reduce((sum, r) => sum + r.energyConsumption, 0) / recentReadings.length;
    const baselineConsumption = 100; // Adjust based on device type

    // Score from 0 to 100, lower consumption is better
    return Math.min(100, Math.max(0, 100 - (avgConsumption / baselineConsumption) * 100));
  }

  private detectAnomalies(readings: DeviceReadingDocument[]) {
    if (readings.length < 2) return [];

    const consumptions = readings.map(r => r.energyConsumption);
    const mean = consumptions.reduce((sum, val) => sum + val, 0) / consumptions.length;
    const stdDev = Math.sqrt(
      consumptions.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / consumptions.length
    );

    const threshold = 2; // Number of standard deviations for anomaly detection

    return readings
      .filter(reading => {
        const zScore = Math.abs(reading.energyConsumption - mean) / stdDev;
        return zScore > threshold;
      })
      .map(reading => ({
        timestamp: reading.timestamp,
        consumption: reading.energyConsumption,
        deviation: ((reading.energyConsumption - mean) / mean) * 100
      }))
      .slice(0, 10); // Return top 10 anomalies
  }

  private calculatePredictionConfidence(
    actualValues: number[],
    slope: number,
    intercept: number
  ): number {
    if (actualValues.length < 2) return 0;

    // Calculate R-squared value
    const yMean = actualValues.reduce((a, b) => a + b, 0) / actualValues.length;
    const predictedValues = actualValues.map((_, i) => slope * i + intercept);

    const ssRes = actualValues.reduce((sum, actual, i) => {
      return sum + Math.pow(actual - predictedValues[i], 2);
    }, 0);

    const ssTotal = actualValues.reduce((sum, actual) => {
      return sum + Math.pow(actual - yMean, 2);
    }, 0);

    const rSquared = 1 - (ssRes / ssTotal);
    return Math.max(0, Math.min(100, rSquared * 100));
  }
} 