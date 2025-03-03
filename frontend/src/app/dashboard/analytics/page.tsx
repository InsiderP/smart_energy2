'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import api, { API_ENDPOINTS } from '@/config/api';
import { Skeleton } from "@/components/ui/skeleton";

interface Device {
  _id: string;
  name: string;
  type: string;
}

interface DeviceStats {
  totalEnergyConsumption: number;
  avgEnergyConsumption: number;
  readingsCount: number;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export default function AnalyticsPage() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [deviceStats, setDeviceStats] = useState<Record<string, DeviceStats>>({});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const fetchData = async () => {
    try {
      const devicesRes = await api.get(API_ENDPOINTS.DEVICES);
      setDevices(devicesRes.data);

      const stats: Record<string, DeviceStats> = {};
      for (const device of devicesRes.data) {
        const statsRes = await api.get(API_ENDPOINTS.DEVICE_STATS(device._id));
        stats[device._id] = statsRes.data;
      }
      setDeviceStats(stats);
      setLastUpdated(new Date());
    } catch (err: any) {
      console.error('Error fetching analytics data:', err);
      setError(err.response?.data?.message || 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // Set up interval for real-time updates
    const interval = setInterval(fetchData, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, []);

  const getTotalConsumption = () => {
    return Object.values(deviceStats).reduce(
      (sum, stats) => sum + stats.totalEnergyConsumption,
      0
    );
  };

  const getAverageConsumption = () => {
    const total = getTotalConsumption();
    const deviceCount = Object.keys(deviceStats).length;
    return deviceCount > 0 ? total / deviceCount : 0;
  };

  const getDeviceTypeData = () => {
    const typeCount: Record<string, number> = {};
    devices.forEach((device) => {
      typeCount[device.type] = (typeCount[device.type] || 0) + 1;
    });
    return Object.entries(typeCount).map(([name, value]) => ({ name, value }));
  };

  const getConsumptionByDevice = () => {
    return devices.map((device) => ({
      name: device.name,
      consumption: deviceStats[device._id]?.totalEnergyConsumption || 0,
    }));
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold">Analytics</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="bg-white shadow-lg">
              <CardHeader>
                <Skeleton className="h-4 w-[200px]" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-[100px]" />
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[1, 2].map((i) => (
            <Card key={i} className="bg-white shadow-lg">
              <CardHeader>
                <Skeleton className="h-4 w-[200px]" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-[300px] w-full" />
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="bg-white shadow-lg">
          <CardHeader>
            <Skeleton className="h-4 w-[200px]" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex justify-between items-center">
                  <div>
                    <Skeleton className="h-4 w-[150px] mb-2" />
                    <Skeleton className="h-3 w-[100px]" />
                  </div>
                  <div>
                    <Skeleton className="h-4 w-[100px] mb-2" />
                    <Skeleton className="h-3 w-[80px]" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Analytics</h2>
        <div className="text-sm text-gray-500">
          Last updated: {lastUpdated.toLocaleTimeString()}
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="bg-white shadow-lg hover:shadow-xl transition-shadow duration-200">
          <CardHeader>
            <CardTitle className="text-lg text-blue-600">Total Energy Consumption</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-gray-900">{getTotalConsumption().toFixed(2)} W</p>
            <p className="text-sm text-gray-500 mt-1">Across all devices</p>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-lg hover:shadow-xl transition-shadow duration-200">
          <CardHeader>
            <CardTitle className="text-lg text-green-600">Average Consumption per Device</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-gray-900">
              {getAverageConsumption().toFixed(2)} W
            </p>
            <p className="text-sm text-gray-500 mt-1">Per device average</p>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-lg hover:shadow-xl transition-shadow duration-200">
          <CardHeader>
            <CardTitle className="text-lg text-purple-600">Total Devices</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-gray-900">{devices.length}</p>
            <p className="text-sm text-gray-500 mt-1">Connected devices</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-white shadow-lg hover:shadow-xl transition-shadow duration-200">
          <CardHeader>
            <CardTitle className="text-lg text-indigo-600">Energy Consumption by Device</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={getConsumptionByDevice()}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="name" stroke="#4B5563" />
                  <YAxis stroke="#4B5563" />
                  <Tooltip 
                    contentStyle={{ background: 'white', border: '1px solid #ddd' }}
                    cursor={{ fill: 'rgba(0, 0, 0, 0.1)' }}
                  />
                  <Bar dataKey="consumption" fill="#6366F1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-lg hover:shadow-xl transition-shadow duration-200">
          <CardHeader>
            <CardTitle className="text-lg text-pink-600">Device Types Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={getDeviceTypeData()}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label
                  >
                    {getDeviceTypeData().map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                        className="hover:opacity-80 transition-opacity duration-200"
                      />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: 'white', border: '1px solid #ddd' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-white shadow-lg hover:shadow-xl transition-shadow duration-200">
        <CardHeader>
          <CardTitle className="text-lg text-gray-900">Device Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="divide-y">
            {devices.map((device) => (
              <div
                key={device._id}
                className="py-4 flex items-center justify-between hover:bg-gray-50 transition-colors duration-200"
              >
                <div>
                  <p className="font-medium text-gray-900">{device.name}</p>
                  <p className="text-sm text-gray-500">{device.type}</p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-gray-900">
                    {deviceStats[device._id]?.totalEnergyConsumption.toFixed(2)} W
                  </p>
                  <p className="text-sm text-gray-500">
                    Avg: {deviceStats[device._id]?.avgEnergyConsumption.toFixed(2)} W
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 