# Part 2: Real-Time Location Updates Backend - Architecture Walkthrough

This is a system design question: design the backend for real-time location updates for Cymelle delivery trips and driver/rider activity. The system must support 500+ concurrent active trips or deliveries while keeping customer tracking, driver apps, and admin/dispatcher views responsive.

The current Cymelle backend already has orders and rides. I would keep the existing REST APIs for lifecycle actions such as creating an order, requesting a ride, accepting a ride, completing a ride, and cancelling a ride. I would add a dedicated real-time location subsystem beside that API because location data has a different shape: high-frequency writes, low-latency reads, fan-out to multiple viewers, and short-lived live state.

---

## 1. Requirements and Scale Assumptions

For 500 active trips:

- Each driver/rider sends a GPS update every 2-5 seconds.
- At 1 update every 3 seconds, ingestion is roughly `500 / 3 = 167 location updates per second`.
- Each trip may have 1 customer viewer, 1 driver app, and several admin/dispatcher viewers.
- The harder problem is not raw write volume; it is managing many persistent connections and fanning out updates quickly.

Core requirements:

- Drivers/riders push latitude, longitude, speed, bearing, accuracy, and timestamp.
- Customers see the live location for their own delivery or ride.
- Admins/dispatchers can monitor multiple active trips.
- The system detects stale drivers and bad GPS data.
- Recent live location is available quickly.
- Historical trails can be stored for audits, dispute resolution, and route playback.

---

## 2. WebSocket vs Polling

Polling is simpler, but it is a poor fit for real-time trip tracking.

With polling, customers and admins repeatedly ask "where is this driver?" every few seconds even when the location has not changed. At 500 active trips, if each customer polls every 5 seconds, that is already around 100 requests per second just for customer tracking. Admin dashboards make this worse because one dispatcher may watch many trips. Polling also adds artificial latency because the customer only sees an update on the next poll interval.

WebSocket is a better fit because it keeps a persistent connection open:

- Driver/rider app pushes location updates to the server as they happen.
- Customer and admin clients subscribe to a trip and receive updates immediately.
- The server sends only changed data rather than forcing clients to keep asking.
- Connection overhead is lower than repeated HTTP request/response cycles.

I would use WebSocket for customer/admin delivery of updates. For driver ingestion, WebSocket works well too, but MQTT over WebSocket is also worth considering for mobile apps because it handles unreliable networks nicely and has small packet overhead. For this system, a pragmatic first version is:

- Driver app to backend: WebSocket location ingestion.
- Backend to customers/admins: WebSocket subscriptions.
- Optional later upgrade: MQTT for driver ingestion if mobile network reliability becomes a major issue.

REST still remains useful as a fallback:

- `GET /api/trips/{id}/location/current` for current location fallback.
- `GET /api/trips/{id}/location/history` for route playback.

---

## 3. Proposed Architecture

```text
+-------------------+        WebSocket/MQTT        +----------------------+
| Driver/Rider App  | ---------------------------> | Location Service     |
| GPS every 2-5 sec |                              | Spring WebFlux       |
+-------------------+                              +----------+-----------+
                                                              |
                                                              |
                         +------------------------------------+------------------+
                         |                                    |                  |
                         v                                    v                  v
              +--------------------+              +--------------------+   +------------------+
              | Redis              |              | Kafka / RabbitMQ   |   | PostgreSQL       |
              | live location      |              | location-events    |   | trip metadata    |
              | pub/sub fan-out    |              | durable stream     |   | orders/rides     |
              +---------+----------+              +---------+----------+   +------------------+
                        |                                   |
                        |                                   v
                        |                         +--------------------+
                        |                         | TimescaleDB /      |
                        |                         | partitioned table  |
                        |                         | location history   |
                        |                         +--------------------+
                        |
                        v
       +----------------+----------------+
       | WebSocket subscribers          |
       | Customers / Admins / Dispatch  |
       +---------------------------------+
```

In Cymelle terms:

- PostgreSQL remains the source of truth for `Order`, `Ride`, `AppUser`, and assignment state.
- Redis stores the latest live location for each active ride/delivery.
- Redis Pub/Sub or Redis Streams fans updates across multiple backend nodes.
- Kafka or RabbitMQ stores a durable event stream for history writers and analytics.
- TimescaleDB, or a partitioned PostgreSQL table, stores historical breadcrumbs.

---

## 4. Storage Choices for High-Frequency Location Data

The system should not write every GPS point directly into the main relational tables used for orders and rides. That would mix high-frequency telemetry with transactional business data and make the primary database harder to tune.

I would split storage into hot, warm, and cold paths.

### Hot Path: Redis

Redis stores the current location for each active trip:

```text
trip:{tripId}:location = {
  driverId,
  lat,
  lng,
  speed,
  bearing,
  accuracyMeters,
  updatedAt,
  sequence
}
```

Why Redis:

