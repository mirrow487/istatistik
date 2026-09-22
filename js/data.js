/*
 * ABD giyim (POD) trend verisi.
 *
 * Buradaki puanlar CANLI VERİ DEĞİLDİR: ABD'de her yıl tekrarlanan alışveriş
 * sezonlarına (bayramlar, okul takvimi, spor sezonu, hediye dönemleri) göre
 * hazırlanmış 0-100 arası TAHMİNİ talep endeksleridir. Her trendin yanındaki
 * Google Trends / Etsy linkleriyle güncel durumu doğrulayın ve gerekirse bu
 * dosyadaki değerleri düzenleyin.
 *
 * Alanlar:
 *   peaks   : [[ayIndex(0=Ocak), zirvePuanı, yayılım(ay)], ...]
 *   base    : sezon dışı taban puan
 *   gift    : true ise Kasım-Aralık hediye sezonunda ek artış alır
 *   comp    : rekabet seviyesi (1=düşük, 2=orta, 3=yüksek)
 *   style   : prompt'ta varsayılan stil anahtarı (bkz. STYLES)
 *   ideas   : İngilizce slogan / tasarım fikirleri (baskıya girecek metin)
 */

const MONTHS = ["Oca", "Şub", "Mar", "Nis", "May", "Haz", "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara"];
const MONTHS_LONG = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];

const CATEGORIES = {
  holiday: "Bayram & Özel Gün",
  season: "Mevsim",
  event: "Etkinlik & Grup",
  awareness: "Farkındalık",
  profession: "Meslek",
  family: "Aile",
  hobby: "Hobi & Yaşam Tarzı",
  humor: "Mizah & Aesthetic",
};

const PRODUCTS = {
  tee: "Unisex T-shirt (Bella+Canvas 3001)",
  cc: "Comfort Colors 1717 T-shirt",
  sweat: "Crewneck Sweatshirt (Gildan 18000)",
  hoodie: "Hoodie (Gildan 18500)",
  kids: "Çocuk / Bebek body",
};

const STYLES = {
  retro: { tr: "Retro / Vintage 70'ler", en: "retro vintage 1970s style, groovy bold rounded lettering, sunset stripes, subtle distressed grain texture" },
  minimal: { tr: "Minimalist çizgi", en: "minimalist single-line art illustration with clean, simple typography and generous negative space" },
  typo: { tr: "Sadece tipografi", en: "bold modern typography-only layout, stacked lettering with strong hierarchy and high contrast" },
  watercolor: { tr: "Suluboya", en: "soft watercolor illustration with an elegant hand-lettered script font" },
  cute: { tr: "Sevimli / Kawaii", en: "cute kawaii cartoon illustration with thick clean outlines and a playful rounded font" },
  western: { tr: "Western / Kovboy", en: "western cowgirl aesthetic, rope-style lettering, desert and horseshoe elements, vintage rodeo poster feel" },
  badge: { tr: "Vintage rozet / Park posteri", en: "vintage outdoor badge emblem in the style of retro national-park posters, limited flat colors" },
  varsity: { tr: "Varsity / Kolej", en: "collegiate varsity arch lettering with a faded, puff-print look, trendy Comfort Colors aesthetic" },
  doodle: { tr: "El çizimi doodle", en: "hand-drawn doodle illustration with marker-style lines and quirky handwritten font" },
  distressed: { tr: "Eskitilmiş / Grunge", en: "distressed grunge texture, worn vintage print effect, bold condensed type" },
};

const GARMENT_COLORS = {
  white: { tr: "Beyaz", en: "white" },
  black: { tr: "Siyah", en: "black" },
  ivory: { tr: "Ivory / Natural", en: "ivory (natural cream)" },
  pepper: { tr: "Pepper (koyu gri)", en: "pepper (faded dark charcoal)" },
  sand: { tr: "Sand (bej)", en: "sand beige" },
  heather: { tr: "Açık gri melanj", en: "light heather grey" },
  navy: { tr: "Lacivert", en: "navy blue" },
  green: { tr: "Orman yeşili", en: "forest green" },
  maroon: { tr: "Bordo", en: "maroon" },
  pink: { tr: "Açık pembe", en: "light pink" },
};

