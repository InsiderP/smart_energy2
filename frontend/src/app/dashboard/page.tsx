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
} from 'recharts';
import { API_ENDPOINTS } from '@/config/api';
import Cookies from 'js-cookie';
import { useRouter } from 'next/navigation';

interface Device {
  _id: string;
  name: string;
  type: string;
  location: string;
  status: string;
  isOn: boolean;
}

interface DeviceReading {
  timestamp: string;
  energyConsumption: number;
  status: boolean;
  metrics: {
    temperature?: number;
    humidity?: number;
    motion?: boolean;
    speed?: number;
    quality?: number;
    brightness?: number;
    fanSpeed?: number;
    armed?: boolean;
    doorOpen?: boolean;
  };
}

export default function DashboardPage() {
  const router = useRouter();
  const [devices, setDevices] = useState<Device[]>([]);
  const [readings, setReadings] = useState<DeviceReading[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = Cookies.get('auth_token');
    if (!token) {
      router.replace('/login');
      return;
    }

    async function fetchData() {
      try {
        // Fetch devices
        const devicesRes = await fetch(API_ENDPOINTS.DEVICES, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!devicesRes.ok) {
          throw new Error('Failed to fetch devices');
        }

        const devicesData = await devicesRes.json();
        setDevices(devicesData);

        // Fetch readings for first device
        if (devicesData.length > 0) {
          const deviceId = devicesData[0]._id;
          const endDate = new Date();
          const startDate = new Date();
          startDate.setHours(startDate.getHours() - 24);

          const readingsRes = await fetch(
            `${API_ENDPOINTS.DEVICE_READINGS(deviceId)}?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`,
            {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            }
          );

          if (!readingsRes.ok) {
            throw new Error('Failed to fetch readings');
          }

          const readingsData = await readingsRes.json();
          setReadings(readingsData);
        }
      } catch (err: any) {
        console.error('Error:', err);
        setError(err.message || 'Failed to load data');
        if (err.message?.includes('unauthorized') || err.message?.includes('Unauthorized')) {
          Cookies.remove('auth_token');
          router.replace('/login');
        }
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [router]);

  const renderDeviceStatus = (device: Device) => {
    const statusColors = {
      online: 'bg-green-100 text-green-800',
      offline: 'bg-red-100 text-red-800',
      maintenance: 'bg-yellow-100 text-yellow-800'
    };

    return (
      <span className={`px-2 py-1 rounded-full text-sm ${statusColors[device.status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800'}`}>
        {device.status}
      </span>
    );
  };

  const renderMetrics = (device: Device) => {
    const latestReading = readings[readings.length - 1];
    if (!latestReading?.metrics) return null;

    const metrics = [];
    if (latestReading.metrics.temperature) {
      metrics.push(`${latestReading.metrics.temperature.toFixed(1)}°C`);
    }
    if (latestReading.metrics.humidity) {
      metrics.push(`${latestReading.metrics.humidity.toFixed(1)}% Humidity`);
    }
    if (latestReading.metrics.brightness) {
      metrics.push(`${latestReading.metrics.brightness.toFixed(1)}% Brightness`);
    }

    return metrics.length > 0 ? (
      <p className="text-sm text-gray-500 mt-1">{metrics.join(' • ')}</p>
    ) : null;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-t-blue-500 border-b-blue-500 rounded-full animate-spin"></div>
          <p className="mt-4 text-lg">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Total Devices</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{devices.length}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Active Devices</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">
              {devices.filter(d => d.isOn).length}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Total Energy</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">
              {readings.length > 0 
                ? `${readings[readings.length - 1].energyConsumption.toFixed(2)} W`
                : '0 W'}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Device Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {devices.map(device => (
                <div key={device._id} className="p-4 border rounded-lg">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium">{device.name}</h3>
                      <p className="text-sm text-gray-500">{device.type} • {device.location}</p>
                      {renderMetrics(device)}
                    </div>
                    <div className="text-right">
                      {renderDeviceStatus(device)}
                      <p className="text-sm text-gray-500 mt-1">
                        {device.isOn ? 'Active' : 'Inactive'}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Energy Consumption</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[400px] flex items-center justify-center">
              {readings.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={readings}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="timestamp"
                      tickFormatter={(value) => new Date(value).toLocaleTimeString()}
                    />
                    <YAxis />
                    <Tooltip
                      labelFormatter={(value) => new Date(value).toLocaleString()}
                      formatter={(value: number) => [`${value.toFixed(2)} W`, 'Energy']}
                    />
                    <Line
                      type="monotone"
                      dataKey="energyConsumption"
                      stroke="#3b82f6"
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-gray-500">No energy consumption data available</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 