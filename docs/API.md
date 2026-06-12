# API Dokümantasyonu

Base URL: `http://localhost:3000/api`

## Kimlik Doğrulama

Tüm korumalı endpointler `Authorization: Bearer <token>` header'ı gerektirir.

### POST /auth/login

```json
{ "email": "admin@isg.com", "password": "admin123" }
```

Yanıt:
```json
{
  "token": "jwt...",
  "user": { "id": "uuid", "email": "...", "role": "admin", "fullName": "..." }
}
```

### POST /auth/register (Admin)

```json
{ "email": "yeni@isg.com", "password": "sifre123", "fullName": "Ad Soyad", "role": "employee" }
```

### GET /auth/me

Mevcut kullanıcı bilgisi.

### PATCH /auth/change-password

```json
{ "currentPassword": "eski123", "newPassword": "yeni123" }
```

Yanıt: `{ "message": "Şifre başarıyla güncellendi" }`

---

## Cihazlar

### POST /devices/register

```json
{ "deviceName": "Saha Telefonu", "platform": "flutter" }
```

### GET /devices

Kullanıcının erişebildiği cihaz listesi.

### GET /devices/locations

Cihazların son bilinen GPS konumları ile birlikte listesi. Her cihaz için `location: { lat, lng, accuracy, recordedAt }` veya `null` döner.

### GET /devices/:id

Cihaz detayı.

### DELETE /devices/:id (Admin)

Cihaz silme.

---

## Sensör Verisi

### POST /sensor-data

```json
{
  "deviceId": "uuid",
  "readings": [
    {
      "sensorType": "accelerometer",
      "payload": { "x": 0.1, "y": 0.2, "z": 9.8 },
      "recordedAt": "2026-06-11T10:00:00.000Z"
    },
    {
      "sensorType": "gps",
      "payload": { "lat": 40.1885, "lng": 29.061, "accuracy": 5 },
      "recordedAt": "2026-06-11T10:00:00.000Z"
    }
  ]
}
```

`sensorType`: `accelerometer` | `gps` | `microphone` | `network`

### GET /sensor-data

Query parametreleri:
- `deviceId` (zorunlu)
- `type` — sensör tipi filtresi
- `from`, `to` — ISO tarih aralığı
- `limit` — varsayılan 100, max 500

---

## Alarmlar

### GET /alarms

Query: `deviceId`, `type`, `resolved`, `from`, `to`, `limit`

### PATCH /alarms/:id/resolve

Alarmı çözüldü olarak işaretler.

### GET /alarms/stats

Aktif alarm sayısı ve tipe göre dağılım.

---

## Tehlikeli Bölgeler

### GET /danger-zones

Tüm bölgeler.

### POST /danger-zones (Admin)

```json
{ "name": "Yüksek Gerilim", "latitude": 40.1885, "longitude": 29.061, "radiusM": 50 }
```

### PUT /danger-zones/:id (Admin)

### DELETE /danger-zones/:id (Admin)

---

## Socket.io

URL: `http://localhost:3000`

Bağlantı: `auth: { token: '<jwt>' }`

| Event | Yön | Açıklama |
|-------|-----|----------|
| `join:device` | client → server | Cihaz odasına katıl |
| `sensor:update` | server → client | Yeni sensör verisi |
| `alarm:new` | server → client | Yeni alarm |
| `device:status` | server → client | Cihaz durum güncellemesi |

---

## Sağlık Kontrolü

### GET /health

```json
{ "status": "ok", "timestamp": "..." }
```
