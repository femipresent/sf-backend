# Complete API Documentation for bacck/node-http-server

## Base URL: `http://localhost:5000/api/v1`

---

## Authentication Endpoints

### 1. Register User
- **URL:** `/register/register-user`
- **Method:** POST
- **Access:** Public
- **Request Body:**
```
json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
```
- **Response:**
```
json
{
  "success": true,
  "message": "Account created successfully",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1..."
  }
}
```

### 2. Login
- **URL:** `/register/login`
- **Method:** POST
- **Access:** Public
- **Request Body:**
```
json
{
  "email": "john@example.com",
  "password": "password123"
}
```
- **Response:**
```
json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1..."
  }
}
```

### 3. Find User
- **URL:** `/register/findone-user`
- **Method:** GET
- **Access:** Public
- **Query Parameters:**
```
json
{
  "email": "john@example.com"
}
```

---

## Booking Endpoints

### 4. Create Booking
- **URL:** `/bookings`
- **Method:** POST
- **Access:** Private (Requires Auth Token)
- **Request Headers:** `Authorization: Bearer <token>`
- **Request Body:**
```
json
{
  "type": "single",
  "pickup": {
    "address": {
      "street": "123 Main St",
      "city": "Lagos",
      "state": "Lagos",
      "country": "Nigeria",
      "coordinates": {
        "lat": 6.5244,
        "lng": 3.3792
      }
    },
    "scheduledDate": "2024-12-25",
    "scheduledTime": "2024-12-25T10:00:00Z",
    "timePreference": "morning",
    "contactPerson": "John Doe",
    "contactPhone": "+2348012345678"
  },
  "delivery": {
    "address": {
      "street": "456 Oak Ave",
      "city": "Abuja",
      "state": "FCT",
      "country": "Nigeria",
      "coordinates": {
        "lat": 9.0765,
        "lng": 7.3986
      }
    },
    "reciepentName": "Jane Doe",
    "reciepentPhone": "+2348012345679",
    "deliveryInstructions": "Leave at gate"
  },
  "services": {
    "ftl": {
      "selected": true,
      "price": 45000
    },
    "ltl": {
      "selected": false,
      "price": 12000
    },
    "lastMile": {
      "selected": true,
      "price": 1800
    },
    "express": {
      "selected": false,
      "price": 2500
    }
  },
  "itemDetails": {
    "description": "Electronics",
    "weight": 10,
    "dimensions": {
      "length": 30,
      "width": 20,
      "height": 15
    }
  }
}
```

### 5. Get All Bookings
- **URL:** `/bookings`
- **Method:** GET
- **Access:** Private (Requires Auth Token)
- **Query Parameters:**
```
?status=draft&type=single&page=1&limit=10
```
- **Request Headers:** `Authorization: Bearer <token>`

### 6. Get Single Booking
- **URL:** `/bookings/:id`
- **Method:** GET
- **Access:** Private (Requires Auth Token)
- **Request Headers:** `Authorization: Bearer <token>`

### 7. Update Booking
- **URL:** `/bookings/:id`
- **Method:** PUT
- **Access:** Private (Requires Auth Token)
- **Request Headers:** `Authorization: Bearer <token>`
- **Request Body:** (Partial update - include fields to update)
```
json
{
  "pickup": {
    "address": {
      "street": "New Street",
      "city": "New City",
      "state": "New State",
      "country": "Nigeria"
    },
    "scheduledDate": "2024-12-26",
    "scheduledTime": "2024-12-26T12:00:00Z"
  },
  "services": {
    "ftl": {
      "selected": true,
      "price": 45000
    }
  }
}
```

### 8. Update Booking Status (Admin Only)
- **URL:** `/bookings/:id/status`
- **Method:** PATCH
- **Access:** Private/Admin (Requires Auth Token with admin role)
- **Request Headers:** `Authorization: Bearer <token>`
- **Request Body:**
```
json
{
  "status": "assigned",
  "location": "Lagos Warehouse",
  "note": "Driver assigned"
}
```

### 9. Delete Booking
- **URL:** `/bookings/:id`
- **Method:** DELETE
- **Access:** Private/Admin (Requires Auth Token)
- **Request Headers:** `Authorization: Bearer <token>`

### 10. Track Booking (Public)
- **URL:** `/bookings/track/:trackingNumber`
- **Method:** GET
- **Access:** Public

### 11. Get Booking Stats
- **URL:** `/bookings/stats`
- **Method:** GET
- **Access:** Private (Requires Auth Token)
- **Request Headers:** `Authorization: Bearer <token>`

---

## Booking Status Values
- `draft` - Initial status when created
- `pending` - Awaiting confirmation
- `assigned` - Driver assigned
- `picked_up` - Package picked up
- `in_transit` - Package in transit
- `delivered` - Successfully delivered

## Booking Type Values
- `single` - Single item shipment
- `bulk` - Bulk/multi-item shipment

## Service Types
- `ftl` - Full Truck Load (₦45,000 base)
- `ltl` - Less Than Truck Load (₦12,000 base)
- `lastMile` - Last Mile Delivery (₦1,800 base)
- `express` - Express Delivery (₦2,500 base)

---

## User Model Fields
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| name | String | Yes | User's full name (min 3 chars) |
| email | String | Yes | Unique email address |
| password | String | Yes | User password (min 6 chars) |
| role | String | No | User role: 'user' or 'admin' (default: 'user') |

---

## Notes
- All private endpoints require `Authorization: Bearer <token>` header
- The token is returned from login/register endpoints
- Pricing includes 7.5% VAT tax
- Currency is Nigerian Naira (NGN)
- Tracking numbers are auto-generated in format: SF + timestamp + random characters