const TRENDS = [
  // ---------- Bayram & özel günler ----------
  { id: "newyear", tr: "Yılbaşı / Yeni Yıl", en: "New Year's Eve & New Year", cat: "holiday",
    peaks: [[11, 70, 0.6], [0, 45, 0.5]], base: 8, comp: 2, style: "typo",
    products: ["tee", "sweat"], colors: ["black", "white"],
    audience: "party-goers, couples, families celebrating the new year",
    ideas: ["Hello {NEXT_YEAR}", "New Year Same Me", "Cheers to {NEXT_YEAR}", "Resolution: More Naps"],
    tags: ["new years shirt", "new year eve tee", "hello new year", "nye party shirt", "cheers shirt", "holiday party tee", "new year gift", "funny resolution", "celebration shirt", "family nye shirt", "glitter new year", "countdown shirt", "happy new year"] },

  { id: "fitness", tr: "Yeni yıl spor motivasyonu", en: "Gym & Fitness Motivation", cat: "hobby",
    peaks: [[0, 75, 0.9]], base: 35, comp: 3, style: "distressed",
    products: ["tee", "hoodie"], colors: ["black", "heather"],
    audience: "gym-goers, runners and people starting New Year fitness goals",
    ideas: ["Lift Heavy Pet Dogs", "Just Here For The Snacks", "Sweat Now Glow Later", "Leg Day Survivor"],
    tags: ["gym shirt", "workout tee", "fitness gift", "funny gym shirt", "lifting shirt", "pump cover", "gym hoodie", "weightlifting tee", "running shirt", "motivation shirt", "gym rat", "fitness lover", "leg day"] },

  { id: "valentine", tr: "Sevgililer Günü", en: "Valentine's Day", cat: "holiday",
    peaks: [[1, 92, 0.55], [0, 55, 0.4]], base: 6, comp: 3, style: "retro",
    products: ["sweat", "cc", "tee"], colors: ["pink", "white", "ivory"],
    audience: "women 18-45, couples, teachers and moms buying for Valentine's Day",
    ideas: ["Lover Era", "XOXO", "Valentine Vibes", "Cupid's Favorite", "Teaching Sweethearts"],
    tags: ["valentine sweatshirt", "valentine shirt", "xoxo sweatshirt", "lover shirt", "cute valentine tee", "teacher valentine", "valentines gift", "retro heart shirt", "love sweatshirt", "galentines day", "valentine day tee", "pink heart shirt", "womens valentine"] },

  { id: "galentine", tr: "Galentine's / Anti-Valentine", en: "Galentine's & Anti-Valentine", cat: "humor",
    peaks: [[1, 60, 0.5]], base: 5, comp: 1, style: "doodle",
    products: ["tee", "sweat"], colors: ["pink", "black"],
    audience: "single women and friend groups who celebrate Galentine's Day",
    ideas: ["Galentine's Squad", "Single And Snacking", "Love Stinks", "My Dog Is My Valentine"],
    tags: ["galentines shirt", "anti valentine", "single shirt", "funny valentine", "galentines gift", "best friend shirt", "girls night tee", "dog valentine", "love stinks", "sarcastic valentine", "squad shirt", "bff gift", "self love shirt"] },

  { id: "bhm", tr: "Siyahi Tarih Ayı (Şubat)", en: "Black History Month", cat: "awareness",
    peaks: [[1, 70, 0.6]], base: 10, comp: 2, style: "typo",
    products: ["tee", "sweat"], colors: ["black", "ivory"],
    audience: "adults and educators celebrating Black History Month",
    ideas: ["Black History Is American History", "Melanin Magic", "Proud Legacy", "Educated Black Woman"],
    tags: ["black history month", "bhm shirt", "melanin shirt", "black pride tee", "juneteenth gift", "african american", "black owned", "black teacher", "history shirt", "black queen", "culture shirt", "heritage tee", "empowerment shirt"] },

  { id: "stpatrick", tr: "St. Patrick's Day", en: "St. Patrick's Day", cat: "holiday",
    peaks: [[2, 88, 0.45]], base: 4, comp: 3, style: "retro",
    products: ["tee", "cc"], colors: ["green", "white"],
    audience: "adults going to St. Patrick's Day parades, parties and bar crawls",
    ideas: ["Lucky Vibes", "Feeling Lucky", "Shenanigans Coordinator", "One Lucky Mama", "Irish Today"],
    tags: ["st patricks shirt", "lucky shirt", "st pattys day", "shamrock tee", "irish shirt", "green shirt", "funny st patrick", "lucky mama", "bar crawl shirt", "clover shirt", "drinking shirt", "retro lucky", "teacher st patricks"] },

  { id: "basketball", tr: "Basketbol / Mart sezonu (takım logosuz)", en: "Basketball Season (generic)", cat: "event",
    peaks: [[2, 60, 0.6]], base: 15, comp: 2, style: "varsity",
    products: ["tee", "hoodie"], colors: ["white", "black"],
    audience: "basketball moms, dads and fans (no team or league branding)",
    ideas: ["Basketball Mom", "Hoop Dreams", "Loud & Proud Basketball Mama", "Game Day Vibes"],
    tags: ["basketball mom", "basketball shirt", "hoops tee", "sports mom", "game day shirt", "basketball gift", "team mom shirt", "court shirt", "basketball dad", "bball mom", "sports fan tee", "youth basketball", "custom basketball"] },

  { id: "easter", tr: "Paskalya", en: "Easter", cat: "holiday",
    peaks: [[3, 78, 0.5], [2, 45, 0.4]], base: 5, comp: 2, style: "cute",
    products: ["tee", "kids", "sweat"], colors: ["white", "pink", "ivory"],
    audience: "moms, kids and Christian families celebrating Easter",
    ideas: ["Hoppy Easter", "He Is Risen", "Some Bunny Loves You", "Egg Hunt Squad"],
    tags: ["easter shirt", "easter bunny tee", "he is risen", "kids easter shirt", "christian easter", "egg hunt shirt", "cute easter tee", "family easter", "spring shirt", "bunny shirt", "easter gift", "toddler easter", "easter mama"] },

  { id: "earthday", tr: "Dünya Günü / Doğa", en: "Earth Day & Nature", cat: "awareness",
    peaks: [[3, 55, 0.5]], base: 18, comp: 1, style: "badge",
    products: ["cc", "tee"], colors: ["sand", "green", "ivory"],
    audience: "eco-conscious millennials and Gen Z, nature lovers, teachers",
    ideas: ["There Is No Planet B", "Protect Our Planet", "Earth Day Every Day", "Grow Positive Thoughts"],
    tags: ["earth day shirt", "nature shirt", "planet b", "environment tee", "eco friendly", "climate shirt", "save the earth", "botanical shirt", "outdoor tee", "earth day teacher", "hippie shirt", "sustainability", "plant shirt"] },

  { id: "autism", tr: "Otizm Farkındalığı", en: "Autism Acceptance", cat: "awareness",
    peaks: [[3, 65, 0.5]], base: 12, comp: 2, style: "doodle",
    products: ["tee", "sweat"], colors: ["white", "heather"],
    audience: "parents, special education teachers and autism advocates",
    ideas: ["Different Not Less", "Autism Mom", "Acceptance Matters", "Be Kind To Every Kind Of Mind"],
    tags: ["autism awareness", "autism mom", "acceptance shirt", "neurodiversity", "sped teacher", "autism shirt", "infinity symbol", "different not less", "autism support", "special education", "inclusion shirt", "be kind shirt", "neurodivergent"] },

  { id: "mothers", tr: "Anneler Günü / Mama", en: "Mother's Day & Mama", cat: "family",
    peaks: [[4, 90, 0.5]], base: 35, gift: true, comp: 3, style: "retro",
    products: ["sweat", "cc", "tee"], colors: ["ivory", "sand", "pink"],
    audience: "mothers aged 25-50 and people buying gifts for moms",
    ideas: ["Mama", "Blessed Mama", "Mom Life", "Custom Mama With Kids Names", "Grandma Est. {YEAR}"],
    tags: ["mama sweatshirt", "mothers day gift", "mom shirt", "custom mama", "mama shirt", "new mom gift", "grandma shirt", "retro mama", "mom life", "gift for mom", "personalized mom", "mama est", "boy mom"] },

  { id: "teacherapp", tr: "Öğretmenler Haftası & okul sonu", en: "Teacher Appreciation & Last Day of School", cat: "profession",
    peaks: [[4, 70, 0.5]], base: 10, comp: 2, style: "doodle",
    products: ["tee", "cc"], colors: ["white", "ivory"],
    audience: "elementary teachers and parents gifting teachers",
    ideas: ["Schools Out For Summer", "Teacher Off Duty", "Last Day Vibes", "Thank You For Helping Me Grow"],
    tags: ["last day of school", "teacher off duty", "schools out", "teacher appreciation", "teacher gift", "end of year teacher", "summer teacher", "teacher summer tee", "field day shirt", "teacher squad", "retro teacher", "teacher vacation", "class shirt"] },

  { id: "nurseweek", tr: "Hemşireler Haftası (Mayıs)", en: "Nurses Week", cat: "profession",
    peaks: [[4, 60, 0.4]], base: 30, comp: 3, style: "doodle",
    products: ["tee", "sweat"], colors: ["white", "pink"],
    audience: "registered nurses, nursing students and hospital staff",
    ideas: ["Nurse Life", "Future Nurse", "ER Nurse Squad", "Coffee Scrubs And Rubber Gloves"],
    tags: ["nurse shirt", "nurse week gift", "rn shirt", "nursing student", "er nurse", "icu nurse", "nurse life", "nurse sweatshirt", "future nurse", "nurse gift", "l&d nurse", "nicu nurse", "nurse squad"] },

  { id: "graduation", tr: "Mezuniyet (Class of {NEXT_YEAR})", en: "Graduation Class Of {NEXT_YEAR}", cat: "event",
    peaks: [[4, 80, 0.6], [5, 60, 0.4]], base: 6, comp: 2, style: "varsity",
    products: ["tee", "hoodie"], colors: ["black", "white"],
    audience: "high school and college seniors and their proud families",
    ideas: ["Senior {NEXT_YEAR}", "Class Of {NEXT_YEAR}", "Proud Mom Of A {NEXT_YEAR} Graduate", "Done With School Stuff"],
    tags: ["senior {NEXT_YEAR}", "class of {NEXT_YEAR}", "graduation shirt", "proud graduate mom", "grad gift", "senior shirt", "college grad", "high school grad", "graduation family", "grad party tee", "senior mom", "graduate shirt", "custom graduation"] },

  { id: "pride", tr: "Pride Ayı (Haziran)", en: "Pride Month", cat: "awareness",
    peaks: [[5, 78, 0.5]], base: 12, comp: 3, style: "retro",
    products: ["tee", "cc"], colors: ["white", "black"],
    audience: "LGBTQ+ adults and allies",
    ideas: ["Love Is Love", "Proud Ally", "Be You", "Free Mom Hugs"],
    tags: ["pride shirt", "lgbtq shirt", "love is love", "ally shirt", "rainbow shirt", "pride month", "gay pride tee", "equality shirt", "queer shirt", "free mom hugs", "pride gift", "be you shirt", "trans pride"] },

  { id: "fathers", tr: "Babalar Günü / Dad", en: "Father's Day & Dad", cat: "family",
    peaks: [[5, 88, 0.5]], base: 28, gift: true, comp: 3, style: "distressed",
    products: ["tee", "hoodie"], colors: ["heather", "black", "navy"],
    audience: "dads aged 28-60 and families buying gifts for dad",
    ideas: ["Dad Joke Loading", "Girl Dad", "Custom Dad With Kids Names", "The Man The Myth The Legend", "Reel Cool Dad"],
    tags: ["fathers day gift", "dad shirt", "girl dad", "funny dad shirt", "dad joke tee", "new dad gift", "custom dad shirt", "papa shirt", "grandpa shirt", "gift for dad", "best dad ever", "dad est", "fishing dad"] },

  { id: "juneteenth", tr: "Juneteenth", en: "Juneteenth", cat: "holiday",
    peaks: [[5, 60, 0.4]], base: 4, comp: 1, style: "typo",
    products: ["tee"], colors: ["black", "white"],
    audience: "African American families and communities celebrating Juneteenth",
    ideas: ["Juneteenth 1865", "Free-ish Since 1865", "Celebrate Freedom", "Black And Proud"],
    tags: ["juneteenth shirt", "1865 shirt", "freeish", "black history", "freedom day", "juneteenth tee", "african american", "black pride", "juneteenth family", "celebrate freedom", "melanin", "black culture", "june 19"] },

  { id: "july4", tr: "4 Temmuz / Americana", en: "4th of July & Americana", cat: "holiday",
    peaks: [[6, 90, 0.45], [5, 70, 0.45]], base: 12, comp: 3, style: "retro",
    products: ["cc", "tee", "kids"], colors: ["white", "ivory", "navy"],
    audience: "American families, moms and patriots preparing for Independence Day parties",
    ideas: ["Party In The USA", "America Vibes", "All American Mama", "Red White & Booze", "Land Of The Free"],
    tags: ["4th of july shirt", "america shirt", "patriotic tee", "usa shirt", "fourth of july", "retro america", "red white blue", "independence day", "american mama", "family july 4th", "merica shirt", "usa flag tee", "party in the usa"] },

  { id: "summer", tr: "Yaz / Plaj / Tatil", en: "Summer, Beach & Vacation", cat: "season",
    peaks: [[6, 75, 1.0]], base: 12, comp: 3, style: "retro",
    products: ["cc", "tee"], colors: ["ivory", "white", "pink"],
    audience: "women and families going on beach vacations, cruises and lake trips",
    ideas: ["Salty Soul", "Beach Please", "Lake Life", "Vitamin Sea", "Cruise Squad {YEAR}"],
    tags: ["beach shirt", "summer tee", "vacation shirt", "lake life", "cruise shirt", "salty shirt", "tropical tee", "coastal shirt", "summer vibes", "girls trip", "family vacation", "boho beach", "sunset shirt"] },

  { id: "reunion", tr: "Aile buluşması / Grup tişörtü", en: "Family Reunion & Group Trips", cat: "event",
    peaks: [[6, 70, 1.2]], base: 15, comp: 2, style: "typo",
    products: ["tee"], colors: ["white", "heather"],
    audience: "extended families and friend groups ordering matching custom shirts",
    ideas: ["Family Reunion {YEAR}", "Girls Trip {YEAR}", "Making Memories Together", "Custom Family Name Est."],
    tags: ["family reunion shirt", "matching family tee", "custom group shirt", "girls trip shirt", "family vacation tee", "reunion tee", "bulk shirts", "friends trip", "custom family", "road trip shirt", "cousin crew", "group tee", "trip {YEAR}"] },

  { id: "bachelorette", tr: "Bekarlığa veda (Bachelorette)", en: "Bachelorette & Bridal Party", cat: "event",
    peaks: [[5, 70, 2.0]], base: 20, comp: 3, style: "western",
    products: ["tee", "cc"], colors: ["white", "pink", "black"],
    audience: "brides and bridesmaids planning bachelorette weekends",
    ideas: ["Last Rodeo", "Let's Go Girls", "Bride Squad", "Nashville Bachelorette", "Last Disco"],
    tags: ["bachelorette shirt", "bride shirt", "last rodeo", "bridal party tee", "bride squad", "nashville bach", "last disco", "bridesmaid gift", "bach party", "western bachelorette", "custom bride", "lets go girls", "wedding party"] },

  { id: "backtoschool", tr: "Okula dönüş / Öğretmen", en: "Back To School", cat: "profession",
    peaks: [[7, 88, 0.55], [6, 50, 0.4]], base: 10, comp: 3, style: "doodle",
    products: ["tee", "sweat", "kids"], colors: ["white", "ivory", "sand"],
    audience: "teachers, school staff, kids and parents at the start of the school year",
    ideas: ["First Day Of School", "Teach Love Inspire", "Kindergarten Here I Come", "Retro Teacher Vibes"],
    tags: ["back to school", "teacher shirt", "first day of school", "kindergarten shirt", "teacher tee", "school shirt", "retro teacher", "teacher gift", "kids school tee", "grade level shirt", "teaching team", "first grade", "teacher squad"] },

  { id: "football", tr: "Futbol sezonu / Game day (logosuz)", en: "Football Season Game Day (generic)", cat: "event",
    peaks: [[9, 80, 1.3]], base: 10, comp: 3, style: "varsity",
    products: ["cc", "sweat", "tee"], colors: ["ivory", "black", "maroon"],
    audience: "football moms, girlfriends and fans at high school and college games (no team logos)",
    ideas: ["Game Day", "Football Mom", "Friday Night Lights", "In My Football Mom Era", "Touchdown Season"],
    tags: ["game day shirt", "football mom", "football season", "friday night lights", "football sweatshirt", "sunday football", "football tee", "sports mom", "tailgate shirt", "custom football", "football girlfriend", "fall football", "touchdown shirt"] },

  { id: "fall", tr: "Sonbahar / Balkabağı / Cozy", en: "Fall, Pumpkin Spice & Cozy Season", cat: "season",
    peaks: [[9, 82, 1.0]], base: 8, comp: 3, style: "retro",
    products: ["sweat", "cc"], colors: ["sand", "ivory", "maroon"],
    audience: "women 20-45 who love autumn, pumpkin patches and cozy vibes",
    ideas: ["Hello Fall", "Pumpkin Spice Season", "Cozy Season", "Fall Y'all", "Sweater Weather"],
    tags: ["fall sweatshirt", "pumpkin shirt", "autumn tee", "fall vibes", "pumpkin spice", "cozy season", "thanksgiving shirt", "fall yall", "fall shirt women", "retro fall", "sweater weather", "pumpkin patch", "hello fall"] },

  { id: "halloween", tr: "Cadılar Bayramı", en: "Halloween", cat: "holiday",
    peaks: [[9, 98, 0.5], [8, 60, 0.4]], base: 5, comp: 3, style: "retro",
    products: ["sweat", "tee", "kids"], colors: ["black", "ivory", "sand"],
    audience: "women, teachers, moms and kids who love spooky season (no copyrighted movie characters)",
    ideas: ["Spooky Season", "Stay Spooky", "Ghost Squad", "Boo Crew", "Teacher Of Little Monsters"],
    tags: ["halloween shirt", "spooky season", "ghost sweatshirt", "halloween sweatshirt", "retro halloween", "stay spooky", "teacher halloween", "cute ghost tee", "boo shirt", "halloween party", "witchy shirt", "pumpkin ghost", "halloween gift"] },

  { id: "breastcancer", tr: "Meme kanseri farkındalığı (Ekim)", en: "Breast Cancer Awareness", cat: "awareness",
    peaks: [[9, 70, 0.45]], base: 12, comp: 2, style: "typo",
    products: ["tee", "sweat"], colors: ["pink", "white", "black"],
    audience: "survivors, supporters, teams and walk groups in October",
    ideas: ["In October We Wear Pink", "Fight Like A Girl", "Survivor", "Pink Out Team"],
    tags: ["breast cancer shirt", "pink ribbon", "we wear pink", "cancer survivor", "awareness shirt", "pink out shirt", "fight like a girl", "october pink", "cancer support", "team shirt", "breast cancer gift", "survivor tee", "walk shirt"] },

  { id: "thanksgiving", tr: "Şükran Günü", en: "Thanksgiving", cat: "holiday",
    peaks: [[10, 82, 0.45]], base: 4, comp: 2, style: "retro",
    products: ["sweat", "tee"], colors: ["sand", "ivory", "maroon"],
    audience: "families, moms and friends gathering for Thanksgiving dinner",
    ideas: ["Thankful Grateful Blessed", "Gobble Gobble", "Turkey Trot {YEAR}", "Eat Drink And Be Thankful"],
    tags: ["thanksgiving shirt", "thankful shirt", "gobble gobble", "turkey shirt", "family thanksgiving", "grateful tee", "fall sweatshirt", "friendsgiving", "turkey trot", "blessed shirt", "thanksgiving gift", "pumpkin pie shirt", "funny turkey"] },

  { id: "veterans", tr: "Gaziler Günü / Asker ailesi", en: "Veterans & Military Family", cat: "awareness",
    peaks: [[10, 60, 0.4], [4, 40, 0.3]], base: 18, comp: 2, style: "distressed",
    products: ["tee", "hoodie"], colors: ["black", "heather", "green"],
    audience: "veterans, military spouses and proud military families",
    ideas: ["Proud Army Mom", "Veteran", "Home Of The Free Because Of The Brave", "Military Wife"],
    tags: ["veteran shirt", "military mom", "army mom shirt", "veterans day", "proud veteran", "military wife", "patriotic tee", "usa veteran", "navy mom", "air force mom", "marine mom", "military gift", "freedom shirt"] },

  { id: "christmas", tr: "Noel / Christmas", en: "Christmas", cat: "holiday",
    peaks: [[11, 100, 0.55], [10, 85, 0.45]], base: 6, comp: 3, style: "retro",
    products: ["sweat", "tee", "hoodie"], colors: ["green", "maroon", "ivory", "white"],
    audience: "women, moms, teachers and families shopping for Christmas outfits and gifts",
    ideas: ["Merry And Bright", "Christmas Vibes", "Most Likely To... (family set)", "Retro Santa", "Teacher Christmas Crew"],
    tags: ["christmas sweatshirt", "christmas shirt", "merry christmas", "retro christmas", "christmas tree shirt", "holiday sweatshirt", "teacher christmas", "cute christmas", "santa shirt", "christmas gift", "winter sweatshirt", "merry and bright", "xmas tee"] },

  { id: "xmasfamily", tr: "Aile eşleşen Noel tişörtleri", en: "Matching Family Christmas", cat: "family",
    peaks: [[11, 90, 0.5], [10, 75, 0.4]], base: 3, comp: 3, style: "typo",
    products: ["tee", "kids", "sweat"], colors: ["white", "maroon", "green"],
    audience: "families ordering matching shirts for Christmas photos and pajama parties",
    ideas: ["Most Likely To Eat All The Cookies", "Family Christmas {YEAR}", "Christmas Crew", "Custom Family Name Christmas"],
    tags: ["matching xmas shirt", "family xmas shirt", "most likely to", "christmas crew", "christmas {YEAR}", "family pajama", "custom christmas", "group christmas", "christmas matching", "kids christmas", "christmas photo", "funny christmas", "family xmas"] },

  { id: "uglysweater", tr: "Çirkin Noel kazağı (baskı)", en: "Ugly Christmas Sweater Print", cat: "humor",
    peaks: [[11, 80, 0.45]], base: 3, comp: 2, style: "doodle",
    products: ["sweat"], colors: ["green", "maroon", "black"],
    audience: "adults attending office and friends ugly-sweater parties",
    ideas: ["Ugly Sweater Pattern With Funny Twist", "Meowy Christmas", "Pugs And Kisses", "Sleigh All Day"],
    tags: ["ugly xmas sweater", "funny christmas", "ugly sweater party", "meowy christmas", "office party", "christmas sweatshirt", "dog christmas", "cat christmas", "sleigh all day", "tacky sweater", "holiday party", "christmas humor", "gag gift"] },

  { id: "winter", tr: "Kış / Kayak / Cozy", en: "Winter, Ski & Snow", cat: "season",
    peaks: [[0, 60, 1.0]], base: 10, comp: 1, style: "badge",
    products: ["sweat", "hoodie"], colors: ["ivory", "navy", "heather"],
    audience: "skiers, snowboarders and people who love cozy winter vibes",
    ideas: ["Apres Ski Club", "Snow Day", "Mountain Mama", "Hot Cocoa Season"],
    tags: ["ski sweatshirt", "apres ski", "winter sweatshirt", "snow shirt", "mountain shirt", "snowboard tee", "winter vibes", "hot cocoa", "cozy winter", "ski trip", "ski club", "retro ski", "snow day"] },

  // ---------- Evergreen (her mevsim) ----------
  { id: "dogmom", tr: "Köpek annesi / Evcil hayvan", en: "Dog Mom & Pet Lovers", cat: "hobby",
    peaks: [[4, 55, 0.6]], base: 50, gift: true, comp: 3, style: "minimal",
    products: ["tee", "sweat", "cc"], colors: ["ivory", "sand", "heather"],
    audience: "dog owners, especially women 25-45, and people buying pet-lover gifts",
    ideas: ["Dog Mama", "Custom Dog Ears Name", "Dogs Before Dudes", "Life Is Better With A Dog"],
    tags: ["dog mom shirt", "dog mama", "custom dog shirt", "dog lover gift", "pet mom", "dog ears shirt", "fur mama", "dog sweatshirt", "dog owner gift", "dog dad", "pet portrait", "funny dog tee", "rescue dog"] },

  { id: "cat", tr: "Kedi sever", en: "Cat Lovers", cat: "hobby",
    peaks: [], base: 48, gift: true, comp: 3, style: "cute",
    products: ["tee", "sweat"], colors: ["black", "ivory"],
    audience: "cat owners and introverts who love cats",
    ideas: ["Cat Mom", "I'm Just Here For The Cats", "Meowdy", "Purrfectly Fine"],
    tags: ["cat shirt", "cat mom", "cat lover gift", "funny cat tee", "cat sweatshirt", "meowdy", "black cat", "cat lady", "kitten shirt", "cat dad", "cute cat", "pet lover", "introvert cat"] },

  { id: "bookish", tr: "Kitap kurdu / Bookish", en: "Bookish & Reading", cat: "hobby",
    peaks: [[9, 55, 1.2]], base: 45, gift: true, comp: 2, style: "minimal",
    products: ["sweat", "cc"], colors: ["ivory", "sand", "green"],
    audience: "readers, BookTok fans, librarians and English teachers",
    ideas: ["Just One More Chapter", "Book Club", "Reading Is My Cardio", "Romance Reader Era", "Bookish Floral"],
    tags: ["book lover shirt", "bookish sweatshirt", "reading shirt", "librarian gift", "booktok", "book club shirt", "one more chapter", "romance reader", "reader gift", "book nerd", "english teacher", "literary shirt", "book sweatshirt"] },

  { id: "nurse", tr: "Hemşire / Sağlık (evergreen)", en: "Nurse & Healthcare", cat: "profession",
    peaks: [[4, 60, 0.5]], base: 45, gift: true, comp: 3, style: "doodle",
    products: ["tee", "sweat"], colors: ["white", "pink", "heather"],
    audience: "nurses, CNAs, nursing students and healthcare workers",
    ideas: ["Nurse Life", "Heartbeat Nurse", "Nursing School Survivor", "Custom Nurse Title"],
    tags: ["nurse shirt", "nurse gift", "nursing student", "rn shirt", "cna shirt", "nurse life", "er nurse", "nurse sweatshirt", "medical shirt", "healthcare worker", "nurse graduation", "pediatric nurse", "nicu nurse"] },

  { id: "teacher", tr: "Öğretmen (evergreen)", en: "Teachers", cat: "profession",
    peaks: [[7, 70, 0.8], [4, 55, 0.5]], base: 35, gift: true, comp: 3, style: "doodle",
    products: ["tee", "sweat", "cc"], colors: ["ivory", "white", "sand"],
    audience: "teachers, paraprofessionals and school counselors",
    ideas: ["Teach Love Inspire", "In My Teacher Era", "Kindness Matters", "Custom Grade Level Teacher"],
    tags: ["teacher shirt", "teacher gift", "teacher sweatshirt", "teacher era", "cute teacher", "retro teacher", "kindergarten teacher", "teacher appreciation", "teacher life", "school shirt", "teacher tee", "grade level", "sped teacher"] },

  { id: "mentalhealth", tr: "Ruh sağlığı / Pozitif söz", en: "Mental Health & Positive Quotes", cat: "humor",
    peaks: [[4, 55, 0.5]], base: 45, comp: 3, style: "minimal",
    products: ["cc", "sweat"], colors: ["ivory", "sand", "pink"],
    audience: "Gen Z and millennial women interested in self-care and therapy culture",
    ideas: ["Mental Health Matters", "You Are Enough", "Be Kind To Your Mind", "Dear Person Behind Me"],
    tags: ["mental health shirt", "self care", "you are enough", "positive shirt", "aesthetic sweatshirt", "person behind me", "be kind", "therapy shirt", "anxiety shirt", "trendy sweatshirt", "words on back", "inspirational", "kindness shirt"] },

  { id: "faith", tr: "Hristiyan inanç", en: "Christian Faith", cat: "humor",
    peaks: [[3, 55, 0.5], [11, 55, 0.5]], base: 45, comp: 3, style: "minimal",
    products: ["cc", "sweat", "tee"], colors: ["ivory", "sand", "white"],
    audience: "Christian women and church groups",
    ideas: ["Faith Over Fear", "Jesus Is King", "Blessed", "Wildflower Bible Verse"],
    tags: ["christian shirt", "faith shirt", "jesus shirt", "bible verse", "church shirt", "religious gift", "blessed shirt", "faith over fear", "christian sweatshirt", "god shirt", "boho christian", "prayer shirt", "worship tee"] },

  { id: "western", tr: "Western / Kovboy / Coastal cowgirl", en: "Western & Cowgirl", cat: "hobby",
    peaks: [[5, 55, 1.5]], base: 40, comp: 3, style: "western",
    products: ["cc", "tee"], colors: ["sand", "ivory", "black"],
    audience: "country-music fans and women who love western and cowgirl aesthetics",
    ideas: ["Howdy", "Rodeo Babe", "Coastal Cowgirl", "Wild West", "Space Cowgirl"],
    tags: ["western shirt", "cowgirl shirt", "howdy shirt", "rodeo tee", "country shirt", "coastal cowgirl", "retro western", "boho western", "country music", "cowboy shirt", "desert shirt", "nashville shirt", "yeehaw"] },

  { id: "outdoors", tr: "Kamp / Doğa / Milli parklar", en: "Camping, Hiking & National Parks", cat: "hobby",
    peaks: [[6, 70, 1.5]], base: 25, gift: true, comp: 2, style: "badge",
    products: ["tee", "hoodie", "cc"], colors: ["sand", "green", "heather"],
    audience: "hikers, campers and road-trippers (avoid official NPS logos)",
    ideas: ["Camp Crew", "Take A Hike", "Mountains Are Calling", "Happy Camper", "Vintage Park Poster Style"],
    tags: ["camping shirt", "hiking tee", "national park shirt", "outdoor shirt", "mountain tee", "adventure shirt", "camp crew", "happy camper", "nature lover", "road trip shirt", "hiker gift", "vintage park", "wanderlust"] },

  { id: "fishing", tr: "Balıkçılık / Avcılık", en: "Fishing & Hunting", cat: "hobby",
    peaks: [[5, 65, 1.3]], base: 30, gift: true, comp: 2, style: "distressed",
    products: ["tee", "hoodie"], colors: ["heather", "green", "sand"],
    audience: "men 30-65 who fish or hunt, and people buying gifts for them",
    ideas: ["Reel Cool Dad", "Fishing Is My Therapy", "Hooked On Fishing", "Bass Whisperer"],
    tags: ["fishing shirt", "fishing gift", "funny fishing", "fisherman tee", "bass fishing", "fishing dad", "hunting shirt", "outdoor gift", "lake shirt", "grandpa fishing", "fishing hoodie", "reel cool", "angler shirt"] },

  { id: "pickleball", tr: "Pickleball (yükselen)", en: "Pickleball", cat: "hobby",
    peaks: [[5, 65, 1.5]], base: 30, gift: true, comp: 2, style: "retro",
    products: ["tee", "cc"], colors: ["white", "ivory"],
    audience: "pickleball players aged 35-70 and their clubs",
    ideas: ["Dink Responsibly", "Pickleball Is My Therapy", "Kitchen Rules", "Retro Pickleball Club"],
    tags: ["pickleball shirt", "pickleball gift", "dink responsibly", "funny pickleball", "pickleball club", "pickleball player", "retro pickleball", "sports shirt", "paddle shirt", "grandma pickleball", "pickleball team", "kitchen shirt", "pickleball tee"] },

  { id: "humor", tr: "Komik / Sarkastik / İntrovert", en: "Funny, Sarcastic & Introvert", cat: "humor",
    peaks: [], base: 55, gift: true, comp: 3, style: "typo",
    products: ["tee", "sweat"], colors: ["black", "white", "heather"],
    audience: "adults who like sarcastic humor, introverts and meme culture",
    ideas: ["I Paused My Game To Be Here", "Introverted But Willing To Discuss Dogs", "Emotionally Unavailable", "Cool Aunt Club"],
    tags: ["funny shirt", "sarcastic shirt", "introvert shirt", "funny gift", "humor tee", "meme shirt", "cool aunt", "gamer shirt", "sassy shirt", "novelty shirt", "funny sayings", "trendy tee", "gift for friend"] },

  { id: "coffee", tr: "Kahve sever", en: "Coffee Lovers", cat: "humor",
    peaks: [[0, 55, 1.0]], base: 40, gift: true, comp: 2, style: "retro",
    products: ["cc", "sweat"], colors: ["ivory", "sand", "black"],
    audience: "coffee lovers, busy moms and teachers",
    ideas: ["But First Coffee", "Iced Coffee Addict", "Powered By Coffee", "Coffee And Chaos"],
    tags: ["coffee shirt", "coffee lover gift", "iced coffee", "funny coffee tee", "coffee sweatshirt", "mom coffee", "but first coffee", "caffeine shirt", "coffee addict", "latte shirt", "coffee teacher", "retro coffee", "espresso tee"] },

  { id: "birthday", tr: "Doğum günü / Milestone", en: "Birthday & Milestone", cat: "event",
    peaks: [], base: 50, comp: 2, style: "typo",
    products: ["tee"], colors: ["white", "black", "pink"],
    audience: "people celebrating 30th, 40th, 50th birthdays and their friend groups",
    ideas: ["Birthday Squad", "Vintage 1986 Limited Edition", "It's My Birthday", "40 And Fabulous"],
    tags: ["birthday shirt", "birthday squad", "40th birthday", "50th birthday", "30th birthday", "vintage birthday", "birthday girl", "birthday gift", "custom birthday", "milestone birthday", "birthday crew", "limited edition", "birthday party"] },

  { id: "aunt", tr: "Teyze / Hala / Büyükanne", en: "Aunt, Grandma & Extended Family", cat: "family",
    peaks: [[4, 60, 0.6]], base: 35, gift: true, comp: 2, style: "retro",
    products: ["sweat", "tee"], colors: ["ivory", "pink", "sand"],
    audience: "aunts, grandmas and relatives; pregnancy-announcement gift buyers",
    ideas: ["Cool Aunt Club", "Auntie Est. {YEAR}", "Promoted To Grandma", "Nana Custom Grandkids Names"],
    tags: ["aunt shirt", "auntie sweatshirt", "cool aunt", "grandma shirt", "nana shirt", "pregnancy reveal", "promoted to aunt", "custom grandma", "aunt gift", "gigi shirt", "grandkids names", "new aunt", "family gift"] },
];

