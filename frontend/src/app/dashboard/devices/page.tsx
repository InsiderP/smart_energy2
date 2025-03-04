'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import api, { API_ENDPOINTS } from '@/config/api';

interface Device {
  _id: string;
  name: string;
  type: string;
  location: string;
  status: string;
  isOn: boolean;
  ipAddress?: string;
  macAddress?: string;
  isLoading?: boolean;
}

export default function DevicesPage() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [isAddingDevice, setIsAddingDevice] = useState(false);
  const [newDevice, setNewDevice] = useState({
    name: '',
    type: '',
    location: '',
    ipAddress: '',
    macAddress: '',
  });

  const fetchDevices = async () => {
    try {
      const response = await api.get(API_ENDPOINTS.DEVICES);
      setDevices(response.data);
    } catch (err: any) {
      console.error('Error fetching devices:', err);
      setError(err.response?.data?.message || 'Failed to fetch devices');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDevices();
  }, []);

  const handleAddDevice = async () => {
    try {
      await api.post(API_ENDPOINTS.DEVICES, newDevice);
      setIsAddingDevice(false);
      setNewDevice({
        name: '',
        type: '',
        location: '',
        ipAddress: '',
        macAddress: '',
      });
      fetchDevices();
    } catch (err: any) {
      console.error('Error adding device:', err);
      setError(err.response?.data?.message || 'Failed to add device');
    }
  };

  const handleToggleDevice = async (deviceId: string, currentStatus: boolean) => {
    try {
      // Find the device in the current state and update its loading state
      setDevices(devices.map(d => 
        d._id === deviceId ? { ...d, isLoading: true } : d
      ));

      await api.put(API_ENDPOINTS.DEVICE(deviceId), { isOn: !currentStatus });
      
      // Fetch the updated device data
      const response = await api.get(API_ENDPOINTS.DEVICE(deviceId));
      
      // Update only the changed device in the state
      setDevices(devices.map(d => 
        d._id === deviceId ? { ...response.data, isLoading: false } : d
      ));

      setError('');
    } catch (err: any) {
      console.error('Error toggling device:', err);
      setError(err.response?.data?.message || 'Failed to toggle device');
      
      // Reset the loading state on error
      setDevices(devices.map(d => 
        d._id === deviceId ? { ...d, isLoading: false } : d
      ));
    }
  };

  const handleDeleteDevice = async (deviceId: string) => {
    try {
      await api.delete(API_ENDPOINTS.DEVICE(deviceId));
      fetchDevices();
    } catch (err: any) {
      console.error('Error deleting device:', err);
      setError(err.response?.data?.message || 'Failed to delete device');
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Devices</h2>
        <Dialog open={isAddingDevice} onOpenChange={setIsAddingDevice}>
          <DialogTrigger asChild>
            <Button>Add Device</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Device</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Name</label>
                <Input
                  value={newDevice.name}
                  onChange={(e) =>
                    setNewDevice({ ...newDevice, name: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="text-sm font-medium">Type</label>
                <Input
                  value={newDevice.type}
                  onChange={(e) =>
                    setNewDevice({ ...newDevice, type: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="text-sm font-medium">Location</label>
                <Input
                  value={newDevice.location}
                  onChange={(e) =>
                    setNewDevice({ ...newDevice, location: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="text-sm font-medium">IP Address</label>
                <Input
                  value={newDevice.ipAddress}
                  onChange={(e) =>
                    setNewDevice({ ...newDevice, ipAddress: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="text-sm font-medium">MAC Address</label>
                <Input
                  value={newDevice.macAddress}
                  onChange={(e) =>
                    setNewDevice({ ...newDevice, macAddress: e.target.value })
                  }
                />
              </div>
              <Button onClick={handleAddDevice} className="w-full">
                Add Device
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {devices.map((device) => (
          <Card key={device._id}>
            <CardHeader>
              <CardTitle className="flex justify-between items-center">
                <span>{device.name}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteDevice(device._id)}
                >
                  Delete
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p>
                  <span className="font-medium">Type:</span> {device.type}
                </p>
                <p>
                  <span className="font-medium">Location:</span> {device.location}
                </p>
                <p>
                  <span className="font-medium">Status:</span>{' '}
                  <span
                    className={
                      device.status === 'online'
                        ? 'text-green-600'
                        : 'text-red-600'
                    }
                  >
                    {device.status}
                  </span>
                </p>
                {device.ipAddress && (
                  <p>
                    <span className="font-medium">IP:</span> {device.ipAddress}
                  </p>
                )}
                {device.macAddress && (
                  <p>
                    <span className="font-medium">MAC:</span> {device.macAddress}
                  </p>
                )}
                <Button
                  variant={device.isOn ? 'destructive' : 'default'}
                  className="w-full mt-4"
                  onClick={() => handleToggleDevice(device._id, device.isOn)}
                  disabled={device.isLoading}
                >
                  {device.isLoading ? 'Updating...' : (device.isOn ? 'Turn Off' : 'Turn On')}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
} 