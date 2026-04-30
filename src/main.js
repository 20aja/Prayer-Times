// Global Variables
const all_times_list = document.querySelectorAll("#timesSection #time");
const all_data_value = document.querySelectorAll("#timesSection li");
const cityList = document.getElementById("cityList");
const themeToggle = document.getElementById("themeToggle");

// مؤقتات عامة
let clockTimer = null;
let countdownTimer = null;

let prayerOrder = ["Fajr", "Imsak", "Sunrise", "Dhuhr", "Asr", "Maghrib", "Isha"];

// الوضع الليلي/النهاري
let isDarkMode = localStorage.getItem('darkMode') !== 'false';

function toggleTheme() {
  isDarkMode = !isDarkMode;
  localStorage.setItem('darkMode', isDarkMode);
  updateTheme();
}

function updateTheme() {
  if (isDarkMode) {
    document.body.classList.remove('light-mode');
    document.body.classList.add('dark-mode');
    themeToggle.innerHTML = '<i class="fa-solid fa-moon"></i>';
  } else {
    document.body.classList.remove('dark-mode');
    document.body.classList.add('light-mode');
    themeToggle.innerHTML = '<i class="fa-solid fa-sun"></i>';
  }
}

// تهيئة الوضع عند تحميل الصفحة
updateTheme();

// إضافة مستمع لزر تبديل الوضع
themeToggle.addEventListener('click', toggleTheme);

// أسماء الصلوات بالعربية
const prayerNames = {
  Imsak: "الإمساك",
  Fajr: "الفجر",
  Sunrise: "الشروق",
  Dhuhr: "الظهر",
  Asr: "العصر",
  Maghrib: "المغرب",
  Isha: "العشاء",
};

// بيانات اليوم والشهر بالعربية
const weekdaysAr = {
  Sunday: "الأحد",
  Monday: "الإثنين",
  Tuesday: "الثلاثاء",
  Wednesday: "الأربعاء",
  Thursday: "الخميس",
  Friday: "الجمعة",
  Saturday: "السبت",
};
const monthsAr = {
  January: "كانون الثاني",
  February: "شباط",
  March: "آذار",
  April: "نيسان",
  May: "أيار",
  June: "حزيران",
  July: "تموز",
  August: "آب",
  September: "أيلول",
  October: "تشرين الأول",
  November: "تشرين الثاني",
  December: "كانون الأول",
};

// دالة تحويل الوقت إلى 12 ساعة
function formatTo12Hour(timeStr) {
  let [hour, minute] = timeStr.split(":").map(Number);
  const suffix = hour >= 12 ? "PM" : "AM";
  hour = hour % 12 || 12;
  return `${hour}:${minute.toString().padStart(2, "0")} ${suffix}`;
}

// عند الضغط على زر اختيار المدينة
document.getElementById("bars").addEventListener("click", () => {
  cityList.classList.toggle("hidden");
  setTimeout(() => {
    cityList.classList.toggle("show");
  }, 10);
});

// عند اختيار مدينة من القائمة
cityList.querySelectorAll("li").forEach((el) => {
  el.addEventListener("click", () => {
    cityList.classList.add("hidden");
    cityList.classList.remove("show");
    document.getElementById("region").textContent = el.textContent;
    document.getElementById("text").textContent = "مواقيت صلاة";
    const [lat, lng] = el.getAttribute("data-value").split(",");
    get_prayer_times(lat, lng);
  });
});

// Get Location coordinates By GPS
document.getElementById("gpsBtn").onclick = () => {
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      const {latitude, longitude} = pos.coords;
      document.getElementById("region").textContent = "موقعك الحالي";
      document.getElementById("text").textContent = "مواقيت صلاة";
      get_prayer_times(latitude, longitude);
    },
    () => alert("لم أتمكن من الحصول على موقعك")
  );
};

// Get Prayer Times
async function get_prayer_times(lat, lng) {
  const response = await axios.get(
    `https://api.aladhan.com/v1/timings?latitude=${lat}&longitude=${lng}&method=3&school=0
`
  );
  // Generator The Main Variables
  const timings = response.data.data.timings;
  const timezone = response.data.data.meta.timezone;
  const {weekday, date, month} = response.data.data.date.gregorian;
  const {date: hijriDate, month: hijriMonth} = response.data.data.date.hijri;

  // عرض المواقيت بصيغة 12 ساعة
  all_times_list.forEach(function (ele, index) {
    ele.textContent = formatTo12Hour(timings[prayerOrder[index]]);
  });

  // تحديث الساعة الحالية
  get_current_time(timezone);
  get_next_prayer(timings, timezone);

  // بدء التحديث المستمر للصلاة القادمة
  startPrayerUpdate(timings, timezone);

  // عرض التاريخ
  document.getElementById("weekDay").textContent = weekdaysAr[weekday.en];
  document.getElementById("monthName").textContent = monthsAr[month.en];
  document.getElementById("dateToday").textContent = date;
  document.getElementById("monthHijri").textContent = hijriMonth.ar;
  document.getElementById("hijri").textContent = hijriDate;
}

