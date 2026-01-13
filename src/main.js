// Global Variables
let all_times_list = document.querySelectorAll("#timesSection #time");
let all_data_value = document.querySelectorAll("#timesSection li");
const cityList = document.getElementById("cityList");

// مؤقتات عامة
let clockTimer = null;
let countdownTimer = null;

let prayerOrder = ["Fajr", "Imsak", "Sunrise", "Dhuhr", "Asr", "Maghrib", "Isha"];

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
});

// عند اختيار مدينة من القائمة
cityList.querySelectorAll("li").forEach((el) => {
  el.addEventListener("click", () => {
    cityList.classList.add("hidden");
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
    `https://api.aladhan.com/v1/timings?latitude=${lat}&longitude=${lng}&method=1&school=0
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

  // عرض التاريخ
  document.getElementById("weekDay").textContent = weekdaysAr[weekday.en];
  document.getElementById("monthName").textContent = monthsAr[month.en];
  document.getElementById("dateToday").textContent = date;
  document.getElementById("monthHijri").textContent = hijriMonth.ar;
  document.getElementById("hijri").textContent = hijriDate;
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
    // console.log(curTotalSeconds);
    // console.log(targetTotalSeconds);

    let diff = targetTotalSeconds - curTotalSeconds;

    if (diff <= 0) {
      document.getElementById("nextText").textContent = `حان الآن موعد صلاة&nbsp;&nbsp;<i class="fa-solid fa-bell"></i>`;
      document.getElementById("nextext").textContent = prayerNames[nextPrayer.name];
      document.getElementById("addclass").classList.add("next");
      clearInterval(countdownTimer);
      return;
    }

    const hours = Math.floor(diff / 3600);
    const minutes = Math.floor((diff % 3600) / 60);
    const seconds = diff % 60;

    // عرض العد التنازلي بصيغة 12 ساعة
    let displayHour = hours % 12;
    document.getElementById("timeRemaining").textContent = `${displayHour}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")} `;
  }
  updateCountdown();
  countdownTimer = setInterval(updateCountdown, 1000);
}
