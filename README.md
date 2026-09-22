# Trend Radarı

Etsy + Printify ile ABD'ye giyim satanlar için: **şu an ABD'de hangi tasarım teması popüler**,
ne zaman hazırlanmalı ve **Gemini'ye tasarım yaptırmak için hazır prompt**.

## Nasıl açılır

Tek dosya: **`index.html`**. İndirip çift tıkla (Chrome/Edge/Safari) — başka dosyaya gerek yok.
İnternette yayınlamak için: GitHub → Settings → Pages → Branch seç → `/ (root)`.

## Nasıl kullanılır

1. **Bir trend seç** — "Şu an popüler" sekmesinde kartlar talep puanına göre sıralı.
2. **Turuncu "Gemini prompt'u al" butonuna bas** — ürün, stil, tişört rengi, yazı ve baskı yerini seç.
3. **Prompt'u kopyala → Gemini'ye yapıştır.** Etsy için 13 etiket de hazır.

## Sekmeler

- **Şu an popüler**: 47 tema; canlı talep puanı, son 30 gün değişimi, 12 aylık grafik, rekabet, etkinliğe geri sayım, Google Trends / Etsy linkleri, Wikipedia ilgisi.
- **Hazırlanma zamanı**: yaklaşan ABD günleri tarih sırasıyla; etkinliğe ve "listeleme son gün"e (45 gün önce) saniyelik sayaç.
- **Yıllık takvim**: hangi tema hangi ay zirve yapıyor.
- **Satışlarım**: kendi satışlarını gir, trende göre gelir; JSON yedeği kopyala / yükle.

## Veri hakkında

**Talep puanı** gerçek satış verisi değil; ABD'de her yıl tekrarlanan alışveriş sezonlarına göre kurulmuş
bir modeldir ve tarihe göre her saniye yeniden hesaplanır. **Wikipedia ilgisi** gerçektir
(İngilizce Wikipedia günlük görüntülenme, önceki haftaya göre değişim; 15 dakikada bir kontrol edilir).
Trend eklemek / puan değiştirmek için `index.html` içindeki "VERİ" bölümünü düzenle
(`peaks: [[ay, zirvePuanı, yayılım]]`, ay 0 = Ocak).