// تحميل الموصل كالمدينة الافتراضية عند فتح البرنامج
window.addEventListener('DOMContentLoaded', () => {
  document.getElementById("region").textContent = "الموصل";
  document.getElementById("text").textContent = "مواقيت صلاة";
  get_prayer_times(36.3400, 43.1300);
});

// التعامل مع نافذة اتجاه القبلة
const qiblaBtn = document.getElementById("qiblaBtn");
const qiblaModal = document.getElementById("qiblaModal");
const closeQiblaModal = document.getElementById("closeQiblaModal");
const qiblaDirection = document.getElementById("qiblaDirection");
const qiblaPointer = document.getElementById("qiblaPointer");
const phoneDirection = document.getElementById("phoneDirection");

let deviceOrientationHandler = null;

// فتح نافذة اتجاه القبلة
qiblaBtn.addEventListener("click", () => {
  qiblaModal.classList.remove("hidden");
  getQiblaDirection();
  startDeviceOrientation();
});

// إغلاق نافذة اتجاه القبلة
closeQiblaModal.addEventListener("click", () => {
  qiblaModal.classList.add("hidden");
  stopDeviceOrientation();
});

// إغلاق النافذة عند النقر خارجها
qiblaModal.addEventListener("click", (e) => {
  if (e.target === qiblaModal) {
    qiblaModal.classList.add("hidden");
    stopDeviceOrientation();
  }
});

// بدء تتبع اتجاه الجهاز
function startDeviceOrientation() {
  if (window.DeviceOrientationEvent && typeof DeviceOrientationEvent.requestPermission === 'function') {
    // iOS 13+
    DeviceOrientationEvent.requestPermission()
      .then(response => {
        if (response === 'granted') {
          window.addEventListener('deviceorientation', handleOrientation);
        } else {
          alert('يرجى السماح بالوصول إلى البوصلة لتحديد الاتجاه بدقة');
        }
      })
      .catch(error => {
        console.error(error);
        alert('حدث خطأ في الوصول إلى البوصلة');
      });
  } else if (window.DeviceOrientationEvent) {
    // Android و iOS القديم
    window.addEventListener('deviceorientation', handleOrientation);
  } else {
    alert('جهازك لا يدعم البوصلة');
  }
}

// إيقاف تتبع اتجاه الجهاز
function stopDeviceOrientation() {
  if (deviceOrientationHandler) {
    window.removeEventListener('deviceorientation', deviceOrientationHandler);
    deviceOrientationHandler = null;
  }
}

// معالجة تغير اتجاه الجهاز
function handleOrientation(event) {
  // الحصول على قيم البوصلة
  const alpha = event.alpha; // اتجاه الجهاز بالنسبة للشمال (0-360)
  const beta = event.beta;   // ميل الجهاز للأمام/الخلف (-180 إلى 180)
  const gamma = event.gamma; // ميل الجهاز لليمين/اليسار (-90 إلى 90)

  if (alpha !== null) {
    // تدوير مؤشر اتجاه الهاتف مع حركة سلسة
    phoneDirection.style.transform = `rotate(${alpha}deg)`;
    phoneDirection.style.transition = "transform 0.15s ease-out";

    // تحديث زاوية اتجاه القبلة بالنسبة للهاتف
    const qiblaAngle = parseFloat(qiblaDirection.textContent);
    if (!isNaN(qiblaAngle)) {
      const relativeAngle = (qiblaAngle - alpha + 360) % 360;
      // تدوير مؤشر القبلة ليظهر في الاتجاه الصحيح بالنسبة للهاتف
      qiblaPointer.style.transform = `rotate(${relativeAngle}deg)`;
      qiblaPointer.style.transition = "transform 0.15s ease-out";
    }
  }
}

