'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import api, { API_ENDPOINTS } from '@/config/api';

interface DeviceStats {
  totalDevices: number;
  onlineDevices: number;
  offlineDevices: number;
}

interface Device {
  _id: string;
  name: string;
  type: string;
  status: string;
  isOn: boolean;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DeviceStats>({
    totalDevices: 0,
    onlineDevices: 0,
    offlineDevices: 0
  });
  const [recentDevices, setRecentDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Fetch devices
        const response = await api.get(API_ENDPOINTS.DEVICES);
        const devices = response.data;

        // Calculate stats
        const totalDevices = devices.length;
        const onlineDevices = devices.filter((d: Device) => d.status === 'online').length;
        const offlineDevices = totalDevices - onlineDevices;

        setStats({
          totalDevices,
          onlineDevices,
          offlineDevices
        });

        // Get 5 most recent devices
        setRecentDevices(devices.slice(0, 5));
        
      } catch (err: any) {
        console.error('Error fetching dashboard data:', err);
        setError(err.response?.data?.message || 'Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-t-blue-500 border-b-blue-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Dashboard Overview</h1>
      
      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-md">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Total Devices</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats.totalDevices}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Online Devices</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-600">{stats.onlineDevices}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Offline Devices</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-red-600">{stats.offlineDevices}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Devices</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="divide-y">
            {recentDevices.map((device) => (
              <div key={device._id} className="py-4 flex justify-between items-center">
                <div>
                  <p className="font-medium">{device.name}</p>
                  <p className="text-sm text-gray-500">{device.type}</p>
                </div>
                <div>
                  <span 
                    className={`px-3 py-1 rounded-full text-sm ${
                      device.status === 'online' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {device.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 