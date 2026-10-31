# NightGuard REST API & WebSocket Specification

## Authentication Endpoints

### `POST /api/auth/register`
Creates a new administrator account and provisions a default network.
- **Request Body**:
  ```json
  {
    "name": "Panth Patel",
    "email": "admin@example.com",
    "password": "SecurePassword123!",
    "timezone": "UTC"
  }
  ```
- **Response (201 Created)**:
  ```json
  {
    "success": true,
    "data": {
      "user": { "id": "...", "email": "...", "role": "ADMIN" },
      "token": "jwt_token_string",
      "defaultNetworkId": "network_uuid"
    }
  }
  ```

### `POST /api/auth/login`
Authenticates user, sets `nightguard_session` HTTP-only cookie, and returns JWT.
- **Request Body**:
  ```json
  {
    "email": "admin@nightguard.local",
    "password": "AdminSecurePassword123!"
  }
  ```

### `GET /api/auth/me`
Returns current user profile. Requires Authorization header or cookie.

---

## Router Endpoints

### `POST /api/routers/pair`
Initiates router pairing session.
- **Request Body**:
  ```json
  {
    "networkId": "uuid",
    "adapterType": "OPENWRT",
    "isSimulated": false
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "router": { "id": "uuid", "connectionStatus": "PAIRING" },
      "pairingToken": "ng_pair_xxxxxxxx",
      "installCommand": "sh <(curl -sSL https://api.nightguard.render.com/agent/install.sh) --token ng_pair_xxxxxxxx"
    }
  }
  ```

### `POST /api/routers/:id/sync`
Instructs the router to enumerate active DHCP leases and ARP entries.

### `POST /api/routers/:id/emergency-restore`
Flushes all active restrictions from the router's nftables set.

---

## Device Endpoints

### `GET /api/devices`
Query params: `networkId`, `search`, `type`, `isManaged`, `restrictionStatus`.

### `PATCH /api/devices/:id/management`
Toggles device policy enforcement.
- **Request Body**: `{ "isManaged": true }`

### `POST /api/devices/:id/restrict`
Triggers immediate manual override restriction on router firewall.

### `POST /api/devices/:id/restore`
Triggers immediate manual override restoration on router firewall.

---

## WebSocket Endpoints

### Dashboard Live Bus: `/ws/dashboard?token=<JWT>`
Pushes real-time events to connected browser tabs:
- `DEVICE_UPDATE`
- `ROUTER_STATUS_UPDATE`
- `RESTRICTION_EVENT`
- `SCHEDULE_TRIGGERED`

### Outbound Router Gateway: `/ws/router`
Used exclusively by OpenWrt agents to receive authenticated commands and stream heartbeats.
