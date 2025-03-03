import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ScheduleModule } from '@nestjs/schedule';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { DevicesModule } from './devices/devices.module';

@Module({
  imports: [
    ConfigModule.forRoot(),
    MongooseModule.forRoot(process.env.MONGODB_URI || 'mongodb+srv://pragatisinghbhumca21:pragati@cluster0.i8v6e.mongodb.net/iot'),
    ScheduleModule.forRoot(),
    AuthModule,
    DevicesModule,
  ],
})
export class AppModule {}
