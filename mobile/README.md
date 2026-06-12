# ISG Risk — Mobil Uygulama

## Kurulum

Flutter SDK kurulu olmalıdır. Platform dosyaları eksikse:

```bash
cd mobile
flutter create . --org com.isg --project-name isg_risk_mobile
flutter pub get
```

## Yapılandırma

Sunucu adresini uygulama içindeki **Ayarlar** ekranından değiştirebilirsiniz.

| Ortam | API URL |
|-------|---------|
| Android emülatör | `http://10.0.2.2:3000/api` |
| iOS simülatör | `http://localhost:3000/api` |
| Fiziksel cihaz | `http://<BILGISAYAR_IP>:3000/api` |

## Arka Plan İzleme (Android)

"İzlemeyi Başlat" ile foreground servis çalışır. Bildirim çubuğunda **ISG Risk — İzleniyor** görünür. Uygulama minimize edilse bile sensör verisi gönderilmeye devam eder.

Gerekli izinler: konum, mikrofon, bildirim, arka plan konumu.

## Çalıştırma

```bash
flutter run
```

## Sensörler

- **Ivmeölçer** — sert darbe ve düşme tespiti
- **GPS** — tehlikeli bölge girişi
- **Mikrofon** — ortam gürültüsü (dB)
- **Ağ durumu** — bağlantı kopması tespiti

Veriler her 3 saniyede sunucuya gönderilir.

## Demo Hesabı

- E-posta: `calisan@isg.com`
- Şifre: `employee123`
