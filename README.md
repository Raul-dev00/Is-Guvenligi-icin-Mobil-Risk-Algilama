# İş Güvenliği İçin Mobil Risk Algılama Sistemi 🚧

Bu proje, saha çalışanlarının güvenliğini en üst düzeye çıkarmak için geliştirilmiş entegre bir **IoT / Mobil Güvenlik Çözümüdür**. Cep telefonlarının ivmeölçer, GPS ve mikrofon gibi donanımlarını kullanarak işçilerin durumunu anlık olarak izler ve olası tehlikelerde (düşme, sert darbe, tehlikeli bölgeye giriş, yüksek gürültü) yönetim paneline anlık alarmlar iletir.

![Genel Sistem Görünümü](docs/images/hero-screenshot.png)
*(Buraya sistemin genel bir ekran görüntüsünü ekleyebilirsiniz)*

---

## 🌟 Öne Çıkan Özellikler

- **Gerçek Zamanlı Konum Takibi:** Çalışanlar harita üzerinden WebSockets (Socket.io) sayesinde anlık (gecikmesiz) olarak izlenir.
- **Yapay Zeka Destekli Düşme/Darbe Tespiti:** Z-Score ve eşik değer (threshold) algoritmalarıyla ivmeölçer verileri analiz edilir; olağandışı ivmelenmeler anında algılanır.
- **Tehlikeli Bölge (Geofencing) Kontrolü:** Çalışanlar yasaklı veya tehlikeli (radyasyon, yüksek gerilim vs.) bir alana girdiğinde sistem alarm verir.
- **İşçi Hareketsizlik Uyarısı:** Belirlenen süreden daha uzun süre hareketsiz kalan cihazlar tespit edilir.
- **Çok Platformlu Çözüm:** 
  - İzleme ve raporlama için modern **React / Web Paneli**.
  - Veri toplama için arka planda kesintisiz çalışan **Flutter Mobil Uygulaması** ve alternatif **.NET/MAUI Uygulaması**.
- **Anlık Bildirimler:** Yüksek riskli durumlarda yöneticilere **Telegram** üzerinden acil durum mesajları otomatik gönderilir.

---

## 📸 Ekran Görüntüleri

Bu klasöre (`docs/images/`) koyacağınız görseller ile Readme dosyanız zenginleşecektir.

### 📱 Mobil Uygulama (Veri Toplama Modülü)
![Mobil Uygulama](docs/images/mobile-app.png)
*(Çalışanın arka planda sensör okumalarını gösteren mobil ekran)*

### 💻 Yönetici Paneli - Canlı İzleme (MapTracking)
![Yönetici Haritası](docs/images/web-map.png)
*(Saha çalışanlarının konumlarını ve tehlikeli bölgeleri gösteren harita ekranı)*

### 📈 Sensör Verileri ve Grafikler (Dashboard)
![Veri Grafikleri](docs/images/web-charts.png)
*(Zaman serisi halinde ivme ve gürültü değerlerini gösteren Recharts grafikleri)*

### 🚨 Alarm ve Acil Durum Yönetimi
![Alarmlar Sayfası](docs/images/web-alarms.png)
*(Oluşan yüksek riskli durumların yöneticilere listelendiği ekran)*

---

## 🛠 Kullanılan Teknolojiler (Sistem Mimarisi)

1. **Backend / Sunucu:** Node.js, Express.js, Socket.io
2. **Veritabanı ve ORM:** PostgreSQL, Prisma ORM
3. **Web Arayüzü (Yönetici Paneli):** React, Vite, TailwindCSS, React-Leaflet, Recharts
4. **Mobil Veri Toplayıcılar:** 
   - **Flutter (Dart):** Arka plan sensör izleme ve API entegrasyonu.
   - **.NET (C#):** Alternatif yerel cihaz erişim servisi (HealthSafety).
5. **Dış Servis Entegrasyonları:** Telegram Bot API (Acil Bildirimler)

---

## 🚀 Kurulum ve Çalıştırma

### 1. Backend (Sunucu)
```bash
cd backend
npm install
# .env dosyanızı ayarlayın (DATABASE_URL, JWT_SECRET, TELEGRAM_BOT_TOKEN vb.)
npx prisma db push
npm run dev
```

### 2. Web Paneli (Yönetici Ekranı)
```bash
cd web
npm install
npm run dev
```

### 3. Mobil Uygulama (Sensör Servisi - Flutter)
```bash
cd mobile
flutter pub get
flutter run
```

---

## 🔒 Lisans & Güvenlik
Bu proje gizlilik kurallarına uygun olarak sadece yetkili (admin) hesaplara veri erişimi izni verir. Tüm iletişim JWT token ile korunmaktadır.