- Very fast reads for "where is my driver now?"
- TTL can expire stale live state automatically.
- Redis Pub/Sub can broadcast updates between app nodes.
- Redis Geo can support proximity queries like "drivers within 2km".

I would set a TTL, for example 60-120 seconds, so a driver who disconnects does not look live forever.

### Warm Path: Event Stream

Every valid location update is also published as an event:

```text
topic: location-events
key: tripId or driverId
value: location payload
```

Kafka is ideal if the team wants replayable history and high throughput. RabbitMQ is acceptable for a smaller system if the goal is reliable async processing rather than long replay windows. For this prompt, I would pick Kafka for the durable location log because location events are naturally append-only and may be replayed to rebuild route history.

Partition by `tripId` or `driverId` so updates for the same trip stay ordered.

### Historical Path: TimescaleDB or Partitioned PostgreSQL

For route playback and audit trails, I would store downsampled or batched location points in a time-series table:

```text
location_points
  id
  trip_id
  driver_id
  lat
  lng
  speed
  bearing
  accuracy_meters
  recorded_at
```

TimescaleDB is a strong choice because it is PostgreSQL-compatible and optimized for time-series data. If we want fewer moving parts, we can start with PostgreSQL partitioned by date and add TimescaleDB later.

### Cold Path: Existing PostgreSQL Domain Tables

The existing `rides` and `orders` tables should store business state:

- assigned driver
- pickup/dropoff
- requested/accepted/completed/cancelled timestamps
- final route summary
- final distance/duration if needed

They should not store every GPS point.

---

## 5. Spring Boot Service Layer Structure

I would add a dedicated `LocationService` module or service inside the backend first, then split it into its own deployable service if scaling pressure justifies it.

For WebSocket-heavy traffic, I would use Spring WebFlux rather than a traditional blocking Spring MVC controller path. WebFlux is better for many long-lived connections because it uses non-blocking I/O.

Suggested package structure:

```text
location/
  config/
    WebSocketConfig
    LocationSecurityConfig

  websocket/
    DriverLocationWebSocketHandler
    TripSubscriptionWebSocketHandler
    WebSocketSessionRegistry

  dto/
    LocationUpdateMessage
    LocationSnapshotResponse
    SubscribeTripMessage

  service/
    LocationIngestionService
    LocationValidationService
    LocationAuthorizationService
    LocationFanoutService
    LocationQueryService
    StaleTripDetectionService

  repository/
    RedisLocationRepository
    LocationHistoryRepository

  messaging/
    LocationEventProducer
    LocationEventConsumer
```

### Ingestion Flow

```text
Driver WebSocket message
        |
        v
Authenticate session user
        |
        v
Authorize driver for trip
        |
        v
Validate location update
        |
        +--> reject impossible / stale / out-of-bounds data
        |
        v
Write latest location to Redis
        |
        v
Publish location event to Kafka
        |
        v
Fan out to subscribed customer/admin sessions
```

Validation should include:

- required trip ID and driver ID
- driver is assigned to the trip or allowed to service the delivery
- coordinates are within the operating region
- timestamp is not too old or too far in the future
- accuracy is acceptable
- speed jump is physically plausible
- sequence number is newer than the last accepted update

### Subscription Flow

```text
Customer/Admin opens tracking screen
        |
        v
Client opens WebSocket subscription
        |
        v
Backend authenticates user
        |
        v
Backend authorizes access to trip
        |
        v
Backend sends latest Redis snapshot
        |
        v
Backend streams future updates
```

Authorization matters:

- Customers can subscribe only to their own delivery/ride.
- Drivers can publish only for trips assigned to them.
- Admins and dispatchers can subscribe to all active trips.

---

## 6. Scaling Considerations

At 500 active trips, message volume is manageable. The bigger scaling concern is WebSocket connection count and fan-out across multiple backend instances.

### Stateless Location Nodes

Run multiple Location Service instances behind a load balancer:

```text
                     +------------------+
                     | Load Balancer    |
                     | WebSocket aware  |
                     +---+----------+---+
                         |          |
                         v          v
                    +---------+  +---------+
                    | Loc Svc |  | Loc Svc |
                    | Node A  |  | Node B  |
                    +----+----+  +----+----+
                         |            |
                         +-----+------+
                               |
                               v
                         +-----------+
                         | Redis     |
                         | Pub/Sub   |
                         +-----------+
```

WebSocket connections are stateful, but application state should not live only inside one node. Redis holds the latest location, and Pub/Sub broadcasts updates so customers connected to Node B can receive updates from a driver connected to Node A.

### Load Balancing

The load balancer must support WebSocket upgrades. Sticky sessions can reduce cross-node chatter, but the system should still work without perfect stickiness because Redis Pub/Sub or Streams carries updates between nodes.

For driver ingestion, consistent routing by `tripId` is useful but not required if Redis and Kafka are the coordination points.

### Fan-Out Strategy

For each update:

1. Write current location to Redis.
2. Publish to `trip:{tripId}:updates`.
3. Every Location Service node subscribed to that channel checks local WebSocket sessions.
4. Nodes push the update only to clients subscribed to that trip.

