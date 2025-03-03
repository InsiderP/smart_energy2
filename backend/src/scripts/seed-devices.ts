import { MongoClient } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://pragatisinghbhumca21:pragati@cluster0.i8v6e.mongodb.net/iot';

const devices = [
  {
    name: 'Living Room Camera',
    type: 'camera',
    location: 'Living Room',
    status: 'online',
    isOn: true,
    ipAddress: '192.168.1.100',
    macAddress: '00:1B:44:11:3A:B7',
  },
  {
    name: 'Bedroom Smart Fan',
    type: 'fan',
    location: 'Bedroom',
    status: 'online',
    isOn: true,
    ipAddress: '192.168.1.101',
    macAddress: '00:1B:44:11:3A:B8',
  },
  {
    name: 'Kitchen Smart Light',
    type: 'light',
    location: 'Kitchen',
    status: 'online',
    isOn: true,
    ipAddress: '192.168.1.102',
    macAddress: '00:1B:44:11:3A:B9',
  },
  {
    name: 'Living Room AC',
    type: 'ac',
    location: 'Living Room',
    status: 'online',
    isOn: true,
    ipAddress: '192.168.1.103',
    macAddress: '00:1B:44:11:3A:C0',
  },
  {
    name: 'Front Door Security System',
    type: 'security_system',
    location: 'Front Door',
    status: 'online',
    isOn: true,
    ipAddress: '192.168.1.104',
    macAddress: '00:1B:44:11:3A:C1',
  },
];

async function seedDevices() {
  try {
    const client = await MongoClient.connect(MONGODB_URI);
    const db = client.db();

    // Get the first user from the database
    const user = await db.collection('users').findOne({});
    if (!user) {
      console.error('No user found in the database');
      await client.close();
      return;
    }

    // Add owner field to each device
    const devicesWithOwner = devices.map(device => ({
      ...device,
      owner: user._id,
      createdAt: new Date(),
      lastMaintenance: new Date(),
    }));

    // Insert devices
    await db.collection('devices').insertMany(devicesWithOwner);
    console.log('Devices seeded successfully');

    await client.close();
  } catch (error) {
    console.error('Error seeding devices:', error);
  }
}

seedDevices(); 