# Smart Energy Monitoring System

A comprehensive IoT-based energy monitoring solution for smart homes and buildings. This system provides real-time monitoring, analytics, and predictions for energy consumption across multiple devices.

## System Architecture

### High-Level Design

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   IoT Devices   │ --> │    Backend      │ --> │    Frontend     │
│  (Smart Meters) │     │   (Node.js)     │     │   (Next.js)     │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                               │
                        ┌─────────────────┐
                        │   MongoDB       │
                        │   Database      │
                        └─────────────────┘
```

### Components

1. **IoT Layer**
   - Smart energy meters and sensors
   - Real-time data collection
   - Protocols: MQTT/HTTP
   - Metrics: Voltage, Current, Power Factor, Energy Consumption

2. **Backend (Node.js)**
   - RESTful API endpoints
   - Real-time data processing
   - ML-based anomaly detection
   - Energy consumption predictions
   - Device management
   - Authentication & Authorization

3. **Frontend (Next.js + TypeScript)**
   - Real-time dashboard
   - Interactive analytics
   - Device management interface
   - Responsive design
   - Charts and visualizations using Recharts

4. **Database (MongoDB)**
   - Device information
   - Energy consumption data
   - User settings
   - Historical analytics
   - Anomaly records

## Features

### 1. Real-time Monitoring
- Live energy consumption tracking
- Device status monitoring
- Power quality metrics
- Instant alerts for anomalies

### 2. Analytics Dashboard
- Total energy consumption
- Device-wise consumption
- Efficiency scores
- Device health status
- 24-hour consumption patterns
- Device type distribution

### 3. Smart Analytics
- Anomaly detection
- Consumption predictions
- Efficiency analysis
- Device performance metrics
- Maintenance predictions

### 4. Device Management
- Add/Remove devices
- Device categorization
- Status monitoring
- Maintenance scheduling

## Technical Stack

### Frontend
- Next.js 13+ (React Framework)
- TypeScript
- Tailwind CSS
- Recharts (Visualization)
- ShadcnUI Components
- Real-time WebSocket updates

### Backend
- Node.js
- Express.js
- MongoDB
- JWT Authentication
- WebSocket (Socket.io)
- ML Models for predictions

### Database Schema

```
Devices
├── _id
├── name
├── type
├── status
└── configuration

DeviceStats
├── deviceId
├── totalEnergyConsumption
├── hourlyConsumption
├── anomalies
├── predictions
└── efficiencyScore

Readings
├── deviceId
├── timestamp
├── energyMetrics
└── deviceStatus
```

## API Endpoints

### Device Management
```
GET    /api/devices
POST   /api/devices
GET    /api/devices/:id
PUT    /api/devices/:id
DELETE /api/devices/:id
```

### Analytics
```
GET    /api/stats/device/:id
GET    /api/stats/consumption
GET    /api/stats/anomalies
GET    /api/stats/predictions
```

## Getting Started

1. **Clone the Repository**
   ```bash
   git clone [repository-url]
   ```

2. **Install Dependencies**
   ```bash
   # Frontend
   cd frontend
   npm install

   # Backend
   cd backend
   npm install
   ```

3. **Environment Setup**
   ```bash
   # Frontend (.env.local)
   NEXT_PUBLIC_API_URL=http://localhost:3001

   # Backend (.env)
   PORT=3001
   MONGODB_URI=mongodb://localhost:27017/energy-monitor
   JWT_SECRET=your-secret-key
   ```

4. **Run the Application**
   ```bash
   # Frontend
   npm run dev

   # Backend
   npm run dev
   ```

## Security Features

- JWT-based authentication
- Role-based access control
- Encrypted data transmission
- Rate limiting
- Input validation
- CORS protection

## Monitoring & Maintenance

- Automated error logging
- Performance monitoring
- Regular data backups
- Automated testing
- CI/CD pipeline integration

## Future Enhancements

1. AI-powered optimization suggestions
2. Mobile application
3. Integration with smart home platforms
4. Advanced reporting features
5. Multi-location support

## Contributing

Please read CONTRIBUTING.md for details on our code of conduct and the process for submitting pull requests.

## License

This project is licensed under the MIT License - see the LICENSE.md file for details. 