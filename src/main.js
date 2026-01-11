// Global Variables
let all_times_list = document.querySelectorAll("#timesSection #time");
const cityList = document.getElementById("cityList");

let prayerOrder = [
  "Fajr",
  "Imsak",
  "Sunrise",
  "Dhuhr",
  "Asr",
  "Maghrib",
  "Isha",
];
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
  const timings = response.data.data.timings;
  const timezone = response.data.data.meta.timezone;
  const {weekday, date, month} = response.data.data.date.gregorian;
  const {date: hijriDate, month: hijriMonth} = response.data.data.date.hijri;
  console.log(hijriDate);
  console.log(hijriMonth.ar);

  // عرض المواقيت بصيغة 12 ساعة
  all_times_list.forEach(function (ele, index) {
    ele.textContent = formatTo12Hour(timings[prayerOrder[index]]);
  });

  // عرض التاريخ
  document.getElementById("weekDay").textContent = weekdaysAr[weekday.en];
  document.getElementById("monthName").textContent = monthsAr[month.en];
  document.getElementById("dateToday").textContent = date;
  document.getElementById("monthHijri").textContent = hijriMonth.ar;
  document.getElementById("hijri").textContent = hijriDate;

  // Get The Current Time
  function get_current_time(timezone) {
    const now = new Date();
    const options = {
      timeZone: timezone,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    };
    const clock = new Intl.DateTimeFormat("en-US", options).format(now);
    document.getElementById("clock").textContent = clock;
  }
  get_current_time(timezone);
  setInterval(get_current_time, 1000);
}
