import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  Request,
} from '@nestjs/common';
import { DevicesService } from './devices.service';

@Controller('devices')
export class DevicesController {
  constructor(private readonly devicesService: DevicesService) {}

  @Post()
  async createDevice(@Request() req, @Body() createDeviceDto: any) {
    const deviceWithOwner = {
      ...createDeviceDto,
      owner: req.user.userId,
    };
    return this.devicesService.createDevice(deviceWithOwner);
  }

  @Get()
  async getAllDevices() {
    return this.devicesService.getAllDevices();
  }

  @Get(':id')
  async getDevice(@Param('id') id: string) {
    return this.devicesService.getDevice(id);
  }

  @Put(':id')
  async updateDevice(@Param('id') id: string, @Body() updateDeviceDto: any) {
    return this.devicesService.updateDevice(id, updateDeviceDto);
  }

  @Delete(':id')
  async deleteDevice(@Param('id') id: string) {
    return this.devicesService.deleteDevice(id);
  }

  @Get(':id/readings')
  async getDeviceReadings(
    @Param('id') id: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.devicesService.getDeviceReadings(
      id,
      new Date(startDate),
      new Date(endDate),
    );
  }

  @Get(':id/stats')
  async getDeviceStats(@Param('id') id: string) {
    return this.devicesService.getDeviceStats(id);
  }
} 