import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type DeviceDocument = Device & Document;

export enum DeviceType {
  CAMERA = 'camera',
  FAN = 'fan',
  LIGHT = 'light',
  AC = 'ac',
  SECURITY_SYSTEM = 'security_system'
}

export enum DeviceStatus {
  ONLINE = 'online',
  OFFLINE = 'offline',
  MAINTENANCE = 'maintenance'
}

@Schema()
export class Device {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true, enum: DeviceType })
  type: DeviceType;

  @Prop({ required: true })
  location: string;

  @Prop({ enum: DeviceStatus, default: DeviceStatus.OFFLINE })
  status: DeviceStatus;

  @Prop({ default: false })
  isOn: boolean;

  @Prop()
  ipAddress: string;

  @Prop()
  macAddress: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  owner: MongooseSchema.Types.ObjectId;

  @Prop({ default: Date.now })
  lastMaintenance: Date;

  @Prop({ default: Date.now })
  createdAt: Date;

  @Prop({ type: Object })
  settings: Record<string, any>;
}

export const DeviceSchema = SchemaFactory.createForClass(Device); 