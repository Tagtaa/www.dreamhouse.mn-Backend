# SMS Parser Response Tracking Sistemi

Bu dokümantasyon, SMS Parser API'lerinin tüm cevaplarını veritabanına kaydetme ve analiz etme sistemini açıklar.

## Genel Bakış

SMS Parser API'lerinden gelen tüm istekler ve cevaplar otomatik olarak veritabanına kaydedilir. Bu sayede:

- API performansını izleyebilirsiniz
- Hataları analiz edebilirsiniz
- Kullanım istatistiklerini görebilirsiniz
- Debugging yapabilirsiniz

## Kaydedilen Veriler

### Temel Bilgiler
- **Endpoint**: Hangi API endpoint'i çağrıldı
- **Request Data**: SMS Parser App'den gelen tüm veri
- **Response Data**: API'den dönen tüm cevap
- **Status Code**: HTTP status kodu
- **Response Time**: Yanıt süresi (ms)
- **Timestamp**: İşlem zamanı

### SMS Parser App Bilgileri
- **Parser App Version**: Uygulama versiyonu
- **Device Info**: Cihaz bilgileri
- **Client IP**: İstek yapan IP adresi
- **User Agent**: Tarayıcı/uygulama bilgisi

### Metadata
- **Phone Number**: Telefon numarası
- **SMS Content**: SMS içeriği (ilk 100 karakter)
- **Amount**: İşlem tutarı (bank transaction için)
- **Bank Name**: Banka adı
- **Transaction Type**: İşlem tipi

## API Endpoint'leri

### 1. Response İstatistikleri
```
GET /api/sms-parser/responses/stats
```

**Query Parameters:**
- `endpoint`: Endpoint filtresi (verify-otp, bank-transaction, parse-sms, validate-phone)
- `isSuccess`: Başarı durumu (true/false)
- `statusCode`: HTTP status kodu
- `startDate`: Başlangıç tarihi
- `endDate`: Bitiş tarihi

**Response:**
```json
{
  "success": true,
  "data": {
    "stats": [
      {
        "_id": "verify-otp",
        "statusCodes": [
          {
            "statusCode": 200,
            "isSuccess": true,
            "count": 150,
            "avgResponseTime": 45.2,
            "minResponseTime": 12,
            "maxResponseTime": 234
          }
        ],
        "totalRequests": 150
      }
    ]
  }
}
```

### 2. Hata Özeti
```
GET /api/sms-parser/responses/errors?days=7
```

**Query Parameters:**
- `days`: Kaç gün geriye bakılacak (1-365, varsayılan: 7)

**Response:**
```json
{
  "success": true,
  "data": {
    "errorSummary": [
      {
        "_id": {
          "endpoint": "verify-otp",
          "statusCode": 400
        },
        "count": 25,
        "errors": [
          {
            "message": "Invalid OTP code",
            "code": "OTP_INVALID",
            "timestamp": "2024-01-20T10:30:00.000Z"
          }
        ]
      }
    ],
    "period": "7 days"
  }
}
```

### 3. Response Listesi
```
GET /api/sms-parser/responses?page=1&limit=20&endpoint=verify-otp
```

**Query Parameters:**
- `page`: Sayfa numarası (varsayılan: 1)
- `limit`: Sayfa başına öğe (varsayılan: 20, max: 100)
- `endpoint`: Endpoint filtresi
- `isSuccess`: Başarı durumu
- `statusCode`: HTTP status kodu
- `phoneNumber`: Telefon numarası
- `startDate`: Başlangıç tarihi
- `endDate`: Bitiş tarihi

**Response:**
```json
{
  "success": true,
  "data": {
    "responses": [
      {
        "_id": "65f1234567890abcd1234567",
        "endpoint": "verify-otp",
        "requestData": { ... },
        "responseData": { ... },
        "statusCode": 200,
        "responseTime": 45.2,
        "isSuccess": true,
        "metadata": {
          "phoneNumber": "+97612345678",
          "smsContent": "84739"
        },
        "createdAt": "2024-01-20T10:30:00.000Z"
      }
    ],
    "pagination": {
      "current": 1,
      "total": 8,
      "count": 20,
      "totalItems": 150
    }
  }
}
```