This avoids every client polling the API.

### Backpressure and Rate Limits

Drivers should not be allowed to flood updates:

- Minimum interval, for example one update per second.
- Drop updates that are older than the last accepted sequence.
- Optionally downsample history writes while still updating live Redis state.
- Queue or drop low-priority admin fan-out if a client is slow.

### Capacity Estimate

For 500 active trips:

- 500 driver connections.
- 500 customer tracking connections.
- 10 admins watching many trips.
- Roughly 1,000-1,500 WebSocket connections is realistic.
- Around 100-250 location updates per second depending on update interval.

This is well within what a small cluster of non-blocking Spring WebFlux nodes, Redis, and Kafka can handle.

---

## 7. Failure Modes to Plan For

### Driver Loses Network

Mobile networks are unreliable. Store `lastSeenAt` in Redis for each trip. If no update arrives for 30 seconds, mark the live location as stale and send a stale status to subscribers.

```text
last update older than 30s -> STALE
last update older than 2m  -> OFFLINE
```

The frontend should show "last updated 43 seconds ago" rather than leaving a frozen marker with no context.

### Location Service Node Crashes

Connected clients lose their WebSocket and reconnect through the load balancer. Because latest location is in Redis, the new node can immediately send the current snapshot after reconnect.

### Redis Fails

Redis is on the hot path. Run Redis with high availability using Sentinel or a managed Redis service with failover. If Redis is unavailable:

- Continue accepting updates if Kafka is available.
- Temporarily degrade live tracking.
- Serve the last persisted history point from the database as a fallback.

The fallback may be slower and less fresh, but the system should not fail silently.

### Kafka or Event Broker Lags

If Kafka lags, live tracking can still work through Redis. The consequence is delayed route history, not broken live customer tracking. Once the consumer catches up, it writes historical points.

### Database Is Slow

Do not query PostgreSQL on every location update. Authorization can be cached briefly, for example `trip:{tripId}:assignment`, with invalidation when a ride is completed or cancelled. The database is used for trip metadata and historical queries, not every live coordinate.

### Bad GPS or Spoofed Location

Reject or flag suspicious updates:

- impossible speed
- coordinates outside service area
- timestamp replay
- sequence number rollback
- poor accuracy
- driver not assigned to the trip

Rejected events can be logged to a dead-letter topic for audit.

### Slow Subscribers

If a customer or admin client cannot keep up, do not let that client block ingestion. Keep only the most recent location update per subscribed trip for that connection, and drop intermediate points if needed.

### Duplicate or Out-of-Order Updates

Use a monotonically increasing sequence number or client timestamp plus server-received timestamp. Ignore updates older than the latest accepted update for that trip/driver.

---

## 8. Security and Privacy

Location is sensitive data, so access control has to be strict.

- Drivers can publish only for assigned active trips.
- Customers can subscribe only to their own active delivery/ride.
- Admin access should be role-gated and audited.
- WebSocket authentication should reuse the same auth/session model as the rest of Cymelle.
- Historical location data should have retention limits.
- Completed trips should stop accepting live updates.

I would also avoid broadcasting exact driver location after a trip is complete.

---

## 9. API Sketch

REST endpoints:

```text
GET /api/trips/{tripId}/location/current
GET /api/trips/{tripId}/location/history?from=...&to=...
GET /api/admin/locations/active
```

WebSocket endpoints:

```text
/ws/location/driver
  driver -> server location updates

/ws/location/trips/{tripId}
  server -> customer/admin trip updates

/ws/location/admin
  server -> admin stream for active trips
```

Example driver update:

```json
{
  "tripId": "uuid",
  "lat": -1.2921,
  "lng": 36.8219,
  "speedKph": 34.2,
  "bearing": 91.5,
  "accuracyMeters": 8.0,
  "recordedAt": "2026-06-15T10:30:00Z",
  "sequence": 184
}
```

---

## Architecture Summary

```text
Driver/Rider App
   |
   | WebSocket or MQTT, GPS every 2-5 seconds
   v
Spring Boot Location Service
   |
   +--> validate + authorize update
   |
   +--> Redis
   |      latest live location
   |      stale detection TTL
   |      pub/sub fan-out
   |
   +--> Kafka / RabbitMQ
   |      durable location event stream
   |
   +--> TimescaleDB or partitioned PostgreSQL
   |      historical route breadcrumbs
   |
   +--> Existing PostgreSQL
          ride/order/driver assignment metadata

Redis Pub/Sub
   |
   v
Customer/Admin WebSocket Subscribers
```

My proposed design keeps the existing Cymelle order and ride system as the source of business truth, then adds a real-time location layer optimized for high-frequency GPS data. WebSockets avoid polling overhead, Redis handles live state and fan-out, Kafka gives a durable event stream, TimescaleDB or partitioned PostgreSQL stores route history, and Spring WebFlux keeps the location service efficient under thousands of concurrent WebSocket connections.
