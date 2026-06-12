# İş Sağlığı ve Güvenliği İçin Mobil Risk Algılama — Proje Raporu

**Ders:** Node.js ile Web Programlama (BLM463)  
**Senaryo:** İş Sağlığı ve Güvenliği İçin Mobil Risk Algılama

---

## 1. Gereksinim Analizi

### Fonksiyonel Gereksinimler
| ID | Gereksinim | Durum |
|----|-----------|-------|
| FR-01 | En az 2 sensörden veri toplama (ivmeölçer, GPS, mikrofon, ağ) | ✓ |
| FR-02 | Zaman damgasıyla sunucuya veri iletimi | ✓ |
| FR-03 | Node.js RESTful API | ✓ |
| FR-04 | Admin ve çalışan rolleri ile kimlik doğrulama | ✓ |
| FR-05 | Kullanıcı, cihaz, sensör ve alarm veritabanı | ✓ |
| FR-06 | Web panelinde canlı izleme | ✓ |
| FR-07 | Zaman serisi grafik gösterimi | ✓ |
| FR-08 | Alarm listeleme ve çözümleme | ✓ |
| FR-09 | Zaman serisi / anomali analizi | ✓ |
| FR-10 | Tehlikeli bölge (geofence) yönetimi | ✓ |

### Fonksiyonel Olmayan Gereksinimler
- Modüler kod yapısı
- JWT tabanlı güvenli kimlik doğrulama
- Gerçek zamanlı Socket.io bildirimleri
- Rol bazlı erişim kontrolü

---

## 2. Proje Tanımı

Saha çalışanlarının akıllı telefonları, iş sağlığı ve güvenliği açısından riskli durumları algılayan mobil IoT cihazları olarak kullanılır. Toplanan sensör verileri Node.js backend'e iletilir; analiz modülü sert darbe, düşme şüphesi, tehlikeli bölge girişi, hareketsizlik ve yüksek gürültü gibi durumları tespit eder. Web paneli üzerinden yöneticiler tüm cihazları ve alarmları canlı olarak izleyebilir.

---

## 3. Kullanım Senaryosu

**Aktörler:** Sistem Yöneticisi (Admin), Saha Çalışanı (Employee)

1. Admin web panele giriş yapar, tehlikeli bölgeleri tanımlar
2. Çalışan mobil uygulamaya giriş yapar, cihazını kaydeder
3. Çalışan "İzlemeyi Başlat" ile sensör verisi gönderimini aktifleştirir
4. Sert darbe algılandığında backend `hard_impact` alarmı oluşturur
5. Tehlikeli bölgeye girildiğinde `danger_zone_entry` alarmı tetiklenir
6. Admin dashboard'da canlı alarm ve grafikleri görür
7. Alarm çözüldü olarak işaretlenir

---

## 4. Sistem Mimarisi

```
[Flutter Mobil] --REST--> [Express API] --Prisma--> [PostgreSQL]
                              |
                         [Socket.io] ---> [React Web Panel]
                              |
                      [Analiz Modülü]
```

Katmanlar:
- **Sunum:** Flutter (mobil), React (web)
- **İş Mantığı:** Express routes + analysisService
- **Veri:** PostgreSQL + Prisma ORM
- **Gerçek Zamanlı:** Socket.io

---

## 5. Veri Modeli

Detaylı şema: [DATA_MODEL.md](DATA_MODEL.md)

Temel varlıklar: User, Device, SensorReading, DangerZone, Alarm

---

## 6. Kullanılan Teknolojiler

| Katman | Teknoloji |
|--------|-----------|
| Backend | Node.js, Express.js |
| ORM | Prisma |
| Veritabanı | PostgreSQL |
| Auth | JWT, bcryptjs |
| Gerçek zamanlı | Socket.io |
| Validasyon | Zod |
| Mobil | Flutter, sensors_plus, geolocator, noise_meter |
| Web | React, Vite, Recharts, Leaflet |
| Konteyner | Docker Compose |

---

## 7. Gerçekleştirilen Modüller

### Backend
- Auth modülü (login, register, şifre değiştirme, JWT middleware)
- Cihaz kayıt ve yönetim
- Sensör verisi ingestion (toplu kayıt)
- Analiz modülü (eşik + z-score + geofence + risk skoru)
- Alarm CRUD ve çözümleme
- Tehlikeli bölge CRUD
- Socket.io gerçek zamanlı bildirimler
- Telegram Bot bildirimi (yüksek/kritik alarmlar)

### Mobil (Flutter)
- Çalışan girişi
- 4 sensör: ivmeölçer, GPS, mikrofon, ağ durumu
- Android foreground servis + arka plan veri gönderimi
- Bildirim çubuğunda "İzleniyor" göstergesi
- Ayarlar ekranı (sunucu URL yapılandırması)
- Cihaz otomatik kaydı

### Web Panel
- Admin/çalışan girişi
- Canlı dashboard (Socket.io)
- Cihaz listesi
- Alarm listesi ve filtreleme
- Sensör zaman serisi grafikleri (Recharts)
- Tehlikeli bölge harita yönetimi (Leaflet)
- Harita izleme (cihaz konumları)
- Profil sayfası ve şifre değiştirme

---

## 8. Test Süreci

### Birim Testleri
```bash
cd backend && node scripts/test-analysis.js
```
Geofence, z-score ve ivme eşik testleri.

### Entegrasyon Testi
```bash
docker compose up -d
cd backend && npm run db:setup && npm start
node scripts/integration-test.js
```

### Manuel Test Senaryoları
| # | Senaryo | Beklenen |
|---|---------|----------|
| T1 | Admin girişi | Dashboard açılır |
| T2 | Çalışan cihaz kaydı | Cihaz listede görünür |
| T3 | İvme > 25 m/s² | hard_impact alarmı |
| T4 | Tehlikeli bölge içi GPS | danger_zone_entry alarmı |
| T5 | 85+ dB gürültü | high_noise alarmı |
| T6 | Socket.io bağlantısı | Dashboard canlı güncellenir |
| T7 | Alarm çözümleme | isResolved = true |

---

## 9. Karşılaşılan Kısıtlar

- iOS simülatörde GPS ve ivmeölçer sınırlıdır; fiziksel cihaz testi önerilir
- Mikrofon gürültü ölçümü platform ve cihaza göre değişkenlik gösterir
- Sürekli sensör toplama pil tüketimini artırır
- GPS doğruluğu tehlikeli bölge tespitinin hassasiyetini etkiler
- Emülatörde backend erişimi için IP yapılandırması gerekir (10.0.2.2)

---

## 10. Ekip İçi Görev Dağılımı

| Üye | Görev |
|-----|-------|
| Üye 1 | Backend API, Prisma şema, analiz modülü, Socket.io |
| Üye 2 | Flutter mobil uygulama, sensör entegrasyonu |
| Üye 3 | React web paneli, grafikler, harita |
| Üye 4 | Docker, dokümantasyon, test senaryoları, seed verisi |

---

## 11. API Dokümantasyonu

Detaylı endpoint listesi: [API.md](API.md)