/*
 * ABD etkinlik tarihleri (geri sayım için).
 *   fixed: [ay, gün]            → her yıl aynı gün
 *   nth:   [ay, haftaGünü, n]   → ayın n. haftaGünü (0=Pazar, 4=Perşembe); n=-1 son
 *   easter: true                → Paskalya Pazarı
 * Etkinliği olmayan trendlerde zirve ayının ortası kullanılır.
 */
const EVENTS = {
  newyear: { name: "Yılbaşı gecesi", fixed: [11, 31] },
  valentine: { name: "Sevgililer Günü", fixed: [1, 14] },
  galentine: { name: "Galentine's Day", fixed: [1, 13] },
  bhm: { name: "Siyahi Tarih Ayı", fixed: [1, 1] },
  stpatrick: { name: "St. Patrick's Day", fixed: [2, 17] },
  easter: { name: "Paskalya", easter: true },
  earthday: { name: "Dünya Günü", fixed: [3, 22] },
  autism: { name: "Otizm Farkındalık Günü", fixed: [3, 2] },
  mothers: { name: "Anneler Günü", nth: [4, 0, 2] },
  teacherapp: { name: "Öğretmenler Haftası", nth: [4, 1, 1] },
  nurseweek: { name: "Hemşireler Haftası", fixed: [4, 6] },
  graduation: { name: "Mezuniyet sezonu", fixed: [4, 15] },
  pride: { name: "Pride Ayı", fixed: [5, 1] },
  fathers: { name: "Babalar Günü", nth: [5, 0, 3] },
  juneteenth: { name: "Juneteenth", fixed: [5, 19] },
  july4: { name: "4 Temmuz", fixed: [6, 4] },
  backtoschool: { name: "Okulların açılışı", fixed: [7, 15] },
  football: { name: "Futbol sezonu açılışı", nth: [8, 4, 1] },
  halloween: { name: "Cadılar Bayramı", fixed: [9, 31] },
  breastcancer: { name: "Pembe Ekim", fixed: [9, 1] },
  veterans: { name: "Gaziler Günü", fixed: [10, 11] },
  thanksgiving: { name: "Şükran Günü", nth: [10, 4, 4] },
  christmas: { name: "Noel", fixed: [11, 25] },
  xmasfamily: { name: "Noel", fixed: [11, 25] },
  uglysweater: { name: "Ugly Sweater Day", nth: [11, 5, 3] },
};

