# Test Senaryoları

## Ön Koşullar

```bash
docker compose up -d
cd backend && npm install && npm run db:setup && npm run dev
cd web && npm install && npm run dev
```

## Senaryo 1: Kimlik Doğrulama

| Adım | İşlem | Beklenen Sonuç |
|------|-------|----------------|
| 1 | admin@isg.com / admin123 ile web girişi | Dashboard açılır |
| 2 | calisan@isg.com / employee123 ile mobil girişi | İzleme ekranı açılır |
| 3 | Geçersiz şifre ile giriş | Hata mesajı gösterilir |

## Senaryo 2: Sensör Verisi ve Sert Darbe

| Adım | İşlem | Beklenen Sonuç |
|------|-------|----------------|
| 1 | Mobilde izlemeyi başlat | Her 3 sn veri gönderilir |
| 2 | Telefonu sertçe salla | hard_impact alarmı oluşur |
| 3 | Web dashboard kontrol | Alarm anlık görünür |

## Senaryo 3: Tehlikeli Bölge

| Adım | İşlem | Beklenen Sonuç |
|------|-------|----------------|
| 1 | Admin zones sayfasından bölge ekle | Haritada daire görünür |
| 2 | Mobil cihazı bölge koordinatlarına yaklaştır | danger_zone_entry alarmı |
| 3 | Alarm listesinde filtrele | İlgili alarm listelenir |

## Senaryo 4: Zaman Serisi Grafikleri

| Adım | İşlem | Beklenen Sonuç |
|------|-------|----------------|
| 1 | Dashboard'dan cihaz grafiklerine git | Sensör sayfası açılır |
| 2 | İzleme aktifken bekle | Grafikler güncellenir |
| 3 | İvme ve gürültü grafiklerini kontrol | Veri noktaları görünür |

## Senaryo 5: Alarm Çözümleme

| Adım | İşlem | Beklenen Sonuç |
|------|-------|----------------|
| 1 | Alarmlar sayfasına git | Aktif alarmlar listelenir |
| 2 | "Çözüldü" butonuna tıkla | Alarm resolved olur |
| 3 | Aktif filtreyle kontrol | Alarm listeden çıkar |

## Otomatik Testler

```bash
# Birim testleri (DB gerektirmez)
cd backend && npm run test:unit

# Entegrasyon testi (DB + çalışan backend gerekir)
cd backend && npm run test:integration
```