### 4. Eski Response'ları Temizleme
```
POST /api/sms-parser/responses/cleanup
```

**Request Body:**
```json
{
  "days": 30
}
```

**Response:**
```json
{
  "success": true,
  "message": "Cleaned up responses older than 30 days",
  "data": {
    "deletedCount": 1250
  }
}
```

## Veri Saklama

### TTL (Time To Live)
- Response'lar 30 gün sonra otomatik olarak silinir
- Bu süre `expiresAt` field'ında saklanır
- MongoDB TTL index'i ile otomatik temizlik

### Index'ler
- `endpoint`: Endpoint bazında hızlı sorgulama
- `isSuccess`: Başarı durumu bazında filtreleme
- `statusCode`: Status kodu bazında filtreleme
- `createdAt`: Tarih bazında sıralama
- `expiresAt`: TTL için
- `metadata.phoneNumber`: Telefon numarası bazında arama
- `metadata.bankName`: Banka adı bazında arama

## Kullanım Örnekleri

### 1. Günlük Başarı Oranını İzleme
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "http://localhost:3000/api/sms-parser/responses/stats?startDate=2024-01-20&endDate=2024-01-21"
```

### 2. Hataları Analiz Etme
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "http://localhost:3000/api/sms-parser/responses/errors?days=7"
```

### 3. Belirli Telefon Numarasının Geçmişi
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "http://localhost:3000/api/sms-parser/responses?phoneNumber=%2B97612345678&limit=50"
```

### 4. Endpoint Performansını Karşılaştırma
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "http://localhost:3000/api/sms-parser/responses/stats"
```

## Monitoring ve Alerting

### Önerilen Monitoring
- **Response Time**: Ortalama yanıt süresi > 500ms
- **Error Rate**: Hata oranı > %5
- **Success Rate**: Başarı oranı < %95
- **Endpoint Usage**: Endpoint kullanım oranları

### Alerting Kuralları
- Yüksek hata oranı (> %10)
- Yavaş yanıt süresi (> 1000ms)
- Belirli hata kodlarının artışı
- Endpoint kullanımında anormal değişiklik

## Güvenlik

### Erişim Kontrolü
- Tüm response endpoint'leri SMS Parser App API key ile erişilebilir
- `X-SMS-Parser-API-Key` header'ı gerekli
- JWT token authentication gerekmez

### Veri Gizliliği
- SMS içeriği sadece ilk 100 karakter saklanır
- Hassas bilgiler (şifreler, token'lar) response'da saklanmaz
- IP adresleri ve user agent bilgileri saklanır (debugging için)

## Performans

### Database Optimizasyonu
- TTL index ile otomatik temizlik
- Compound index'ler ile hızlı sorgulama
- Pagination ile büyük veri setlerini yönetme

### Caching Önerileri
- İstatistik verilerini Redis'te cache'leme
- Sık kullanılan sorguları cache'leme
- Real-time monitoring için WebSocket kullanımı

## Troubleshooting

### Yaygın Sorunlar

1. **Yüksek Response Time**
   - Database index'lerini kontrol edin
   - MongoDB performansını izleyin
   - Network latency'yi kontrol edin

2. **Yüksek Error Rate**
   - Hata özetini inceleyin
   - SMS Parser App loglarını kontrol edin
   - API validation kurallarını gözden geçirin

3. **Storage Issues**
   - TTL cleanup'ı kontrol edin
   - Database boyutunu izleyin
   - Cleanup endpoint'ini manuel çalıştırın

### Debug Commands
```bash
# Son 100 response'u görüntüle
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "http://localhost:3000/api/sms-parser/responses?limit=100"

# Belirli endpoint'in hatalarını görüntüle
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "http://localhost:3000/api/sms-parser/responses?endpoint=verify-otp&isSuccess=false"

# Eski verileri temizle
curl -X POST -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"days": 7}' \
  "http://localhost:3000/api/sms-parser/responses/cleanup"
```