/*
 * Gerçek ilgi sinyali: İngilizce Wikipedia sayfa görüntülenmeleri (Wikimedia API, günlük güncellenir).
 * Etsy/Google Trends'in herkese açık tarayıcı API'si olmadığı için en yakın ücretsiz canlı kaynak budur.
 */
const WIKI = {
  newyear: "New_Year's_Eve", fitness: "Physical_fitness", valentine: "Valentine's_Day",
  galentine: "Galentine's_Day", bhm: "Black_History_Month", stpatrick: "Saint_Patrick's_Day",
  basketball: "Basketball", easter: "Easter", earthday: "Earth_Day", autism: "Autism",
  mothers: "Mother's_Day", teacherapp: "Teachers'_Day", nurseweek: "International_Nurses_Day",
  graduation: "Graduation", pride: "Pride_Month", fathers: "Father's_Day", juneteenth: "Juneteenth",
  july4: "Independence_Day_(United_States)", summer: "Summer", reunion: "Family_reunion",
  bachelorette: "Bachelor_party", backtoschool: "School_supplies", football: "American_football",
  fall: "Autumn", halloween: "Halloween", breastcancer: "Breast_Cancer_Awareness_Month",
  thanksgiving: "Thanksgiving_(United_States)", veterans: "Veterans_Day", christmas: "Christmas",
  xmasfamily: "Christmas_and_holiday_season", uglysweater: "Christmas_jumper", winter: "Skiing",
  dogmom: "Dog", cat: "Cat", bookish: "BookTok", nurse: "Nursing", teacher: "Teacher",
  mentalhealth: "Mental_health", faith: "Christianity", western: "Rodeo", outdoors: "Camping",
  fishing: "Fishing", pickleball: "Pickleball", humor: "Sarcasm", coffee: "Coffee",
  birthday: "Birthday", aunt: "Grandparent",
};
