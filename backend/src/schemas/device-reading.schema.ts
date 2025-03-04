import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { DeviceStatus } from './device.schema';

export type DeviceReadingDocument = DeviceReading & Document;

@Schema()
export class DeviceReading {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Device', required: true })
  deviceId: MongooseSchema.Types.ObjectId;

  @Prop({ required: true })
  timestamp: Date;

  @Prop({ required: true })
  energyConsumption: number; // in watts

  @Prop({ required: true })
  status: boolean; // on/off

  @Prop({ enum: DeviceStatus, required: true })
  deviceStatus: DeviceStatus; // online/offline/maintenance status

  @Prop({ type: Object })
  energyMetrics: {
    instantPower: number; // current power draw in watts
    voltage: number; // voltage reading
    current: number; // current in amperes
    powerFactor: number; // power factor
    frequency: number; // power frequency in Hz
  };

  @Prop({ type: Object })
  metrics: {
    temperature?: number;
    humidity?: number;
    brightness?: number;
    motion?: boolean;
    speed?: number; // for fans
    quality?: number; // for camera feed
  };

  @Prop({ type: [Object] })
  alerts: [{
    type: string;
    message: string;
    severity: 'low' | 'medium' | 'high';
    timestamp: Date;
  }];
}

export const DeviceReadingSchema = SchemaFactory.createForClass(DeviceReading); 