# Veri Modeli

## ER Diyagramı

```mermaid
erDiagram
    User ||--o{ Device : owns
    Device ||--o{ SensorReading : generates
    Device ||--o{ Alarm : triggers

    User {
        uuid id PK
        string email UK
        string password_hash
        enum role
        string full_name
        datetime created_at
    }

    Device {
        uuid id PK
        uuid user_id FK
        string device_name
        string platform
        datetime last_seen_at
        boolean is_online
    }

    SensorReading {
        uuid id PK
        uuid device_id FK
        enum sensor_type
        jsonb payload
        datetime recorded_at
    }

    DangerZone {
        uuid id PK
        string name
        float latitude
        float longitude
        float radius_m
        boolean is_active
    }

    Alarm {
        uuid id PK
        uuid device_id FK
        enum alarm_type
        enum severity
        string message
        float risk_score
        boolean is_resolved
        jsonb metadata
        datetime created_at
        datetime resolved_at
    }
```

## Enum Değerleri

### UserRole
- `admin` — Tam yetki
- `employee` — Kendi cihaz ve alarmları

### SensorType
- `accelerometer` — x, y, z ivme değerleri
- `gps` — lat, lng, accuracy
- `microphone` — decibels
- `network` — connected, type

### AlarmType
- `hard_impact` — Sert darbe
- `fall_suspected` — Düşme şüphesi
- `danger_zone_entry` — Tehlikeli bölge girişi
- `inactivity` — Uzun süre hareketsizlik
- `high_noise` — Yüksek gürültü
- `network_lost` — Ağ bağlantısı kopması
- `high_risk_score` — Yüksek risk puanı

### AlarmSeverity
- `low`, `medium`, `high`, `critical`

## İndeksler

- `sensor_readings(device_id, sensor_type, recorded_at)` — Zaman serisi sorguları
- `alarms(device_id, is_resolved, created_at)` — Alarm listeleme