// الحصول على اتجاه القبلة
async function getQiblaDirection() {
  try {
    // الحصول على موقع المستخدم
    const position = await new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject);
    });

    const { latitude, longitude } = position.coords;

    // حساب اتجاه القبلة
    const qiblaLat = 21.4225; // خط عرض مكة المكرمة
    const qiblaLng = 39.8262; // خط طول مكة المكرمة

    const latRad = (latitude * Math.PI) / 180;
    const lngRad = (longitude * Math.PI) / 180;
    const qiblaLatRad = (qiblaLat * Math.PI) / 180;
    const qiblaLngRad = (qiblaLng * Math.PI) / 180;

    const y = Math.sin(qiblaLngRad - lngRad);
    const x = Math.cos(latRad) * Math.tan(qiblaLatRad) - Math.sin(latRad) * Math.cos(qiblaLngRad - lngRad);

    let qiblaAngle = (Math.atan2(y, x) * 180) / Math.PI;
    qiblaAngle = (qiblaAngle + 360) % 360;

    // عرض اتجاه القبلة
    qiblaDirection.textContent = `${Math.round(qiblaAngle)}°`;

    // تدوير مؤشر اتجاه القبلة
    qiblaPointer.style.transform = `rotate(${qiblaAngle}deg)`;
    qiblaPointer.style.transition = "transform 1s ease-out";

  } catch (error) {
    qiblaDirection.textContent = "خطأ";
    alert("لم أتمكن من الحصول على موقعك. يرجى تفعيل خدمة الموقع.");
  }
}

// Get The Current Time ⏰
function get_current_time(timezone) {
  if (clockTimer) clearInterval(clockTimer);
  function start_clock() {
    const now = new Date();
    const options = {
      timeZone: timezone,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    };
    document.getElementById("clock").textContent = new Intl.DateTimeFormat("en-US", options).format(now);
  }
  start_clock();
  clockTimer = setInterval(start_clock, 1000);
}

// 📌 تحديد الصلاة القادمة (مع استثناء الشروق والإمساك)
function get_next_prayer(timings, timezone) {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat("en-GB", {
    timeZone: timezone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const [curHour, curMin] = formatter.format(now).split(":").map(Number);
  const curTotal = curHour * 60 + curMin;

  let nextPrayer = null;
  for (const name of prayerOrder) {
    if (name === "Imsak" || name === "Sunrise") continue;
    const [hur, min] = timings[name].split(":").map(Number);
    if (hur * 60 + min > curTotal) {
      nextPrayer = {name, time: timings[name]};
      break;
    }
  }

  // إذا لم يكن هناك صلاة قادمة اليوم، نأخذ صلاة الفجر غداً
  if (!nextPrayer) {
    for (const name of prayerOrder) {
      if (name === "Imsak" || name === "Sunrise") continue;
      nextPrayer = {name, time: timings[name]};
      break;
    }
  }

  // تمييز الصلوات
  all_data_value.forEach((el) => {
    const attribute = el.getAttribute("data-value");
    if (attribute === "Imsak" || attribute === "Sunrise") {
      el.style.background = "rgba(0,0,0,0.5)";
    } else if (nextPrayer && attribute === nextPrayer.name) {
      el.classList.add("next");
    } else {
      el.classList.remove("next");
    }
  });

  // عرض اسم ووقت الصلاة القادمة
  if (nextPrayer) {
    document.getElementById("nextext").textContent = `${prayerNames[nextPrayer.name]} (${formatTo12Hour(nextPrayer.time)})`;
    startCountdown(nextPrayer, timezone);
  }
}

// ⏳ العد التنازلي (عرضه بصيغة 12 ساعة)
function startCountdown(nextPrayer, timezone) {
  const [h, m] = nextPrayer.time.split(":").map(Number);

  if (countdownTimer) clearInterval(countdownTimer);

  function updateCountdown() {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat("en-GB", {
      timeZone: timezone,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });

    const [curHour, curMin, curSec] = formatter.format(now).split(":").map(Number);
    const curTotalSeconds = curHour * 3600 + curMin * 60 + curSec;
    const targetTotalSeconds = h * 3600 + m * 60;

    let diff = targetTotalSeconds - curTotalSeconds;

    // إذا كان الوقت قد مر، نحسب الفرق حتى صلاة الفجر غداً
    if (diff <= 0) {
      diff += 24 * 60 * 60; // إضافة 24 ساعة
    }

    const hours = Math.floor(diff / 3600);
    const minutes = Math.floor((diff % 3600) / 60);
    const seconds = diff % 60;

    document.getElementById("timeRemaining").textContent = 
      `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  }

  updateCountdown();
  countdownTimer = setInterval(updateCountdown, 1000);
}

// تحديث الصلاة القادمة كل دقيقة
function startPrayerUpdate(timings, timezone) {
  setInterval(() => {
    get_next_prayer(timings, timezone);
  }, 60000); // تحديث كل دقيقة
}

