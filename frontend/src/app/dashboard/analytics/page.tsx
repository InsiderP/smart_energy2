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
  AreaChart,
  Area,
  Legend,
  ComposedChart,
  Scatter,
  ScatterChart,
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
  lastReading: {
    energyMetrics: {
      instantPower: number;
      voltage: number;
      current: number;
      powerFactor: number;
      frequency: number;
    };
    deviceStatus: string;
  };
  uptime: number;
  hourlyConsumption: Array<{ hour: number; average: number }>;
  maintenanceCount: number;
  predictions: {
    predictions: Array<{ date: string; predicted: number }>;
    trend: 'increasing' | 'decreasing' | 'stable';
    confidence: number;
  };
  dailyConsumption: Array<{ date: string; consumption: number }>;
  peakUsage: Array<{ hour: number; average: number }>;
  efficiencyScore: number;
  anomalies: Array<{
    timestamp: string;
    consumption: number;
    deviation: number;
  }>;
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

  function get24HourConsumption() {
    const hourlyData = devices.reduce((acc: Record<number, number>, device: Device) => {
      const stats = deviceStats[device._id];
      if (stats?.hourlyConsumption) {
        stats.hourlyConsumption.forEach(({ hour, average }: { hour: number; average: number }) => {
          acc[hour] = (acc[hour] || 0) + average;
        });
      }
      return acc;
    }, {});

    return Array.from({ length: 24 }, (_, hour) => ({
      hour,
      consumption: hourlyData[hour] || 0
    }));
  }

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
            <CardTitle className="text-lg text-green-600">Average Consumption</CardTitle>
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
            <CardTitle className="text-lg text-purple-600">Device Health</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Online Devices</span>
                <span className="text-sm font-medium text-green-600">
                  {devices.filter(d => deviceStats[d._id]?.lastReading?.deviceStatus === 'online').length}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Maintenance Required</span>
                <span className="text-sm font-medium text-yellow-600">
                  {devices.filter(d => deviceStats[d._id]?.lastReading?.deviceStatus === 'maintenance').length}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Offline Devices</span>
                <span className="text-sm font-medium text-red-600">
                  {devices.filter(d => deviceStats[d._id]?.lastReading?.deviceStatus === 'offline').length}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-white shadow-lg hover:shadow-xl transition-shadow duration-200">
          <CardHeader>
            <CardTitle className="text-lg text-indigo-600">Energy Consumption by Device</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart 
                  data={devices.map((device) => ({
                    name: device.name,
                    type: device.type,
                    consumption: deviceStats[device._id]?.totalEnergyConsumption || 0,
                  }))}
                  margin={{ top: 20, right: 30, left: 40, bottom: 100 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis 
                    dataKey="name" 
                    stroke="#4B5563"
                    interval={0}
                    angle={-45}
                    textAnchor="end"
                    height={100}
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis 
                    stroke="#4B5563"
                    tickFormatter={(value) => `${value.toFixed(0)}W`}
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip 
                    contentStyle={{ background: 'white', border: '1px solid #ddd' }}
                    cursor={{ fill: 'rgba(0, 0, 0, 0.1)' }}
                    formatter={(value: number, name: string, props: any) => [
                      `${value.toFixed(2)}W`,
                      `${props.payload.type} - Consumption`
                    ]}
                  />
                  <Bar 
                    dataKey="consumption" 
                    fill="#6366F1" 
                    radius={[4, 4, 0, 0]}
                    maxBarSize={50}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-lg hover:shadow-xl transition-shadow duration-200">
          <CardHeader>
            <CardTitle className="text-lg text-orange-600">Device Types Distribution</CardTitle>
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
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {getDeviceTypeData().map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
{/* 
        <Card className="bg-white shadow-lg hover:shadow-xl transition-shadow duration-200">
          <CardHeader>
            <CardTitle className="text-lg text-red-600">Consumption Anomalies</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart
                  margin={{ top: 20, right: 100, left: 40, bottom: 60 }}
                  data={devices.flatMap(device => {
                    const anomalies = deviceStats[device._id]?.anomalies || [];
                    // Take only last 5 anomalies for cleaner view
                    return anomalies.slice(-5).map(a => ({
                      date: new Date(a.timestamp).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric'
                      }),
                      [device.name]: a.consumption,
                      deviceType: device.type,
                      deviation: a.deviation
                    }));
                  })}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis
                    dataKey="date"
                    angle={-30}
                    textAnchor="end"
                    height={60}
                    interval={0}
                    tick={{ fontSize: 11 }}
                  />
                  <YAxis 
                    tickFormatter={(value) => `${value}W`}
                    tick={{ fontSize: 11 }}
                    width={50}
                  />
                  <Tooltip 
                    contentStyle={{ background: 'white', border: '1px solid #ddd', padding: '8px', fontSize: '12px' }}
                    formatter={(value: number, name: string, props: any) => [
                      `${value.toFixed(1)}W`,
                      `${name}`
                    ]}
                    labelStyle={{ fontWeight: 'bold', marginBottom: '4px', fontSize: '11px' }}
                  />
                  <Legend 
                    layout="vertical"
                    align="right"
                    verticalAlign="middle"
                    wrapperStyle={{ fontSize: '11px', paddingLeft: '10px' }}
                  />
                  {devices.map((device, index) => (
                    <>
                      <Line
                        key={`line-${device._id}`}
                        type="monotone"
                        dataKey={device.name}
                        name={device.name}
                        stroke={COLORS[index % COLORS.length]}
                        strokeWidth={2}
                        dot={{ r: 4, fill: COLORS[index % COLORS.length] }}
                        activeDot={{ r: 6 }}
                      />
                    </>
                  ))}
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card> */}

        <Card className="bg-white shadow-lg hover:shadow-xl transition-shadow duration-200 col-span-full">
          <CardHeader>
            <CardTitle className="text-lg text-green-600">Device Efficiency Scores</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={devices.map(device => ({
                    name: device.name,
                    type: device.type,
                    score: deviceStats[device._id]?.efficiencyScore || 0,
                  }))}
                  margin={{ top: 20, right: 30, left: 40, bottom: 60 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis
                    dataKey="name"
                    angle={-45}
                    textAnchor="end"
                    height={80}
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis 
                    domain={[0, 100]}
                    tickFormatter={(value) => `${value}%`}
                    label={{ 
                      value: 'Efficiency Score (%)', 
                      angle: -90, 
                      position: 'insideLeft',
                      style: { textAnchor: 'middle' }
                    }}
                  />
                  <Tooltip 
                    contentStyle={{ background: 'white', border: '1px solid #ddd', padding: '10px' }}
                    formatter={(value: number, name: string, props: any) => [
                      `${value.toFixed(1)}%`,
                      `${props.payload.type} - Efficiency`
                    ]}
                  />
                  <Bar
                    dataKey="score"
                    fill="#4CAF50"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={80}
                  >
                    {devices.map((device, index) => (
                      <Cell 
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-lg hover:shadow-xl transition-shadow duration-200 col-span-full">
          <CardHeader>
            <CardTitle className="text-lg text-teal-600">24-Hour Energy Consumption Pattern</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={get24HourConsumption()}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis 
                    dataKey="hour" 
                    stroke="#4B5563"
                    tickFormatter={(hour) => `${hour}:00`}
                  />
                  <YAxis stroke="#4B5563" />
                  <Tooltip 
                    contentStyle={{ background: 'white', border: '1px solid #ddd' }}
                    formatter={(value: number) => [`${value.toFixed(2)} W`, 'Consumption']}
                    labelFormatter={(hour: number) => `${hour}:00`}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="consumption" 
                    stroke="#0D9488" 
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-white shadow-lg hover:shadow-xl transition-shadow duration-200">
        <CardHeader>
          <CardTitle className="text-lg text-indigo-600">Prediction Insights</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {devices.map(device => {
              const stats = deviceStats[device._id];
              const predictions = stats?.predictions;
              if (!predictions) return null;

              return (
                <div key={device._id} className="space-y-2">
                  <h3 className="font-medium text-gray-900">{device.name}</h3>
                  <div className="space-y-1">
                    <p className="text-sm">
                      <span className="text-gray-600">Trend: </span>
                      <span className={`font-medium ${
                        predictions.trend === 'increasing' ? 'text-red-600' :
                        predictions.trend === 'decreasing' ? 'text-green-600' :
                        'text-yellow-600'
                      }`}
                      >
                        {predictions.trend.charAt(0).toUpperCase() + predictions.trend.slice(1)}
                      </span>
                    </p>
                    <p className="text-sm">
                      <span className="text-gray-600">Confidence: </span>
                      <span className="font-medium">{predictions.confidence.toFixed(1)}%</span>
                    </p>
                    <p className="text-sm">
                      <span className="text-gray-600">30-day Forecast: </span>
                      <span className="font-medium">
                        {(predictions.predictions[predictions.predictions.length - 1].predicted - 
                          predictions.predictions[0].predicted).toFixed(2)}W change
                      </span>
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white shadow-lg hover:shadow-xl transition-shadow duration-200">
        <CardHeader>
          <CardTitle className="text-lg text-gray-900">Device Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="divide-y">
            {devices.map((device) => {
              const stats = deviceStats[device._id];
              const status = stats?.lastReading?.deviceStatus || 'unknown';
              
              return (
                <div
                  key={device._id}
                  className="py-4 flex items-center justify-between hover:bg-gray-50 transition-colors duration-200"
                >
                  <div>
                    <p className="font-medium text-gray-900">{device.name}</p>
                    <div className="flex items-center space-x-2">
                      <p className="text-sm text-gray-500">{device.type}</p>
                      <span 
                        className={`px-2 py-0.5 rounded-full text-xs ${
                          status === 'online' 
                            ? 'bg-green-100 text-green-800'
                            : status === 'maintenance'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {status}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-900">
                      {stats?.totalEnergyConsumption.toFixed(2)} W
                    </p>
                    <div className="text-sm text-gray-500 space-y-1">
                      <p>Avg: {stats?.avgEnergyConsumption.toFixed(2)} W</p>
                      <p>Uptime: {stats?.uptime.toFixed(1)}%</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}