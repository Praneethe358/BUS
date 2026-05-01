# Database Schema Migration Guide

## Overview
This migration adds critical missing fields, models, and indexes to support complete bus tracking functionality with role-based access control and location history.

## Changes Summary

### 1. Bus Model Updates
#### New Fields Added:
- `driverId` (ObjectId ref) - Reference to assigned driver
- `capacity` (Number) - Bus seating capacity (default: 50)
- `occupancy` (Number) - Current passenger count
- `isActive` (Boolean) - Track active routes only
- `status` (Enum) - Bus state: 'inactive', 'in-transit', 'at-stop', 'maintenance'
- `createdBy` (ObjectId ref) - Admin who created the bus
- `lastLocationUpdate` (Object) - Cache of latest location with timestamp
- `lastLocationTimestamp` (Date) - For data validation

#### Indexes Created:
```javascript
driverId, isActive, createdBy, lastLocationTimestamp, status, busNumber
```

### 2. User Model Updates
#### New Driver Fields:
- `driverId` (String, unique) - Driver license/ID number
- `assignedBus` (ObjectId ref) - Currently assigned bus
- `isOnline` (Boolean) - Live status tracking
- `lastSeenAt` (Date) - Timestamp of last activity
- `totalTrips` (Number) - Career statistics
- `avgRating` (Number) - Driver rating 0-5

#### New Student Fields:
- `notificationPreferences` (Object) - Alert opt-in/out settings
- `isTracking` (Boolean) - Privacy setting
- `assignmentHistory` (Array) - Track past bus assignments

#### Indexes Created:
```javascript
role, assignedBus, busId, isOnline, driverId, email
Compound: role + assignedBus
```

### 3. New Collections

#### LocationHistory
Stores all GPS coordinates for tracking and analytics (30-day TTL).
- Auto-deletes after 30 days to manage storage
- Supports location history visualization
- Enables driver analytics and performance tracking

**Fields:**
- busId, driverId, lat, lng, accuracy, speed, heading, timestamp

**Indexes:** busId+timestamp, driverId+timestamp, timestamp (TTL)

#### BusAssignment
Tracks driver-bus assignments for trip management and analytics.
- Links driver to specific bus instance
- Tracks trip duration and statistics
- Enables trip history and driver performance metrics

**Fields:**
- driverId, busId, startTime, endTime, status, totalPassengers, totalDistance

**Indexes:** driverId+startTime, busId+startTime, status, startTime

#### StopArrivals
Records each stop on a route for precise tracking.
- Tracks arrival/departure at each stop
- Records passenger boarding/alighting counts
- Manages stop sequence and dwell time

**Fields:**
- busId, driverId, stopId, stopName, lat, lng, arrivedAt, departedAt, passengersBoarded, passengersAlighted, dwellTime, status

**Indexes:** busId+arrivedAt, driverId+arrivedAt, status, arrivedAt

## Migration Steps

### Step 1: Update Existing Documents
```javascript
// Add required fields to existing Bus documents
db.buses.updateMany(
  {},
  {
    $set: {
      driverId: null,
      capacity: 50,
      occupancy: 0,
      isActive: true,
      status: 'inactive',
      lastLocationTimestamp: null
    }
  }
);

// Create admin user if doesn't exist
db.users.updateMany(
  { role: 'admin' },
  {
    $set: {
      assignedBus: null,
      isOnline: false,
      lastSeenAt: Date.now(),
      totalTrips: 0,
      avgRating: 0
    }
  }
);
```

### Step 2: Update Document References
Ensure all `createdBy` references are set for existing buses.

### Step 3: Verify Indexes
Indexes are automatically created on first write. Verify with:
```javascript
db.buses.getIndexes();
db.users.getIndexes();
db.locationHistories.getIndexes();
db.busAssignments.getIndexes();
db.stopArrivals.getIndexes();
```

## Usage Notes

### For Drivers
1. Assign driver to bus: Update `assignedBus` field
2. Track online status: Update `isOnline` when driver logs in/out
3. Location history: New locations automatically stored in LocationHistory collection
4. Trip tracking: BusAssignment created on trip start, updated on trip end

### For Students
1. Notification preferences: Set via user settings
2. Bus assignment: Track via `assignmentHistory` array
3. Privacy control: Toggle `isTracking` to opt-in/out

### For Location Tracking
1. Send location: Store in LocationHistory collection (TTL auto-cleanup)
2. Query history: Use compound indexes on busId+timestamp for performance
3. Real-time updates: Use Socket.io with Room-based subscriptions

### For Analytics
1. Driver performance: Query BusAssignment + LocationHistory
2. Stop times: Query StopArrivals for dwell times
3. Route efficiency: Analyze totalDistance vs actualTime

## Best Practices

1. **Always set createdBy**: Bus must have admin reference
2. **Migrate existing data**: Run Step 1 before deploying
3. **Use compound indexes**: For busId+timestamp queries
4. **TTL management**: LocationHistory auto-deletes every 30 days
5. **Connection pooling**: With new models, ensure MongoDB connection pool is sufficient
6. **Query optimization**: Always filter by busId + timestamp for LocationHistory
7. **Role-based queries**: Use User.role + specific fields for driver/student queries

## Rollback Plan

If needed, remove the new documents and revert model changes:
```javascript
db.locationHistories.drop();
db.busAssignments.drop();
db.stopArrivals.drop();

db.buses.updateMany({}, { $unset: { driverId: "", capacity: "", occupancy: "", isActive: "", status: "", createdBy: "", lastLocationUpdate: "", lastLocationTimestamp: "" }});
db.users.updateMany({}, { $unset: { driverId: "", assignedBus: "", isOnline: "", lastSeenAt: "", totalTrips: "", avgRating: "", notificationPreferences: "", isTracking: "", assignmentHistory: "" }});
```

## Next Steps

1. Update bus controller to require `createdBy` on creation
2. Update authentication to set driver `assignedBus` on login
3. Add location history storage to Socket.io handlers
4. Add stop arrival tracking to driver route handlers
5. Implement analytics queries using new models
