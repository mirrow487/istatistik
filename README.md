# ABD Trend Radarı

Etsy + Printify ile ABD'ye giyim satanlar için: **hangi ay hangi tasarım teması popüler**,
ne zaman hazırlanmalı ve **Gemini'ye tasarım yaptırmak için hazır prompt**.

## Özellikler

- **Canlı pano**: New York / Türkiye saati, yaklaşan ABD günlerine saniye saniye geri sayım,
  "listeleme son gün" sayaçları ve her saniye tarihe göre yeniden hesaplanan endeks.
- **Gerçek ilgi verisi (Wikipedia)**: her trend için İngilizce Wikipedia görüntülenmeleri
  (son 30 gün çizgisi, 7 günlük ortalama, önceki haftaya göre % değişim). Wikimedia API'den
  15 dakikada bir çekilir; kaynak veriyi günde bir kez günceller.

- **Ay / kategori / arama filtreleri**: seçilen aya göre her şey yeniden hesaplanır.
- **Şimdi hazırla**: önümüzdeki 1–3 ayda zirve yapacak trendler (Etsy'de 6–8 hafta önceden listelemek için).
- **Popülerlik sıralaması**: 47 trend için 0–100 puan, geçen aya göre değişim, 12 aylık mini grafik,
  rekabet seviyesi, Google Trends (ABD) ve Etsy arama linkleri.
- **Yıllık takvim (ısı haritası)**: hangi tema hangi ay zirve yapıyor.
- **→ tuşu**: her trendin yanında. Gemini için İngilizce tasarım prompt'u + 13 Etsy etiketi üretir.
  Ürün (Bella+Canvas 3001, Comfort Colors 1717, Gildan 18000/18500), stil, kumaş rengi, arka plan,
  slogan, baskı yeri ve varyasyon sayısı seçilebilir. Prompt Printify ölçülerini (4500×5400 px) ve
  telif uyarılarını içerir.
- **Satış kayıtlarım**: kendi Etsy satışlarını gir; trende göre gelir grafiği, dönüşüm oranı,
  JSON dışa/içe aktarma. Veriler tarayıcının localStorage'ında tutulur.

## Kullanım

Kurulum yok. `index.html` dosyasını tarayıcıda aç ya da GitHub Pages ile yayınla
(Settings → Pages → Branch seç → `/ (root)`).

## Veri hakkında

**Endeks** pazar verisi değil, bir modeldir; ABD'de her yıl tekrarlanan alışveriş sezonlarına göre hazırlanmış
tahmini endekslerdir. Karar vermeden önce satırdaki Google Trends / Etsy linkleriyle doğrula.
Trend eklemek veya puanları değiştirmek için `js/data.js` dosyasını düzenle
(`peaks: [[ay, zirvePuanı, yayılım]]`, ay 0 = Ocak).
