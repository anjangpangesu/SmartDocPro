function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function formatDate(dateString) {
  if (!dateString) return new Date().toLocaleString("id-ID");
  const d = new Date(dateString);
  const dateOptions = { day: "numeric", month: "long", year: "numeric" };
  const timeOptions = { hour: "2-digit", minute: "2-digit", second: "2-digit" };
  return (
    d.toLocaleDateString("id-ID", dateOptions) +
    " " +
    d.toLocaleTimeString("id-ID", timeOptions)
  );
}

function formatMonthYear(val) {
  if (!val) return "";
  const [year, month] = val.split("-");
  const months = [
    "Januari",
    "Februari",
    "Maret",
    "April",
    "Mei",
    "Juni",
    "Juli",
    "Agustus",
    "September",
    "Oktober",
    "November",
    "Desember",
  ];
  return `${months[parseInt(month, 10) - 1]} ${year}`;
}

function formatPeriod(start, end) {
  const s = formatMonthYear(start);
  const e = formatMonthYear(end);
  if (s && e) return `${s} - ${e}`;
  if (s && !e) return `${s} - Sekarang`;
  if (!s && e) return `Hingga ${e}`;
  return "";
}

function parseBullets(text) {
  if (!text) return "";
  const lines = text.split("\n").filter((line) => line.trim() !== "");
  if (lines.length === 0) return "";
  return `<ul>${lines.map((line) => `<li>${line.replace(/^-/g, "").trim()}</li>`).join("")}</ul>`;
}

function generateParagraphs(rawText) {
  if (!rawText) return "";
  return rawText
    .split("\n")
    .filter((line) => line.trim() !== "")
    .map(
      (line) =>
        `<p style="margin-bottom: 12px; text-align: justify;">${line}</p>`,
    )
    .join("");
}

function sortDataByDateDesc(data) {
  if (!data) return [];
  return data.sort((a, b) => {
    let dateA =
      a.ongoing || !a.end
        ? new Date("2099-12-31").getTime()
        : new Date(a.end + "-01").getTime();
    let dateB =
      b.ongoing || !b.end
        ? new Date("2099-12-31").getTime()
        : new Date(b.end + "-01").getTime();

    if (dateB === dateA) {
      let startA = a.start ? new Date(a.start + "-01").getTime() : 0;
      let startB = b.start ? new Date(b.start + "-01").getTime() : 0;
      return startB - startA;
    }
    return dateB - dateA;
  });
}

function validateEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(String(email).toLowerCase());
}

function validatePhone(phone) {
  const re = /^[0-9+\-\s()]{8,20}$/;
  return re.test(String(phone));
}

function validateDates(start, end) {
  if (!start || !end) return true;
  return new Date(start) <= new Date(end);
}

function formatDateObj(val) {
  if (!val) return "(Belum diisi)";
  const parts = val.split("-");
  if (parts.length !== 3) return val;
  const year = parts[0];
  const month = parts[1];
  const day = parts[2];
  const months = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni", 
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
  ];
  return `${parseInt(day, 10)} ${months[parseInt(month, 10) - 1]} ${year}`;
}

function formatDateWithDay(val) {
  if (!val) return "(Belum diisi)";
  const parts = val.split("-");
  if (parts.length !== 3) return val;
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);
  const dateObj = new Date(year, month, day);
  const days = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
  const dayName = days[dateObj.getDay()];
  return `${dayName}, ${formatDateObj(val)}`;
}
