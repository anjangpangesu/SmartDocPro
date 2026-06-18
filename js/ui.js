/* Komentar Profesional:
   ui.js menangani integrasi antarmuka dan manipulasi DOM. 
   Pembaruan: Penambahan fungsi pengunduhan sekunder (Format DOCX) pada setiap tabel 
   riwayat (History View) agar pengguna memiliki fleksibilitas dalam memilih format file.
*/

const views = [
  "dashboard",
  "add-cv",
  "history-cv",
  "add-letter",
  "history-letter",
  "add-leave",
  "add-resign",
  "add-sick",
  "add-invitation",
  "add-notification",
  "history-other",
];

let currentProfilePic = "";
let currentQrCode = "";

/* Algoritma Pelacak Status Editor Teks (RTF State Tracker) */
function updateRTFToolbarState() {
  const activeContainer = document.activeElement?.closest(".rtf-container");

  // Matikan indikator aktif pada seluruh tombol secara bawaan
  document
    .querySelectorAll(".rtf-toolbar button[data-command]")
    .forEach((btn) => {
      btn.classList.remove("rtf-active");
    });

  // Validasi format teks aktif jika kursor atau seleksi berada di dalam container RTF
  if (activeContainer) {
    const buttons = activeContainer.querySelectorAll(
      ".rtf-toolbar button[data-command]",
    );
    buttons.forEach((btn) => {
      const command = btn.getAttribute("data-command");
      try {
        if (document.queryCommandState(command)) {
          btn.classList.add("rtf-active");
        }
      } catch (e) {}
    });
  }
}

// 1. Jalankan saat kursor berpindah atau blok teks diseleksi (Event Bawaan)
document.addEventListener("selectionchange", updateRTFToolbarState);

// 2. Mencegah hilangnya fokus dari area editor saat tombol RTF diklik (Kunci Perbaikan)
document.addEventListener("mousedown", (e) => {
  const rtfBtn = e.target.closest(".rtf-toolbar button[data-command]");
  if (rtfBtn) {
    e.preventDefault();
  }
});

// 3. Eksekusi pembaruan status UI secara instan setelah tombol ditekan
document.addEventListener("click", (e) => {
  const rtfBtn = e.target.closest(".rtf-toolbar button[data-command]");
  if (rtfBtn) {
    setTimeout(updateRTFToolbarState, 10);
  }
});

// --- SISTEM AUTO-SAVE DEBOUNCER ---
let autoSaveTimerCV = null;
function triggerAutoSaveCV() {
  clearTimeout(autoSaveTimerCV);
  const indicator = document.getElementById("cv-autosave-indicator");
  if (indicator) indicator.innerText = "Menyimpan...";
  autoSaveTimerCV = setTimeout(() => {
    if (typeof saveCV === "function") {
      saveCV(true);
    }
  }, 1500);
}

let autoSaveTimerLetter = null;
function triggerAutoSaveLetter() {
  clearTimeout(autoSaveTimerLetter);
  const indicator = document.getElementById("cl-autosave-indicator");
  if (indicator) indicator.innerText = "Menyimpan...";
  autoSaveTimerLetter = setTimeout(() => {
    if (typeof saveLetter === "function") {
      saveLetter(true);
    }
  }, 1500);
}

let autoSaveTimerOther = null;
function triggerAutoSaveOther(type) {
  clearTimeout(autoSaveTimerOther);
  const indicators = {
    "leave": "lv-autosave-indicator",
    "resign": "rs-autosave-indicator",
    "sick": "sk-autosave-indicator",
    "invitation": "inv-autosave-indicator",
    "notification": "notif-autosave-indicator"
  };
  const indicatorId = indicators[type];
  const indicator = document.getElementById(indicatorId);
  if (indicator) indicator.innerText = "Menyimpan...";
  autoSaveTimerOther = setTimeout(() => {
    if (typeof saveOtherLetter === "function") {
      saveOtherLetter(type, true);
    }
  }, 1500);
}

function showToast(message, type = "success") {
  const container = document.getElementById("toast-container");
  if (!container) return;

  const toast = document.createElement("div");
  const bgColor =
    type === "success"
      ? "bg-green-500"
      : type === "error"
        ? "bg-red-500"
        : "bg-orange-500";
  const icon =
    type === "success"
      ? "fa-check-circle"
      : type === "error"
        ? "fa-circle-xmark"
        : "fa-triangle-exclamation";

  toast.className = `flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg text-white ${bgColor} toast-enter min-w-[250px]`;
  toast.innerHTML = `<i class="fa-solid ${icon} text-lg"></i><span class="text-sm font-medium">${message}</span>`;

  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.remove("toast-enter");
    toast.classList.add("toast-leave");
    toast.addEventListener("animationend", () => toast.remove());
  }, 3000);
}

function handleImageUploadBase64(event, callback, maxSize = 300) {
  const file = event.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = function (e) {
      const img = new Image();
      img.onload = function () {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;

        if (width > height && width > maxSize) {
          height *= maxSize / width;
          width = maxSize;
        } else if (height > maxSize) {
          width *= maxSize / height;
          height = maxSize;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);

        const dataUrl = canvas.toDataURL("image/png");
        callback(dataUrl);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  } else {
    callback("");
  }
}

function handleImageUpload(event, type) {
  const file = event.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = function (e) {
      const img = new Image();
      img.onload = function () {
        const canvas = document.createElement("canvas");
        const MAX_SIZE = 500;
        let width = img.width;
        let height = img.height;

        if (width > height && width > MAX_SIZE) {
          height *= MAX_SIZE / width;
          width = MAX_SIZE;
        } else if (height > MAX_SIZE) {
          width *= MAX_SIZE / height;
          height = MAX_SIZE;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);

        const dataUrl = canvas.toDataURL("image/png");

        if (type === "profile") currentProfilePic = dataUrl;
        if (type === "qr") currentQrCode = dataUrl;
        updateCVPreview();
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  } else {
    if (type === "profile") currentProfilePic = "";
    if (type === "qr") currentQrCode = "";
    updateCVPreview();
  }
}

function toggleSidebar() {
  const sidebar = document.getElementById("sidebar");
  const overlay = document.getElementById("sidebar-overlay");
  if (sidebar.classList.contains("-translate-x-full")) {
    sidebar.classList.remove("-translate-x-full");
    overlay.classList.remove("hidden");
  } else {
    sidebar.classList.add("-translate-x-full");
    overlay.classList.add("hidden");
  }
}

function switchView(viewId) {
  views.forEach((v) => {
    document.getElementById(`view-${v}`).classList.add("hidden-view");
    document.getElementById(`menu-${v}`)?.classList.remove("bg-secondary");
  });
  document.getElementById(`view-${viewId}`).classList.remove("hidden-view");
  document.getElementById(`menu-${viewId}`)?.classList.add("bg-secondary");

  const titles = {
    dashboard: "Dashboard",
    "add-cv": "Formulir Generator CV ATS",
    "history-cv": "Riwayat CV",
    "add-letter": "Formulir Generator Surat Lamaran",
    "history-letter": "Riwayat Surat Lamaran",
    "add-leave": "Formulir Generator Surat Cuti",
    "add-resign": "Formulir Generator Surat Resign",
    "add-sick": "Formulir Generator Surat Izin/Sakit",
    "add-invitation": "Formulir Generator Surat Undangan",
    "add-notification": "Formulir Generator Surat Pemberitahuan",
    "history-other": "Riwayat Surat Administrasi",
  };
  document.getElementById("page-title").innerText = titles[viewId];

  if (window.innerWidth < 1024) {
    const sidebar = document.getElementById("sidebar");
    const overlay = document.getElementById("sidebar-overlay");
    if (!sidebar.classList.contains("-translate-x-full")) {
      sidebar.classList.add("-translate-x-full");
      overlay.classList.add("hidden");
    }
  }
}

function updateDashboardStats() {
  document.getElementById("stat-cv").innerText = cvData.length;
  document.getElementById("stat-letter").innerText = letterData.length;
  if (document.getElementById("stat-other")) {
    document.getElementById("stat-other").innerText = otherLetterData.length;
  }
}

function toggleEndDate(checkbox) {
  const parent = checkbox.closest("div").parentElement;
  const endInput = parent.querySelectorAll('input[type="month"]')[0];
  if (endInput) {
    if (checkbox.checked) {
      endInput.value = "";
      endInput.disabled = true;
      endInput.classList.add("bg-gray-100");
    } else {
      endInput.disabled = false;
      endInput.classList.remove("bg-gray-100");
    }
  }
  updateCVPreview();
}

function createFieldHTML(type, id) {
  let prefix = type === "education" ? `dyn-edu-` : `dyn-${type}-`;
  let nameFieldHTML = "";

  if (type === "education") {
    nameFieldHTML = `
            <div class="col-span-1 md:col-span-4"><input type="text" class="w-full border rounded p-2 text-sm ${prefix}name" placeholder="Nama Sekolah / Universitas *" oninput="updateCVPreview()"></div>
            <div class="col-span-1 md:col-span-2"><input type="text" class="w-full border rounded p-2 text-sm ${prefix}major" placeholder="Jurusan / Fakultas *" oninput="updateCVPreview()"></div>
            <div class="col-span-1 md:col-span-1">
                <select class="w-full border rounded p-2 text-sm ${prefix}scale" onchange="updateCVPreview()">
                    <option value="" disabled selected>Pilih Skala...</option>
                    <option value="ipk4">Univ - IPK (4.00)</option>
                    <option value="ipk5">Univ - IPK (5.00)</option>
                    <option value="nilai100">Sekolah - Nilai (100)</option>
                </select>
            </div>
            <div class="col-span-1 md:col-span-1"><input type="number" step="0.01" class="w-full border rounded p-2 text-sm ${prefix}score" placeholder="Skor / Nilai" oninput="updateCVPreview()"></div>
        `;
  } else if (type === "experience" || type === "project" || type === "org") {
    let p1 =
      type === "experience"
        ? "Nama Perusahaan"
        : type === "project"
          ? "Nama Proyek"
          : "Nama Organisasi";
    nameFieldHTML = `
            <div class="col-span-1 md:col-span-4"><input type="text" class="w-full border rounded p-2 text-sm ${prefix}name" placeholder="${p1} *" oninput="updateCVPreview()"></div>
            <div class="col-span-1 md:col-span-4"><input type="text" class="w-full border rounded p-2 text-sm ${prefix}pos" placeholder="Posisi / Jabatan *" oninput="updateCVPreview()"></div>
        `;
  } else if (type === "cert") {
    nameFieldHTML = `
            <div class="col-span-1 md:col-span-4"><input type="text" class="w-full border rounded p-2 text-sm ${prefix}name" placeholder="Nama Sertifikasi / Penghargaan *" oninput="updateCVPreview()"></div>
            <div class="col-span-1 md:col-span-4"><input type="text" class="w-full border rounded p-2 text-sm ${prefix}issuer" placeholder="Penerbit / Pelaksana *" oninput="updateCVPreview()"></div>
        `;
  }

  let innerHTML = `
        <div class="grid grid-cols-1 md:grid-cols-4 gap-3 mb-2">
            ${nameFieldHTML}
            <div class="col-span-1 md:col-span-2"><input type="text" class="w-full border rounded p-2 text-sm ${prefix}city" placeholder="Kota/Kabupaten" oninput="updateCVPreview()"></div>
            <div class="col-span-1 md:col-span-2"><input type="text" class="w-full border rounded p-2 text-sm ${prefix}country" placeholder="Negara" oninput="updateCVPreview()"></div>
            <div class="col-span-1 md:col-span-2"><label class="block text-xs text-gray-500 mb-1">Mulai</label><input type="month" class="w-full border rounded p-2 text-sm ${prefix}start" oninput="updateCVPreview()"></div>
            
            <div class="col-span-1 md:col-span-2">
                <div class="flex justify-between items-center mb-1">
                    <label class="block text-xs text-gray-500">Selesai</label>
                    <label class="flex items-center text-xs text-gray-500 cursor-pointer">
                        <input type="checkbox" class="mr-1 ${prefix}ongoing" onchange="toggleEndDate(this)"> Sekarang
                    </label>
                </div>
                <input type="month" class="w-full border rounded p-2 text-sm ${prefix}end" oninput="updateCVPreview()">
            </div>
            
            <div class="col-span-1 md:col-span-4">
                <div class="rtf-container">
                    <div class="rtf-toolbar">
                        <button type="button" data-command="bold" onclick="document.execCommand('bold', false, null); updateCVPreview();" title="Tebal"><i class="fa-solid fa-bold"></i></button>
                        <button type="button" data-command="italic" onclick="document.execCommand('italic', false, null); updateCVPreview();" title="Miring"><i class="fa-solid fa-italic"></i></button>
                        <button type="button" data-command="underline" onclick="document.execCommand('underline', false, null); updateCVPreview();" title="Garis Bawah"><i class="fa-solid fa-underline"></i></button>
                        <button type="button" data-command="insertUnorderedList" onclick="document.execCommand('insertUnorderedList', false, null); updateCVPreview();" title="Daftar Bullet"><i class="fa-solid fa-list-ul"></i></button>
                    </div>
                    <div class="rtf-editor ${prefix}desc min-h-[5rem]" contenteditable="true" data-placeholder="Deskripsi Tugas/Aktivitas..." oninput="updateCVPreview()"></div>
                </div>
            </div>
        </div>`;

  return `
            <div class="p-4 border border-gray-200 rounded-lg bg-white relative group" id="${id}">
                <button onclick="removeDynamicField('${id}')" class="absolute top-2 right-2 text-red-500 hover:text-red-700 opacity-0 group-hover:opacity-100 transition" title="Hapus"><i class="fa-solid fa-trash"></i></button>
                ${innerHTML}
            </div>`;
}

function addDynamicField(type) {
  const container = document.getElementById(`container-${type}`);
  const id = `field-${type}-${Date.now()}`;
  container.insertAdjacentHTML("beforeend", createFieldHTML(type, id));
}

function addSkillField(type, existingItem = null) {
  const container = document.getElementById(`container-${type}`);
  const id = `field-${type}-${Date.now()}${Math.random().toString(36).substr(2, 5)}`;
  let p1 = type === "skill" ? "Keterampilan..." : "Bahasa...";
  let nameVal = existingItem ? existingItem.name : "";
  let lvlVal = existingItem ? existingItem.level : "";

  let optionsHTML = "";
  if (type === "skill") {
    optionsHTML = `
            <option value="" ${!lvlVal ? "selected" : ""} disabled>Pilih Level...</option>
            <option value="Ahli (Expert)" ${lvlVal === "Ahli (Expert)" ? "selected" : ""}>Ahli (Expert)</option>
            <option value="Mahir (Advanced)" ${lvlVal === "Mahir (Advanced)" ? "selected" : ""}>Mahir (Advanced)</option>
            <option value="Menengah (Intermediate)" ${lvlVal === "Menengah (Intermediate)" ? "selected" : ""}>Menengah (Intermediate)</option>
            <option value="Dasar (Beginner)" ${lvlVal === "Dasar (Beginner)" ? "selected" : ""}>Dasar (Beginner)</option>
        `;
  } else {
    optionsHTML = `
            <option value="" ${!lvlVal ? "selected" : ""} disabled>Pilih Level...</option>
            <option value="Penutur Asli (Native)" ${lvlVal === "Penutur Asli (Native)" ? "selected" : ""}>Penutur Asli (Native)</option>
            <option value="Fasih (Fluent)" ${lvlVal === "Fasih (Fluent)" ? "selected" : ""}>Fasih (Fluent)</option>
            <option value="Profesional (Professional Working)" ${lvlVal === "Profesional (Professional Working)" ? "selected" : ""}>Profesional (Professional Working)</option>
            <option value="Terbatas (Limited Working)" ${lvlVal === "Terbatas (Limited Working)" ? "selected" : ""}>Terbatas (Limited Working)</option>
            <option value="Dasar (Elementary)" ${lvlVal === "Dasar (Elementary)" ? "selected" : ""}>Dasar (Elementary)</option>
        `;
  }

  const html = `
        <div class="p-2 border border-gray-200 rounded bg-white relative group flex gap-2 items-center" id="${id}">
            <input type="text" class="w-1/2 border rounded p-1.5 text-sm dyn-${type}-name" placeholder="${p1}" oninput="updateCVPreview()" value="${nameVal}">
            <select class="w-1/2 border rounded p-1.5 text-sm dyn-${type}-level" onchange="updateCVPreview()">
                ${optionsHTML}
            </select>
            <button onclick="removeDynamicField('${id}')" class="text-red-500 hover:text-red-700 px-1" title="Hapus"><i class="fa-solid fa-trash"></i></button>
        </div>
    `;
  container.insertAdjacentHTML("beforeend", html);
}

function removeDynamicField(id) {
  document.getElementById(id).remove();
  updateCVPreview();
}

function getDynamicData(type) {
  const container = document.getElementById(`container-${type}`);
  const items = [];
  let prefix = `dyn-${type}-`;
  if (type === "education") prefix = `dyn-edu-`;

  container.querySelectorAll(".p-4").forEach((block) => {
    let obj = {};
    block
      .querySelectorAll("input, textarea, select, .rtf-editor")
      .forEach((input) => {
        const cls = Array.from(input.classList).find((c) =>
          c.startsWith(prefix),
        );
        if (cls) {
          const key = cls.replace(prefix, "");
          if (input.type === "checkbox") {
            obj[key] = input.checked;
          } else if (input.classList.contains("rtf-editor")) {
            obj[key] = input.innerHTML === "<br>" ? "" : input.innerHTML;
          } else {
            obj[key] = input.value.trim();
          }
        }
      });
    if (obj.name) items.push(obj);
  });
  return items;
}

function getSkillData(type) {
  const container = document.getElementById(`container-${type}`);
  const items = [];
  container.querySelectorAll(".group").forEach((block) => {
    const name = block.querySelector(`.dyn-${type}-name`).value.trim();
    const level = block.querySelector(`.dyn-${type}-level`).value.trim();
    if (name) items.push({ name, level });
  });
  return items;
}

function renderCategorizedList(title, data, type) {
  if (!data || data.length === 0) return "";
  const grouped = {};
  data.forEach((item) => {
    const lvl = item.level || "Tanpa Keterangan";
    if (!grouped[lvl]) grouped[lvl] = [];
    grouped[lvl].push(item.name);
  });

  const skillOrder = [
    "Ahli (Expert)",
    "Mahir (Advanced)",
    "Menengah (Intermediate)",
    "Dasar (Beginner)",
    "Tanpa Keterangan",
  ];
  const langOrder = [
    "Penutur Asli (Native)",
    "Fasih (Fluent)",
    "Profesional (Professional Working)",
    "Terbatas (Limited Working)",
    "Dasar (Elementary)",
    "Tanpa Keterangan",
  ];
  const order = type === "skill" ? skillOrder : langOrder;

  const sortedKeys = Object.keys(grouped).sort((a, b) => {
    let idxA = order.indexOf(a);
    let idxB = order.indexOf(b);
    if (idxA === -1) idxA = 99;
    if (idxB === -1) idxB = 99;
    return idxA - idxB;
  });

  let html = `<div class="ats-section-title">${title}</div>`;
  html += `<div class="ats-desc"><ul style="list-style-type: none; padding-left: 0; margin-top: 2px;">`;

  sortedKeys.forEach((level) => {
    const skillsString = grouped[level].join(", ");
    if (level === "Tanpa Keterangan") {
      html += `<li style="margin-bottom: 4px; line-height: 1.4;">${skillsString}</li>`;
    } else {
      html += `<li style="margin-bottom: 4px; line-height: 1.4;"><b>${level}:</b> ${skillsString}</li>`;
    }
  });
  html += `</ul></div>`;
  return html;
}

function formatDescription(desc) {
  if (!desc) return "";
  if (/<[a-z][\s\S]*>/i.test(desc)) {
    return `<div class="rtf-output">${desc}</div>`;
  }
  return parseBullets(desc);
}

function updateCVPreview() {
  const preview = document.getElementById("preview-cv-a4");
  const name = document.getElementById("cv-name").value || "NAMA LENGKAP";
  const phone = document.getElementById("cv-phone").value || "08XXXXXXXXXX";
  const email = document.getElementById("cv-email").value || "email@domain.com";
  const address =
    document.getElementById("cv-address").value || "Kecamatan, Kota";
  const linkedin = document.getElementById("cv-linkedin").value;
  const portfolio = document.getElementById("cv-portfolio").value;

  let topContactLine = [];
  if (phone) topContactLine.push(phone);
  if (email) topContactLine.push(email);
  if (linkedin) topContactLine.push(linkedin);
  if (portfolio) topContactLine.push(portfolio);

  let contactString = topContactLine.join(" | ");
  if (address) {
    if (contactString) contactString += "<br>";
    contactString += address;
  }

  let summaryHtml = document.getElementById("cv-summary").innerHTML.trim();
  if (summaryHtml === "<br>") summaryHtml = "";

  let html = `<div style="display: flex; align-items: center; margin-bottom: 15px; gap: 20px;">`;

  if (currentProfilePic) {
    html += `<img src="${currentProfilePic}" style="width: 2.86cm; height: 3.81cm; object-fit: cover;">`;
  }

  let contactAlign = currentProfilePic || currentQrCode ? "left" : "center";
  let nameAlign = currentProfilePic || currentQrCode ? "left" : "center";
  let nameFontSize = "18pt";
  let contactFontSize = "9pt";

  html += `<div style="flex: 1; text-align: left;">
        <div class="ats-name" style="text-align: ${nameAlign}; margin-bottom: 0; font-size: ${nameFontSize};">${name}</div>
        <div class="ats-contact" style="text-align: ${contactAlign}; padding-bottom: 0; border: none; font-size: ${contactFontSize};">${contactString}</div>
     </div>`;

  if (currentQrCode) {
    html += `<img src="${currentQrCode}" style="width: 80px; height: 80px; object-fit: contain;">`;
  }
  html += `</div>`;

  if (summaryHtml) {
    let finalSummary = formatDescription(summaryHtml);
    html += `<div class="ats-section-title">Ringkasan Profil</div><div class="ats-desc">${finalSummary}</div>`;
  }

  const renderSection = (title, data) => {
    if (data.length === 0) return "";
    let secHtml = `<div class="ats-section-title">${title}</div>`;
    data.forEach((item) => {
      let loc = [item.city, item.country].filter(Boolean).join(", ");
      let period = formatPeriod(item.start, item.end);
      if (item.ongoing || !item.end) {
        const s = formatMonthYear(item.start);
        period = s ? `${s} - Sekarang` : "Sekarang";
      }
      secHtml += `
                <div class="ats-item-header"><span>${item.name}</span><span style="font-weight: bold;">${loc}</span></div>
                <div class="ats-item-sub"><span>${item.pos || ""}</span><span style="font-weight: bold;">${period}</span></div>
                <div class="ats-desc">${formatDescription(item.desc)}</div>
            `;
    });
    return secHtml;
  };

  const sortableSections = document.querySelectorAll('.sortable-section');
  sortableSections.forEach(section => {
    const id = section.getAttribute('data-id');
    if (id === 'education') {
      let eduData = sortDataByDateDesc(getDynamicData("education"));
      if (eduData.length > 0) {
        html += `<div class="ats-section-title">Riwayat Pendidikan</div>`;
        eduData.forEach((edu) => {
          let subInfo = [];
          if (edu.major) subInfo.push(edu.major);
          if (edu.score || edu.gpa) {
            let scoreVal = edu.score || edu.gpa;
            if (edu.scale === "ipk4") subInfo.push(`IPK: ${scoreVal} / 4.00`);
            else if (edu.scale === "ipk5") subInfo.push(`IPK: ${scoreVal} / 5.00`);
            else if (edu.scale === "nilai100")
              subInfo.push(`Nilai: ${scoreVal} / 100`);
            else subInfo.push(`Nilai/IPK: ${scoreVal}`);
          }

          let loc = [edu.city, edu.country].filter(Boolean).join(", ");
          let subStr = subInfo.join(" | ");
          let period = formatPeriod(edu.start, edu.end);
          if (edu.ongoing || !edu.end) {
            const s = formatMonthYear(edu.start);
            period = s ? `${s} - Sekarang` : "Sekarang";
          }
          html += `
                <div class="ats-item-header"><span>${edu.name}</span><span style="font-weight: bold;">${loc}</span></div>
                <div class="ats-item-sub"><span>${subStr}</span><span style="font-weight: bold;">${period}</span></div>
                <div class="ats-desc">${formatDescription(edu.desc)}</div>
            `;
        });
      }
    } else if (id === 'experience') {
      html += renderSection("Pengalaman Kerja", sortDataByDateDesc(getDynamicData("experience")));
    } else if (id === 'project') {
      html += renderSection("Pengalaman Proyek", sortDataByDateDesc(getDynamicData("project")));
    } else if (id === 'org') {
      html += renderSection("Pengalaman Organisasi", sortDataByDateDesc(getDynamicData("org")));
    } else if (id === 'cert') {
      let certData = sortDataByDateDesc(getDynamicData("cert"));
      if (certData.length > 0) {
        html += `<div class="ats-section-title">Sertifikasi & Penghargaan</div>`;
        certData.forEach((cert) => {
          let loc = [cert.city, cert.country].filter(Boolean).join(", ");
          let period = formatPeriod(cert.start, cert.end);
          if (cert.ongoing || !cert.end) {
            const s = formatMonthYear(cert.start);
            period = s ? `${s} - Sekarang` : "Sekarang";
          }
          html += `
                <div class="ats-item-header"><span>${cert.name}</span><span style="font-weight: bold;">${loc}</span></div>
                <div class="ats-item-sub"><span>${cert.issuer || ""}</span><span style="font-weight: bold;">${period}</span></div>
                <div class="ats-desc">${formatDescription(cert.desc)}</div>
            `;
        });
      }
    } else if (id === 'skill') {
      html += renderCategorizedList("Skill / Keterampilan", getSkillData("skill"), "skill");
    } else if (id === 'language') {
      html += renderCategorizedList("Bahasa", getSkillData("language"), "language");
    }
  });

  preview.innerHTML = html;
  triggerAutoSaveCV();
}

window.moveSectionUp = function(btn) {
  const section = btn.closest('.sortable-section');
  if (section && section.previousElementSibling && section.previousElementSibling.classList.contains('sortable-section')) {
    section.parentNode.insertBefore(section, section.previousElementSibling);
    updateCVPreview();
  }
};

window.moveSectionDown = function(btn) {
  const section = btn.closest('.sortable-section');
  if (section && section.nextElementSibling && section.nextElementSibling.classList.contains('sortable-section')) {
    section.parentNode.insertBefore(section.nextElementSibling, section);
    updateCVPreview();
  }
};

function buildSavedCVHTML(form) {
  const name = form.header.name || "NAMA LENGKAP";
  const phone = form.header.phone || "08XXXXXXXXXX";
  const email = form.header.email || "email@domain.com";
  const address = form.header.address || "Kecamatan, Kota";
  const linkedin = form.header.linkedin;
  const portfolio = form.header.portfolio;

  let topContactLine = [];
  if (phone) topContactLine.push(phone);
  if (email) topContactLine.push(email);
  if (linkedin) topContactLine.push(linkedin);
  if (portfolio) topContactLine.push(portfolio);

  let contactString = topContactLine.join(" | ");
  if (address) {
    if (contactString) contactString += "<br>";
    contactString += address;
  }

  let html = `<div style="display: flex; align-items: center; margin-bottom: 15px; gap: 20px;">`;

  if (form.header.photo)
    html += `<img src="${form.header.photo}" style="width: 2.86cm; height: 3.81cm; object-fit: cover;">`;

  let contactAlign =
    form.header.photo || form.header.qrcode ? "left" : "center";
  let nameAlign = form.header.photo || form.header.qrcode ? "left" : "center";
  let nameFontSize = "18pt";
  let contactFontSize = "9pt";

  html += `<div style="flex: 1; text-align: left;">
        <div class="ats-name" style="text-align: ${nameAlign}; margin-bottom: 0; font-size: ${nameFontSize};">${name}</div>
        <div class="ats-contact" style="text-align: ${contactAlign}; padding-bottom: 0; border: none; font-size: ${contactFontSize};">${contactString}</div>
     </div>`;

  if (form.header.qrcode)
    html += `<img src="${form.header.qrcode}" style="width: 80px; height: 80px; object-fit: contain;">`;
  html += `</div>`;

  if (form.header.summary) {
    html += `<div class="ats-section-title">Ringkasan Profil</div><div class="ats-desc">${formatDescription(form.header.summary)}</div>`;
  }

  let formEduData = sortDataByDateDesc(form.education || []);
  if (formEduData.length > 0) {
    html += `<div class="ats-section-title">Pendidikan</div>`;
    formEduData.forEach((edu) => {
      let subInfo = [];
      if (edu.major) subInfo.push(edu.major);
      if (edu.score || edu.gpa) {
        let scoreVal = edu.score || edu.gpa;
        if (edu.scale === "ipk4") subInfo.push(`IPK: ${scoreVal} / 4.00`);
        else if (edu.scale === "ipk5") subInfo.push(`IPK: ${scoreVal} / 5.00`);
        else if (edu.scale === "nilai100")
          subInfo.push(`Nilai: ${scoreVal} / 100`);
        else subInfo.push(`Nilai/IPK: ${scoreVal}`);
      }

      let loc = [edu.city, edu.country].filter(Boolean).join(", ");
      let subStr = subInfo.join(" | ");
      let period = formatPeriod(edu.start, edu.end);
      if (edu.ongoing || !edu.end) {
        const s = formatMonthYear(edu.start);
        period = s ? `${s} - Sekarang` : "Sekarang";
      }
      html += `
                <div class="ats-item-header"><span>${edu.name}</span><span style="font-weight: bold;">${loc}</span></div>
                <div class="ats-item-sub"><span>${subStr}</span><span style="font-weight: bold;">${period}</span></div>
                <div class="ats-desc">${formatDescription(edu.desc)}</div>
            `;
    });
  }

  const renderSection = (title, data) => {
    let sortedData = sortDataByDateDesc(data || []);
    if (!sortedData || sortedData.length === 0) return "";
    let secHtml = `<div class="ats-section-title">${title}</div>`;
    sortedData.forEach((item) => {
      let loc = [item.city, item.country].filter(Boolean).join(", ");
      let period = formatPeriod(item.start, item.end);
      if (item.ongoing || !item.end) {
        const s = formatMonthYear(item.start);
        period = s ? `${s} - Sekarang` : "Sekarang";
      }
      secHtml += `
                <div class="ats-item-header"><span>${item.name}</span><span style="font-weight: bold;">${loc}</span></div>
                <div class="ats-item-sub"><span>${item.pos || ""}</span><span style="font-weight: bold;">${period}</span></div>
                <div class="ats-desc">${formatDescription(item.desc)}</div>
            `;
    });
    return secHtml;
  };

  html += renderSection("Pengalaman Kerja", form.experience);
  html += renderSection("Pengalaman Proyek", form.project);
  html += renderSection("Pengalaman Organisasi", form.org);

  let formCertData = sortDataByDateDesc(form.cert || []);
  if (formCertData.length > 0) {
    html += `<div class="ats-section-title">Sertifikasi & Penghargaan</div>`;
    formCertData.forEach((cert) => {
      let loc = [cert.city, cert.country].filter(Boolean).join(", ");
      let period = formatPeriod(cert.start, cert.end);
      if (cert.ongoing || !cert.end) {
        const s = formatMonthYear(cert.start);
        period = s ? `${s} - Sekarang` : "Sekarang";
      }
      html += `
                <div class="ats-item-header"><span>${cert.name}</span><span style="font-weight: bold;">${loc}</span></div>
                <div class="ats-item-sub"><span>${cert.issuer || ""}</span><span style="font-weight: bold;">${period}</span></div>
                <div class="ats-desc">${formatDescription(cert.desc)}</div>
            `;
    });
  }

  html += renderCategorizedList(
    "Skill / Keterampilan",
    form.skillList || [],
    "skill",
  );
  html += renderCategorizedList("Bahasa", form.languageList || [], "language");

  return html;
}

function updateLetterPreview() {
  const preview = document.getElementById("preview-letter-a4");
  const cityStr = document.getElementById("cl-city").value || "[Kota]";
  const dateInputVal = document.getElementById("cl-date-input").value;
  let dateStr = "[Tanggal]";
  if (dateInputVal) {
    const d = new Date(dateInputVal);
    dateStr = d.toLocaleDateString("id-ID", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }
  const headerDate = `${cityStr}, ${dateStr}`;

  const subject = document.getElementById("cl-subject").value || "[Perihal]";
  const attachment =
    document.getElementById("cl-attachment").value || "[Jumlah Lampiran]";
  const to = document.getElementById("cl-to").value || "[Nama Tujuan / HRD]";
  const companyStreet =
    document.getElementById("cl-company-street").value ||
    "[Alamat Jl dan Nomor]";
  const companyCity =
    document.getElementById("cl-company-city").value || "[Kota/Kab]";
  const companyZip =
    document.getElementById("cl-company-zip").value || "[Kode Pos]";

  const name = document.getElementById("cl-name").value || "[Nama Lengkap]";
  const phone = document.getElementById("cl-phone").value || "[No HP]";
  const email = document.getElementById("cl-email").value || "[Email]";
  const address =
    document.getElementById("cl-address").value || "[Alamat Lengkap]";
  const univ = document.getElementById("cl-univ").value || "[Nama Universitas]";
  const major = document.getElementById("cl-major").value || "[Program Studi]";

  let p1Html = document.getElementById("cl-p1").innerHTML.trim();
  if (p1Html === "<br>") p1Html = "";
  let p3Html = document.getElementById("cl-p3").innerHTML.trim();
  if (p3Html === "<br>") p3Html = "";
  let p4Html = document.getElementById("cl-p4").innerHTML.trim();
  if (p4Html === "<br>") p4Html = "";
  let p5Html = document.getElementById("cl-p5").innerHTML.trim();
  if (p5Html === "<br>") p5Html = "";

  let formattedP1 = p1Html;
  const appendText = " Yang bertanda tangan di bawah ini:";
  if (formattedP1 && !/<[a-z][\s\S]*>/i.test(formattedP1)) {
    let lines = formattedP1.split("\n").filter((l) => l.trim() !== "");
    if (lines.length > 0) lines[lines.length - 1] += appendText;
    else lines.push(appendText.trim());
    formattedP1 = lines
      .map(
        (line) =>
          `<p style="margin-bottom: 12px; text-align: justify;">${line}</p>`,
      )
      .join("");
  } else if (formattedP1) {
    if (formattedP1.endsWith("</p>"))
      formattedP1 = formattedP1.slice(0, -4) + appendText + "</p>";
    else if (formattedP1.endsWith("</div>"))
      formattedP1 = formattedP1.slice(0, -6) + appendText + "</div>";
    else formattedP1 += appendText;
  }

  let formattedP4 = p4Html;
  if (p4Html && !/<[a-z][\s\S]*>/i.test(p4Html)) {
    const items = p4Html
      .split("\n")
      .filter((l) => l.trim() !== "")
      .map((l) => `<li style="margin-bottom: 4px;">${l}</li>`)
      .join("");
    formattedP4 = items
      ? `<ul style="margin-left: 20px; padding-left: 20px; list-style-type: disc; margin-bottom: 12px;">${items}</ul>`
      : "";
  } else if (p4Html) {
    formattedP4 = `<div class="rtf-output" style="margin-left: 20px; margin-bottom: 12px;">${p4Html}</div>`;
  }

  const html = `
        <div class="cl-header">${headerDate}</div>
        <div class="cl-recipient">
            Hal : <b>${subject}</b><br>
            Lampiran : ${attachment}<br><br>
            Kepada Yth.<br><b>${to}</b><br>
            ${companyStreet}<br>${companyCity}, ${companyZip}
        </div>
        <div class="cl-body">
            <p style="margin-bottom: 12px;">Dengan hormat,</p>
            ${formattedP1 ? formattedP1 : `<p style="margin-bottom: 12px;">${appendText.trim()}</p>`}
            <ul style="margin-left: 20px; padding-left: 20px; list-style-type: disc; margin-bottom: 12px;">
                <li style="margin-bottom: 4px;">Nama: ${name}</li>
                <li style="margin-bottom: 4px;">No. Telepon / WA: ${phone}</li>
                <li style="margin-bottom: 4px;">Email: ${email}</li>
                <li style="margin-bottom: 4px;">Alamat: ${address}</li>
                <li style="margin-bottom: 4px;">Pendidikan Terakhir: ${univ}</li>
                <li style="margin-bottom: 4px;">Program Studi: ${major}</li>
            </ul>
            <div style="margin-bottom: 12px; text-align: justify;">${formatDescription(p3Html)}</div>
            <p style="margin-bottom: 8px;">Sebagai bahan pertimbangan Bapak/Ibu, bersama surat ini saya lampirkan kelengkapan administratif sebagai berikut:</p>
            ${formattedP4}
            <div style="margin-bottom: 12px; text-align: justify;">${formatDescription(p5Html)}</div>
        </div>
        <div class="cl-signature">
            Hormat saya,<br><br><br><br><b>${name}</b>
        </div>
    `;
  preview.innerHTML = html;
  triggerAutoSaveLetter();
}

function buildSavedLetterHTML(form) {
  const cityStr = form.city || "[Kota]";
  let dateStr = "[Tanggal]";
  if (form.dateInput) {
    dateStr = new Date(form.dateInput).toLocaleDateString("id-ID", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }
  const headerDate = `${cityStr}, ${dateStr}`;
  const subject = form.subject || "[Perihal]";
  const attachment = form.attachment || "[Jumlah Lampiran]";
  const to = form.to || "[Nama Tujuan / HRD]";
  const companyStreet =
    form.companyStreet || form.companyAddr || "[Alamat Jl dan Nomor]";
  const companyCity = form.companyCity || "[Kota/Kab]";
  const companyZip = form.companyZip || "[Kode Pos]";

  const name = form.name || "[Nama Lengkap]";
  const phone = form.phone || "[No HP]";
  const email = form.email || "[Email]";
  const address = form.address || "[Alamat Lengkap]";
  const univ = form.univ || "[Nama Universitas]";
  const major = form.major || "[Program Studi]";

  let p1Html = form.p1 || "";
  let p3Html = form.p3 || "";
  let p4Html = form.p4 || "";
  let p5Html = form.p5 || "";

  let formattedP1 = p1Html;
  const appendText = " Yang bertanda tangan di bawah ini:";
  if (formattedP1 && !/<[a-z][\s\S]*>/i.test(formattedP1)) {
    let lines = formattedP1.split("\n").filter((l) => l.trim() !== "");
    if (lines.length > 0) lines[lines.length - 1] += appendText;
    else lines.push(appendText.trim());
    formattedP1 = lines
      .map(
        (line) =>
          `<p style="margin-bottom: 12px; text-align: justify;">${line}</p>`,
      )
      .join("");
  } else if (formattedP1) {
    if (formattedP1.endsWith("</p>"))
      formattedP1 = formattedP1.slice(0, -4) + appendText + "</p>";
    else if (formattedP1.endsWith("</div>"))
      formattedP1 = formattedP1.slice(0, -6) + appendText + "</div>";
    else formattedP1 += appendText;
  }

  let formattedP4 = p4Html;
  if (p4Html && !/<[a-z][\s\S]*>/i.test(p4Html)) {
    const items = p4Html
      .split("\n")
      .filter((l) => l.trim() !== "")
      .map((l) => `<li style="margin-bottom: 4px;">${l}</li>`)
      .join("");
    formattedP4 = items
      ? `<ul style="margin-left: 20px; padding-left: 20px; list-style-type: disc; margin-bottom: 12px;">${items}</ul>`
      : "";
  } else if (p4Html) {
    formattedP4 = `<div class="rtf-output" style="margin-left: 20px; margin-bottom: 12px;">${p4Html}</div>`;
  }

  return `
        <div class="cl-header">${headerDate}</div>
        <div class="cl-recipient">
            Hal : <b>${subject}</b><br>
            Lampiran : ${attachment}<br><br>
            Kepada Yth.<br><b>${to}</b><br>
            ${companyStreet}<br>${companyCity}, ${companyZip}
        </div>
        <div class="cl-body">
            <p style="margin-bottom: 12px;">Dengan hormat,</p>
            ${formattedP1 ? formattedP1 : `<p style="margin-bottom: 12px;">${appendText.trim()}</p>`}
            <ul style="margin-left: 20px; padding-left: 20px; list-style-type: disc; margin-bottom: 12px;">
                <li style="margin-bottom: 4px;">Nama: ${name}</li>
                <li style="margin-bottom: 4px;">No. Telepon / WA: ${phone}</li>
                <li style="margin-bottom: 4px;">Email: ${email}</li>
                <li style="margin-bottom: 4px;">Alamat: ${address}</li>
                <li style="margin-bottom: 4px;">Pendidikan Terakhir: ${univ}</li>
                <li style="margin-bottom: 4px;">Program Studi: ${major}</li>
            </ul>
            <div style="margin-bottom: 12px; text-align: justify;">${formatDescription(p3Html)}</div>
            <p style="margin-bottom: 8px;">Sebagai bahan pertimbangan Bapak/Ibu, bersama surat ini saya lampirkan kelengkapan administratif sebagai berikut:</p>
            ${formattedP4}
            <div style="margin-bottom: 12px; text-align: justify;">${formatDescription(p5Html)}</div>
        </div>
        <div class="cl-signature">
            Hormat saya,<br><br><br><br><b>${name}</b>
        </div>
    `;
}

function updateLeavePreview() {
  const preview = document.getElementById("preview-leave-a4");
  const cityStr = document.getElementById("lv-city").value || "[Kota]";
  const dateInputVal = document.getElementById("lv-date-input").value;
  let dateStr = "[Tanggal]";
  if (dateInputVal) {
    dateStr = new Date(dateInputVal).toLocaleDateString("id-ID", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }
  const headerDate = `${cityStr}, ${dateStr}`;

  const to = document.getElementById("lv-to").value || "[Nama Tujuan / Atasan]";
  const company =
    document.getElementById("lv-company").value || "[Nama Perusahaan]";
  const name = document.getElementById("lv-name").value || "[Nama Karyawan]";
  const nik = document.getElementById("lv-nik").value || "[NIK / ID Karyawan]";
  const position = document.getElementById("lv-position").value || "[Jabatan]";
  const department =
    document.getElementById("lv-department").value || "[Divisi/Departemen]";

  let startStr = "[Mulai]";
  const startVal = document.getElementById("lv-start").value;
  if (startVal)
    startStr = new Date(startVal).toLocaleDateString("id-ID", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

  let endStr = "[Selesai]";
  const endVal = document.getElementById("lv-end").value;
  if (endVal)
    endStr = new Date(endVal).toLocaleDateString("id-ID", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

  let reasonHtml = document.getElementById("lv-reason").innerHTML.trim();
  if (reasonHtml === "<br>") reasonHtml = "";

  const html = `
        <div class="cl-header">${headerDate}</div>
        <div class="cl-recipient">
            Hal : <b>Permohonan Cuti Kerja</b><br>Lampiran : -<br><br>
            Kepada Yth.<br><b>${to}</b><br>${company}
        </div>
        <div class="cl-body">
            <p style="margin-bottom: 12px;">Dengan hormat,</p>
            <p style="margin-bottom: 12px; text-align: justify;">Yang bertanda tangan di bawah ini:</p>
            <ul style="margin-left: 20px; padding-left: 20px; list-style-type: disc; margin-bottom: 12px;">
                <li style="margin-bottom: 4px;">Nama: ${name}</li>
                <li style="margin-bottom: 4px;">NIK / ID Karyawan: ${nik}</li>
                <li style="margin-bottom: 4px;">Jabatan: ${position}</li>
                <li style="margin-bottom: 4px;">Divisi / Departemen: ${department}</li>
            </ul>
            <div style="margin-bottom: 12px; text-align: justify;">
                Melalui surat ini, saya bermaksud untuk mengajukan permohonan cuti kerja terhitung mulai tanggal <b>${startStr}</b> sampai dengan <b>${endStr}</b>. 
                Adapun alasan dari pengajuan permohonan cuti ini adalah karena:
                <div style="margin-top: 8px;" class="rtf-output">${formatDescription(reasonHtml)}</div>
            </div>
            <p style="margin-bottom: 12px; text-align: justify;">
                Demikian surat permohonan cuti ini saya sampaikan. Atas perhatian, kebijaksanaan, dan izin yang diberikan oleh Bapak/Ibu, saya ucapkan terima kasih.
            </p>
        </div>
        <div class="cl-signature">
            Hormat saya,<br><br><br><br><b>${name}</b>
        </div>
    `;
  preview.innerHTML = html;
  triggerAutoSaveOther("leave");
}

function buildSavedLeaveHTML(form) {
  const cityStr = form.city || "[Kota]";
  let dateStr = "[Tanggal]";
  if (form.dateInput) {
    dateStr = new Date(form.dateInput).toLocaleDateString("id-ID", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }
  const headerDate = `${cityStr}, ${dateStr}`;

  const to = form.to || "[Nama Tujuan / Atasan]";
  const company = form.company || "[Nama Perusahaan]";
  const name = form.name || "[Nama Karyawan]";
  const nik = form.nik || "[NIK / ID Karyawan]";
  const position = form.position || "[Jabatan]";
  const department = form.department || "[Divisi/Departemen]";

  let startStr = "[Mulai]";
  if (form.start)
    startStr = new Date(form.start).toLocaleDateString("id-ID", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  let endStr = "[Selesai]";
  if (form.end)
    endStr = new Date(form.end).toLocaleDateString("id-ID", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

  const reasonHtml = form.reason || "";

  return `
        <div class="cl-header">${headerDate}</div>
        <div class="cl-recipient">
            Hal : <b>Permohonan Cuti Kerja</b><br>Lampiran : -<br><br>
            Kepada Yth.<br><b>${to}</b><br>${company}
        </div>
        <div class="cl-body">
            <p style="margin-bottom: 12px;">Dengan hormat,</p>
            <p style="margin-bottom: 12px; text-align: justify;">Yang bertanda tangan di bawah ini:</p>
            <ul style="margin-left: 20px; padding-left: 20px; list-style-type: disc; margin-bottom: 12px;">
                <li style="margin-bottom: 4px;">Nama: ${name}</li>
                <li style="margin-bottom: 4px;">NIK / ID Karyawan: ${nik}</li>
                <li style="margin-bottom: 4px;">Jabatan: ${position}</li>
                <li style="margin-bottom: 4px;">Divisi / Departemen: ${department}</li>
            </ul>
            <div style="margin-bottom: 12px; text-align: justify;">
                Melalui surat ini, saya bermaksud untuk mengajukan permohonan cuti kerja terhitung mulai tanggal <b>${startStr}</b> sampai dengan <b>${endStr}</b>. 
                Adapun alasan dari pengajuan permohonan cuti ini adalah karena:
                <div style="margin-top: 8px;" class="rtf-output">${formatDescription(reasonHtml)}</div>
            </div>
            <p style="margin-bottom: 12px; text-align: justify;">
                Demikian surat permohonan cuti ini saya sampaikan. Atas perhatian, kebijaksanaan, dan izin yang diberikan oleh Bapak/Ibu, saya ucapkan terima kasih.
            </p>
        </div>
        <div class="cl-signature">
            Hormat saya,<br><br><br><br><b>${name}</b>
        </div>
    `;
}

function updateResignPreview() {
  const preview = document.getElementById("preview-resign-a4");
  const cityStr = document.getElementById("rs-city").value || "[Kota]";
  const dateInputVal = document.getElementById("rs-date-input").value;
  let dateStr = "[Tanggal]";
  if (dateInputVal) {
    dateStr = new Date(dateInputVal).toLocaleDateString("id-ID", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }
  const headerDate = `${cityStr}, ${dateStr}`;

  const to =
    document.getElementById("rs-to").value || "[Nama Tujuan / Pimpinan]";
  const company =
    document.getElementById("rs-company").value || "[Nama Perusahaan]";
  const name = document.getElementById("rs-name").value || "[Nama Karyawan]";
  const position = document.getElementById("rs-position").value || "[Jabatan]";
  const department =
    document.getElementById("rs-department").value || "[Divisi/Departemen]";

  let effectiveStr = "[Tanggal Resign]";
  const effectiveVal = document.getElementById("rs-effective").value;
  if (effectiveVal)
    effectiveStr = new Date(effectiveVal).toLocaleDateString("id-ID", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

  let reasonHtml = document.getElementById("rs-reason").innerHTML.trim();
  if (reasonHtml === "<br>") reasonHtml = "";

  const html = `
        <div class="cl-header">${headerDate}</div>
        <div class="cl-recipient">
            Kepada Yth.<br><b>${to}</b><br>${company}
        </div>
        <div class="cl-body">
            <p style="margin-bottom: 12px;">Dengan hormat,</p>
            <p style="margin-bottom: 12px; text-align: justify;">Melalui surat ini, saya yang bertanda tangan di bawah ini:</p>
            <ul style="margin-left: 20px; padding-left: 20px; list-style-type: disc; margin-bottom: 12px;">
                <li style="margin-bottom: 4px;">Nama: ${name}</li>
                <li style="margin-bottom: 4px;">Jabatan: ${position}</li>
                <li style="margin-bottom: 4px;">Divisi / Departemen: ${department}</li>
            </ul>
            <p style="margin-bottom: 12px; text-align: justify;">
                Bermaksud untuk menyampaikan permohonan pengunduran diri dari posisi <b>${position}</b> di perusahaan ini, terhitung efektif sejak tanggal <b>${effectiveStr}</b>.
            </p>
            <div class="rtf-output" style="margin-bottom: 12px; text-align: justify;">${formatDescription(reasonHtml)}</div>
            <p style="margin-bottom: 12px; text-align: justify;">
                Demikian surat pengunduran diri ini saya buat dengan kesadaran penuh dan tanpa paksaan dari pihak mana pun. Saya berharap perusahaan terus berkembang dan meraih kesuksesan yang lebih besar di masa mendatang.
            </p>
        </div>
        <div class="cl-signature">
            Hormat saya,<br><br><br><br><b>${name}</b>
        </div>
    `;
  preview.innerHTML = html;
  triggerAutoSaveOther("resign");
}

function buildSavedResignHTML(form) {
  const cityStr = form.city || "[Kota]";
  let dateStr = "[Tanggal]";
  if (form.dateInput) {
    dateStr = new Date(form.dateInput).toLocaleDateString("id-ID", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }
  const headerDate = `${cityStr}, ${dateStr}`;

  const to = form.to || "[Nama Tujuan / Pimpinan]";
  const company = form.company || "[Nama Perusahaan]";
  const name = form.name || "[Nama Karyawan]";
  const position = form.position || "[Jabatan]";
  const department = form.department || "[Divisi/Departemen]";

  let effectiveStr = "[Tanggal Resign]";
  if (form.effective)
    effectiveStr = new Date(form.effective).toLocaleDateString("id-ID", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

  const reasonHtml = form.reason || "";

  return `
        <div class="cl-header">${headerDate}</div>
        <div class="cl-recipient">
            Kepada Yth.<br><b>${to}</b><br>${company}
        </div>
        <div class="cl-body">
            <p style="margin-bottom: 12px;">Dengan hormat,</p>
            <p style="margin-bottom: 12px; text-align: justify;">Melalui surat ini, saya yang bertanda tangan di bawah ini:</p>
            <ul style="margin-left: 20px; padding-left: 20px; list-style-type: disc; margin-bottom: 12px;">
                <li style="margin-bottom: 4px;">Nama: ${name}</li>
                <li style="margin-bottom: 4px;">Jabatan: ${position}</li>
                <li style="margin-bottom: 4px;">Divisi / Departemen: ${department}</li>
            </ul>
            <p style="margin-bottom: 12px; text-align: justify;">
                Bermaksud untuk menyampaikan permohonan pengunduran diri dari posisi <b>${position}</b> di perusahaan ini, terhitung efektif sejak tanggal <b>${effectiveStr}</b>.
            </p>
            <div class="rtf-output" style="margin-bottom: 12px; text-align: justify;">${formatDescription(reasonHtml)}</div>
            <p style="margin-bottom: 12px; text-align: justify;">
                Demikian surat pengunduran diri ini saya buat dengan kesadaran penuh dan tanpa paksaan dari pihak mana pun. Saya berharap perusahaan terus berkembang dan meraih kesuksesan yang lebih besar di masa mendatang.
            </p>
        </div>
        <div class="cl-signature">
            Hormat saya,<br><br><br><br><b>${name}</b>
        </div>
    `;
}

function renderCVHistory() {
  const tbody = document.getElementById("table-body-cv");
  tbody.innerHTML = "";

  if (cvData.length === 0) {
    tbody.innerHTML = `<tr><td colspan="3" class="text-center p-4 text-gray-500">Belum ada CV yang tersimpan.</td></tr>`;
    return;
  }

  const sortedCVData = [...cvData].sort(
    (a, b) => new Date(b.date) - new Date(a.date),
  );
  sortedCVData.forEach((cv) => {
    const tr = document.createElement("tr");
    tr.className = "border-b hover:bg-gray-50";
    /* Penyematan tombol DOCX pada tabel Riwayat CV */
    tr.innerHTML = `
            <td class="p-3 lg:p-4 font-medium text-primary">${cv.name || "Tanpa Nama"}</td>
            <td class="p-3 lg:p-4 whitespace-nowrap">${formatDate(cv.date)}</td>
            <td class="p-3 lg:p-4 flex justify-center gap-2">
                <button onclick="downloadDocxCVFromHistory('${cv.id}', this)" class="bg-blue-100 text-blue-600 px-3 py-1 rounded hover:bg-blue-200 transition" title="Download Word"><i class="fa-solid fa-file-word"></i></button>
                <button onclick="downloadCVFromHistory('${cv.id}', this)" class="bg-green-100 text-green-600 px-3 py-1 rounded hover:bg-green-200 transition" title="Download PDF"><i class="fa-solid fa-download"></i></button>
                <button onclick="editCV('${cv.id}')" class="bg-blue-100 text-primary px-3 py-1 rounded hover:bg-blue-200 transition" title="Edit"><i class="fa-solid fa-pen"></i></button>
                <button onclick="deleteCV('${cv.id}')" class="bg-red-100 text-red-600 px-3 py-1 rounded hover:bg-red-200 transition" title="Hapus"><i class="fa-solid fa-trash"></i></button>
            </td>
        `;
    tbody.appendChild(tr);
  });
}

function editCV(id) {
  const cv = cvData.find((c) => c.id === id);
  if (!cv) return;
  resetCVForm();

  document.getElementById("cv-id").value = cv.id;
  document.getElementById("cv-name").value = cv.form.header.name;
  document.getElementById("cv-email").value = cv.form.header.email;
  document.getElementById("cv-phone").value = cv.form.header.phone;
  document.getElementById("cv-address").value = cv.form.header.address;
  document.getElementById("cv-linkedin").value = cv.form.header.linkedin;
  document.getElementById("cv-portfolio").value = cv.form.header.portfolio;

  const summaryEditor = document.getElementById("cv-summary");
  if (summaryEditor) summaryEditor.innerHTML = cv.form.header.summary || "";

  currentProfilePic = cv.form.header.photo || "";
  currentQrCode = cv.form.header.qrcode || "";

  ["education", "experience", "project", "org", "cert"].forEach((type) => {
    document.getElementById(`container-${type}`).innerHTML = "";
    if (cv.form[type] && cv.form[type].length > 0) {
      cv.form[type].forEach((item) => {
        const newId = `field-${type}-${Date.now()}${Math.random()}`;
        document
          .getElementById(`container-${type}`)
          .insertAdjacentHTML("beforeend", createFieldHTML(type, newId));
        const block = document.getElementById(newId);
        let prefix = type === "education" ? `dyn-edu-` : `dyn-${type}-`;

        Object.keys(item).forEach((key) => {
          const input = block.querySelector(`.${prefix}${key}`);
          if (input) {
            if (input.type === "checkbox") {
              input.checked = item[key];
              toggleEndDate(input);
            } else if (input.classList.contains("rtf-editor")) {
              input.innerHTML = item[key] || "";
            } else {
              input.value = item[key];
            }
          }
        });
      });
    } else {
      addDynamicField(type);
    }
  });

  ["skill", "language"].forEach((type) => {
    const container = document.getElementById(`container-${type}`);
    container.innerHTML = "";
    const list = type === "skill" ? cv.form.skillList : cv.form.languageList;
    if (list && list.length > 0) {
      list.forEach((item) => addSkillField(type, item));
    } else {
      addSkillField(type);
    }
  });

  switchView("add-cv");
  updateCVPreview();
}

function resetCVForm() {
  document.getElementById("cv-id").value = "";
  document
    .querySelectorAll("#view-add-cv input, #view-add-cv select")
    .forEach((el) => {
      if (el.type === "checkbox") el.checked = false;
      else if (el.tagName.toLowerCase() === "select") el.selectedIndex = 0;
      else el.value = "";
    });
  document
    .querySelectorAll("#view-add-cv .rtf-editor")
    .forEach((el) => (el.innerHTML = ""));

  currentProfilePic = "";
  currentQrCode = "";

  ["education", "experience", "project", "org", "cert"].forEach((type) => {
    document.getElementById(`container-${type}`).innerHTML = "";
    addDynamicField(type);
  });

  document.getElementById("container-skill").innerHTML = "";
  addSkillField("skill");
  document.getElementById("container-language").innerHTML = "";
  addSkillField("language");

  const indicator = document.getElementById("cv-autosave-indicator");
  if (indicator) indicator.innerText = "";

  updateCVPreview();
}

function renderLetterHistory() {
  const tbody = document.getElementById("table-body-letter");
  tbody.innerHTML = "";

  if (letterData.length === 0) {
    tbody.innerHTML = `<tr><td colspan="4" class="text-center p-4 text-gray-500">Belum ada Surat Lamaran tersimpan.</td></tr>`;
    return;
  }

  const sortedLetterData = [...letterData].sort(
    (a, b) => new Date(b.date) - new Date(a.date),
  );
  sortedLetterData.forEach((cl) => {
    const tr = document.createElement("tr");
    tr.className = "border-b hover:bg-gray-50";
    /* Penyematan tombol DOCX pada tabel Riwayat Surat Lamaran */
    tr.innerHTML = `
            <td class="p-3 lg:p-4 font-medium text-primary">${cl.name || "Tanpa Nama"}</td>
            <td class="p-3 lg:p-4">${cl.subject || "-"}</td>
            <td class="p-3 lg:p-4 whitespace-nowrap">${formatDate(cl.date)}</td>
            <td class="p-3 lg:p-4 flex justify-center gap-2">
                <button onclick="downloadDocxLetterFromHistory('${cl.id}', this)" class="bg-blue-100 text-blue-600 px-3 py-1 rounded hover:bg-blue-200 transition" title="Download Word"><i class="fa-solid fa-file-word"></i></button>
                <button onclick="downloadLetterFromHistory('${cl.id}', this)" class="bg-green-100 text-green-600 px-3 py-1 rounded hover:bg-green-200 transition" title="Download PDF"><i class="fa-solid fa-download"></i></button>
                <button onclick="editLetter('${cl.id}')" class="bg-blue-100 text-primary px-3 py-1 rounded hover:bg-blue-200 transition" title="Edit"><i class="fa-solid fa-pen"></i></button>
                <button onclick="deleteLetter('${cl.id}')" class="bg-red-100 text-red-600 px-3 py-1 rounded hover:bg-red-200 transition" title="Hapus"><i class="fa-solid fa-trash"></i></button>
            </td>
        `;
    tbody.appendChild(tr);
  });
}

function editLetter(id) {
  const cl = letterData.find((l) => l.id === id);
  if (!cl) return;
  resetLetterForm();

  document.getElementById("cl-id").value = cl.id;
  document.getElementById("cl-city").value = cl.form.city || "";
  document.getElementById("cl-date-input").value = cl.form.dateInput || "";
  document.getElementById("cl-subject").value = cl.form.subject;
  document.getElementById("cl-attachment").value = cl.form.attachment;
  document.getElementById("cl-to").value = cl.form.to;
  document.getElementById("cl-company-street").value =
    cl.form.companyStreet || cl.form.companyAddr || "";
  document.getElementById("cl-company-city").value = cl.form.companyCity || "";
  document.getElementById("cl-company-zip").value = cl.form.companyZip || "";
  document.getElementById("cl-name").value = cl.form.name;
  document.getElementById("cl-phone").value = cl.form.phone;
  document.getElementById("cl-email").value = cl.form.email;
  document.getElementById("cl-address").value = cl.form.address;
  document.getElementById("cl-univ").value = cl.form.univ;
  document.getElementById("cl-major").value = cl.form.major;

  document.getElementById("cl-p1").innerHTML = cl.form.p1 || "";
  document.getElementById("cl-p3").innerHTML = cl.form.p3 || "";
  document.getElementById("cl-p4").innerHTML = cl.form.p4 || "";
  document.getElementById("cl-p5").innerHTML = cl.form.p5 || "";

  switchView("add-letter");
  updateLetterPreview();
}

function resetLetterForm() {
  document.getElementById("cl-id").value = "";
  document
    .querySelectorAll("#view-add-letter input, #view-add-letter textarea")
    .forEach((el) => (el.value = ""));
  document
    .querySelectorAll("#view-add-letter .rtf-editor")
    .forEach((el) => (el.innerHTML = ""));
  const indicator = document.getElementById("cl-autosave-indicator");
  if (indicator) indicator.innerText = "";
  updateLetterPreview();
}

function renderOtherHistory() {
  const tbody = document.getElementById("table-body-other");
  tbody.innerHTML = "";

  if (otherLetterData.length === 0) {
    tbody.innerHTML = `<tr><td colspan="4" class="text-center p-4 text-gray-500">Belum ada Surat Administrasi tersimpan.</td></tr>`;
    return;
  }

  const sortedData = [...otherLetterData].sort(
    (a, b) => new Date(b.date) - new Date(a.date),
  );
  sortedData.forEach((item) => {
    const tr = document.createElement("tr");
    tr.className = "border-b hover:bg-gray-50";
    /* Penyematan tombol DOCX pada tabel Riwayat Surat Administrasi */
    tr.innerHTML = `
            <td class="p-3 lg:p-4 font-medium text-primary">${item.name || "Tanpa Nama"}</td>
            <td class="p-3 lg:p-4">${item.subject}</td>
            <td class="p-3 lg:p-4 whitespace-nowrap">${formatDate(item.date)}</td>
            <td class="p-3 lg:p-4 flex justify-center gap-2">
                <button onclick="downloadDocxOtherFromHistory('${item.id}', this)" class="bg-blue-100 text-blue-600 px-3 py-1 rounded hover:bg-blue-200 transition" title="Download Word"><i class="fa-solid fa-file-word"></i></button>
                <button onclick="downloadOtherFromHistory('${item.id}', this)" class="bg-green-100 text-green-600 px-3 py-1 rounded hover:bg-green-200 transition" title="Download PDF"><i class="fa-solid fa-download"></i></button>
                <button onclick="editOtherLetter('${item.id}')" class="bg-blue-100 text-primary px-3 py-1 rounded hover:bg-blue-200 transition" title="Edit"><i class="fa-solid fa-pen"></i></button>
                <button onclick="deleteOtherLetter('${item.id}')" class="bg-red-100 text-red-600 px-3 py-1 rounded hover:bg-red-200 transition" title="Hapus"><i class="fa-solid fa-trash"></i></button>
            </td>
        `;
    tbody.appendChild(tr);
  });
}

function editOtherLetter(id) {
  const item = otherLetterData.find((l) => l.id === id);
  if (!item) return;

  if (item.type === "leave") {
    resetLeaveForm();
    document.getElementById("lv-id").value = item.id;
    document.getElementById("lv-city").value = item.form.city || "";
    document.getElementById("lv-date-input").value = item.form.dateInput || "";
    document.getElementById("lv-to").value = item.form.to || "";
    document.getElementById("lv-company").value = item.form.company || "";
    document.getElementById("lv-name").value = item.form.name || "";
    document.getElementById("lv-nik").value = item.form.nik || "";
    document.getElementById("lv-position").value = item.form.position || "";
    document.getElementById("lv-department").value = item.form.department || "";
    document.getElementById("lv-start").value = item.form.start || "";
    document.getElementById("lv-end").value = item.form.end || "";

    const reasonEditor = document.getElementById("lv-reason");
    if (reasonEditor) reasonEditor.innerHTML = item.form.reason || "";

    switchView("add-leave");
    updateLeavePreview();
  } else if (item.type === "sick") {
    resetSickForm();
    document.getElementById("sk-id").value = item.id;
    document.getElementById("sk-date-input").value = item.form.dateInput || "";
    document.getElementById("sk-city").value = item.form.city || "";
    document.getElementById("sk-to").value = item.form.to || "";
    document.getElementById("sk-company").value = item.form.company || "";
    document.getElementById("sk-name").value = item.form.name || "";
    document.getElementById("sk-nik").value = item.form.nik || "";
    document.getElementById("sk-position").value = item.form.position || "";
    document.getElementById("sk-start").value = item.form.start || "";
    document.getElementById("sk-end").value = item.form.end || "";

    const reasonEditor = document.getElementById("sk-reason");
    if (reasonEditor) reasonEditor.innerHTML = item.form.reason || "";

    switchView("add-sick");
    updateSickPreview();
  } else if (item.type === "invitation") {
    resetInvitationForm();
    document.getElementById("inv-id").value = item.id;
    document.getElementById("inv-kop-name").value = item.form.kopName || "";
    const invLogoDataEl = document.getElementById("inv-kop-logo-data");
    if (invLogoDataEl) invLogoDataEl.value = item.form.kopLogo || "";
    const invLogoRightDataEl = document.getElementById("inv-kop-logo-right-data");
    if (invLogoRightDataEl) invLogoRightDataEl.value = item.form.kopLogoRight || "";
    document.getElementById("inv-kop-address").value = item.form.kopAddress || "";
    document.getElementById("inv-kop-contact").value = item.form.kopContact || "";
    document.getElementById("inv-number").value = item.form.number || "";
    document.getElementById("inv-attachment").value = item.form.attachment || "";
    document.getElementById("inv-subject").value = item.form.subject || "";
    document.getElementById("inv-date-input").value = item.form.dateInput || "";
    document.getElementById("inv-city").value = item.form.city || "";
    document.getElementById("inv-to").value = item.form.to || "";
    document.getElementById("inv-to-place").value = item.form.toPlace || "";
    document.getElementById("inv-opening").value = item.form.opening || "";
    document.getElementById("inv-event-date").value = item.form.eventDate || "";
    document.getElementById("inv-event-time").value = item.form.eventTime || "";
    document.getElementById("inv-event-place").value = item.form.eventPlace || "";
    document.getElementById("inv-closing").value = item.form.closing || "";
    document.getElementById("inv-cc").value = item.form.cc || "";
    
    // load sigs
    const mainContainer = document.getElementById("container-inv-main-sig");
    mainContainer.innerHTML = "";
    if (item.form.mainSigs) {
      item.form.mainSigs.forEach(sig => addSignatureField("inv", "main", sig.name, sig.position, sig.imageBase64, sig.align, sig.place, sig.date, sig.nik));
    } else {
      addSignatureField("inv", "main");
    }

    const ackContainer = document.getElementById("container-inv-ack-sig");
    ackContainer.innerHTML = "";
    if (item.form.ackSigs) {
      item.form.ackSigs.forEach(sig => addSignatureField("inv", "ack", sig.name, sig.position, sig.imageBase64, sig.align, sig.place, sig.date, sig.nik));
    }

    switchView("add-invitation");
    updateInvitationPreview();
  } else if (item.type === "notification") {
    resetNotificationForm();
    document.getElementById("notif-id").value = item.id;
    document.getElementById("notif-kop-name").value = item.form.kopName || "";
    const notifLogoDataEl = document.getElementById("notif-kop-logo-data");
    if (notifLogoDataEl) notifLogoDataEl.value = item.form.kopLogo || "";
    const notifLogoRightDataEl = document.getElementById("notif-kop-logo-right-data");
    if (notifLogoRightDataEl) notifLogoRightDataEl.value = item.form.kopLogoRight || "";
    document.getElementById("notif-kop-address").value = item.form.kopAddress || "";
    document.getElementById("notif-kop-contact").value = item.form.kopContact || "";
    document.getElementById("notif-number").value = item.form.number || "";
    document.getElementById("notif-attachment").value = item.form.attachment || "";
    document.getElementById("notif-subject").value = item.form.subject || "";
    document.getElementById("notif-date-input").value = item.form.dateInput || "";
    document.getElementById("notif-city").value = item.form.city || "";
    document.getElementById("notif-to").value = item.form.to || "";
    document.getElementById("notif-to-place").value = item.form.toPlace || "";
    document.getElementById("notif-opening").value = item.form.opening || "";
    document.getElementById("notif-closing").value = item.form.closing || "";
    document.getElementById("notif-cc").value = item.form.cc || "";
    
    const contentEditor = document.getElementById("notif-content");
    if (contentEditor) contentEditor.innerHTML = item.form.content || "";

    // load sigs
    const mainContainer = document.getElementById("container-notif-main-sig");
    mainContainer.innerHTML = "";
    if (item.form.mainSigs) {
      item.form.mainSigs.forEach(sig => addSignatureField("notif", "main", sig.name, sig.position, sig.imageBase64, sig.align, sig.place, sig.date, sig.nik));
    } else {
      addSignatureField("notif", "main");
    }

    const ackContainer = document.getElementById("container-notif-ack-sig");
    ackContainer.innerHTML = "";
    if (item.form.ackSigs) {
      item.form.ackSigs.forEach(sig => addSignatureField("notif", "ack", sig.name, sig.position, sig.imageBase64, sig.align, sig.place, sig.date, sig.nik));
    }

    switchView("add-notification");
    updateNotificationPreview();
  } else {
    resetResignForm();
    document.getElementById("rs-id").value = item.id;
    document.getElementById("rs-city").value = item.form.city || "";
    document.getElementById("rs-date-input").value = item.form.dateInput || "";
    document.getElementById("rs-to").value = item.form.to || "";
    document.getElementById("rs-company").value = item.form.company || "";
    document.getElementById("rs-name").value = item.form.name || "";
    document.getElementById("rs-position").value = item.form.position || "";
    document.getElementById("rs-department").value = item.form.department || "";
    document.getElementById("rs-effective").value = item.form.effective || "";

    const reasonEditor = document.getElementById("rs-reason");
    if (reasonEditor) reasonEditor.innerHTML = item.form.reason || "";

    switchView("add-resign");
    updateResignPreview();
  }
}

function resetLeaveForm() {
  document.getElementById("lv-id").value = "";
  document
    .querySelectorAll("#view-add-leave input")
    .forEach((el) => (el.value = ""));
  document
    .querySelectorAll("#view-add-leave .rtf-editor")
    .forEach((el) => (el.innerHTML = ""));
  const indicator = document.getElementById("lv-autosave-indicator");
  if (indicator) indicator.innerText = "";
  updateLeavePreview();
}

function resetResignForm() {
  document.getElementById("rs-id").value = "";
  document
    .querySelectorAll("#view-add-resign input")
    .forEach((el) => (el.value = ""));
  document
    .querySelectorAll("#view-add-resign .rtf-editor")
    .forEach((el) => (el.innerHTML = ""));
  const indicator = document.getElementById("rs-autosave-indicator");
  if (indicator) indicator.innerText = "";
  updateResignPreview();
}

function addSignatureField(formPrefix, sigType, nameVal = "", posVal = "", imageBase64 = "", align = "center", place = null, date = null, nikVal = "") {
  const container = document.getElementById(`container-${formPrefix}-${sigType}-sig`);
  if (!container) return;
  const id = generateId();
  const updater = formPrefix === "inv" ? "updateInvitationPreview()" : "updateNotificationPreview()";
  
  if (place === null) {
    place = document.getElementById(`${formPrefix}-city`) ? document.getElementById(`${formPrefix}-city`).value : "";
  }
  if (date === null) {
    date = document.getElementById(`${formPrefix}-date-input`) ? document.getElementById(`${formPrefix}-date-input`).value : "";
  }

  const div = document.createElement("div");
  div.className = "p-4 border rounded relative bg-white shadow-sm";
  div.id = `sig-${id}`;
  div.innerHTML = `
    <button type="button" onclick="removeSignatureField('${id}', '${formPrefix}')" class="absolute top-2 right-2 text-red-500 hover:text-red-700" title="Hapus"><i class="fa-solid fa-times"></i></button>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
      <div>
        <label class="block text-sm font-medium mb-1">Perataan</label>
        <select class="w-full border rounded p-2 text-sm sig-align" onchange="${updater}">
          <option value="left" ${align === 'left' ? 'selected' : ''}>Kiri</option>
          <option value="center" ${align === 'center' ? 'selected' : ''}>Tengah</option>
          <option value="right" ${align === 'right' ? 'selected' : ''}>Kanan</option>
        </select>
      </div>
      <div>
        <label class="block text-sm font-medium mb-1">Tempat (Opsional)</label>
        <input type="text" class="w-full border rounded p-2 text-sm sig-place" value="${place}" oninput="${updater}" placeholder="Jakarta">
      </div>
      <div>
        <label class="block text-sm font-medium mb-1">Tanggal (Opsional)</label>
        <input type="date" class="w-full border rounded p-2 text-sm sig-date" value="${date}" oninput="${updater}">
      </div>
      <div>
        <label class="block text-sm font-medium mb-1">Posisi/Jabatan *</label>
        <input type="text" class="w-full border rounded p-2 text-sm sig-pos" value="${posVal}" oninput="${updater}" placeholder="Jabatan">
      </div>
      <div>
        <label class="block text-sm font-medium mb-1">Nama Terang *</label>
        <input type="text" class="w-full border rounded p-2 text-sm sig-name" value="${nameVal}" oninput="${updater}" placeholder="Nama Lengkap">
      </div>
      <div>
        <label class="block text-sm font-medium mb-1">NIK/NIP/NRP (Opsional)</label>
        <input type="text" class="w-full border rounded p-2 text-sm sig-nik" value="${nikVal}" oninput="${updater}" placeholder="NIP. 123456789">
      </div>
      <div class="col-span-1 md:col-span-2">
        <label class="block text-sm font-medium mb-1">Gambar Tanda Tangan (Opsional)</label>
        <input type="file" accept="image/*" class="w-full border rounded p-2 text-sm" onchange="handleImageUploadBase64(event, function(base64) { document.getElementById('sig-img-${id}').value = base64; ${updater}; }, 200)">
        <input type="hidden" id="sig-img-${id}" class="sig-img" value="${imageBase64}">
      </div>
    </div>
  `;
  container.appendChild(div);
  if (formPrefix === "inv") updateInvitationPreview();
  if (formPrefix === "notif") updateNotificationPreview();
}

function removeSignatureField(id, formPrefix) {
  const el = document.getElementById(`sig-${id}`);
  if (el) el.remove();
  if (formPrefix === "inv") updateInvitationPreview();
  if (formPrefix === "notif") updateNotificationPreview();
}

function getSignatureData(formPrefix, sigType) {
  const container = document.getElementById(`container-${formPrefix}-${sigType}-sig`);
  if (!container) return [];
  const items = [];
  container.querySelectorAll("div[id^='sig-']").forEach(div => {
    const name = div.querySelector(".sig-name").value;
    const position = div.querySelector(".sig-pos").value;
    const imgBase64 = div.querySelector(".sig-img").value;
    const alignEl = div.querySelector(".sig-align");
    const align = alignEl ? alignEl.value : "center";
    const placeEl = div.querySelector(".sig-place");
    const place = placeEl ? placeEl.value : "";
    const dateEl = div.querySelector(".sig-date");
    const date = dateEl ? dateEl.value : "";
    const nikEl = div.querySelector(".sig-nik");
    const nik = nikEl ? nikEl.value : "";
    items.push({ name, position, imageBase64: imgBase64, align, place, date, nik });
  });
  return items;
}

function resetSickForm() {
  document.getElementById("sk-id").value = "";
  document.querySelectorAll("#view-add-sick input").forEach(el => el.value = "");
  document.querySelectorAll("#view-add-sick .rtf-editor").forEach(el => el.innerHTML = "");
  const indicator = document.getElementById("sk-autosave-indicator");
  if (indicator) indicator.innerText = "";
  updateSickPreview();
}

function resetInvitationForm() {
  document.getElementById("inv-id").value = "";
  document.querySelectorAll("#view-add-invitation input, #view-add-invitation textarea").forEach(el => el.value = "");
  document.getElementById("container-inv-main-sig").innerHTML = "";
  document.getElementById("container-inv-ack-sig").innerHTML = "";
  addSignatureField("inv", "main");
  const indicator = document.getElementById("inv-autosave-indicator");
  if (indicator) indicator.innerText = "";
  updateInvitationPreview();
}

function resetNotificationForm() {
  document.getElementById("notif-id").value = "";
  document.querySelectorAll("#view-add-notification input, #view-add-notification textarea").forEach(el => el.value = "");
  document.querySelectorAll("#view-add-notification .rtf-editor").forEach(el => el.innerHTML = "");
  document.getElementById("container-notif-main-sig").innerHTML = "";
  document.getElementById("container-notif-ack-sig").innerHTML = "";
  addSignatureField("notif", "main");
  const indicator = document.getElementById("notif-autosave-indicator");
  if (indicator) indicator.innerText = "";
  updateNotificationPreview();
}

function updateSickPreview() {
  const dateInput = document.getElementById("sk-date-input").value;
  const city = document.getElementById("sk-city").value || "Kota";
  const to = document.getElementById("sk-to").value || "HRD Manager / Atasan / Wali Kelas";
  const company = document.getElementById("sk-company").value || "Nama Perusahaan / Sekolah";
  
  const name = document.getElementById("sk-name").value || "Nama Lengkap";
  const nik = document.getElementById("sk-nik").value || "123456789";
  const position = document.getElementById("sk-position").value || "Jabatan / Kelas";
  
  const start = document.getElementById("sk-start").value;
  const end = document.getElementById("sk-end").value;
  
  const reasonHtml = document.getElementById("sk-reason").innerHTML || "";

  const formattedDateStr = formatDateObj(dateInput);
  let dateRange = "";
  if (start && end) {
    if (start === end) dateRange = `tanggal ${formatDateObj(start)}`;
    else dateRange = `mulai tanggal ${formatDateObj(start)} hingga ${formatDateObj(end)}`;
  } else if (start) {
    dateRange = `mulai tanggal ${formatDateObj(start)}`;
  } else {
    dateRange = "tanggal (Belum diisi)";
  }

  const container = document.getElementById("preview-sick-a4");
  container.innerHTML = `
    <div class="cl-body">
      <div class="cl-date" style="text-align: right; margin-bottom: 20px;">
        ${city}, ${formattedDateStr}
      </div>
      <div class="cl-to" style="margin-bottom: 30px;">
        Yth.<br>
        <b>${to}</b><br>
        ${company}
      </div>
      <div class="cl-content">
        <p style="margin-bottom: 12px; text-align: justify;">Dengan hormat,</p>
        <p style="margin-bottom: 12px; text-align: justify;">Yang bertanda tangan di bawah ini:</p>
        <table style="width: 100%; margin-bottom: 12px; margin-left: 20px;">
          <tr><td style="width: 150px; padding: 4px 0;">Nama</td><td style="width: 10px;">:</td><td>${name}</td></tr>
          <tr><td style="padding: 4px 0;">ID / NIK / NIS</td><td>:</td><td>${nik}</td></tr>
          <tr><td style="padding: 4px 0;">Jabatan / Kelas</td><td>:</td><td>${position}</td></tr>
        </table>
        <p style="margin-bottom: 12px; text-align: justify;">
          Memberitahukan bahwa saya tidak dapat hadir / masuk untuk melaksanakan aktivitas seperti biasa pada ${dateRange}.
        </p>
        <p style="margin-bottom: 12px; text-align: justify;">
          Hal tersebut dikarenakan:
        </p>
        <div style="margin-bottom: 12px; margin-left: 20px; text-align: justify;">${reasonHtml}</div>
        <p style="margin-bottom: 12px; text-align: justify;">
          Demikian surat pemberitahuan / izin ini saya sampaikan. Atas perhatian dan kebijaksanaannya, saya ucapkan terima kasih.
        </p>
      </div>
      <div class="cl-signature" style="margin-top: 50px;">
        Hormat saya,<br><br><br><br><b>${name}</b>
      </div>
    </div>
  `;
  triggerAutoSaveOther("sick");
}

function renderSignatures(mainSigs, ackSigs) {
  let html = '<div style="margin-top: 50px; width: 100%; display: flex; flex-direction: column; gap: 40px;">';
  
  if (mainSigs && mainSigs.length > 0) {
    html += '<div style="display: flex; flex-direction: column;">';
    if (mainSigs.length > 1) {
      let firstValidDate = "";
      for (let sig of mainSigs) {
        let formattedDate = sig.date ? (sig.date.includes('-') ? formatDateWithDay(sig.date) : sig.date) : "";
        if (sig.place || formattedDate) {
          firstValidDate = `<p style="margin: 0; margin-bottom: 20px; text-align: center;">${sig.place ? sig.place + ', ' : ''}${formattedDate}</p>`;
          break;
        }
      }
      html += firstValidDate;
    }

    html += '<div style="display: flex; justify-content: space-around; flex-wrap: wrap; text-align: center;">';
    mainSigs.forEach(sig => {
      let imgHtml = sig.imageBase64 ? `<img src="${sig.imageBase64}" style="max-height: 80px; display: block; margin: 0 auto; object-fit: contain;">` : `<br><br><br>`;
      let pDateHtml = "";
      if (mainSigs.length === 1) {
        let formattedDate = sig.date ? (sig.date.includes('-') ? formatDateWithDay(sig.date) : sig.date) : "";
        if (sig.place || formattedDate) {
          pDateHtml = `<p style="margin: 0; margin-bottom: 5px;">${sig.place ? sig.place + ', ' : ''}${formattedDate}</p>`;
        }
      }
      let align = sig.align || "center";
      html += `
        <div style="flex: 1; min-width: 200px; text-align: center; display: flex; flex-direction: column; align-items: ${align === 'left' ? 'flex-start' : (align === 'right' ? 'flex-end' : 'center')};">
          <div style="display: flex; flex-direction: column; align-items: center; text-align: center;">
            ${pDateHtml}
            <p style="margin: 0; margin-bottom: 5px;">${sig.position || "Jabatan"}</p>
            ${imgHtml}
            <p style="margin: 0; margin-top: 5px;"><b><u>${sig.name || "Nama"}</u></b></p>
            ${sig.nik ? `<p style="margin: 0; font-size: 14px;">${sig.nik}</p>` : ''}
          </div>
        </div>
      `;
    });
    html += '</div>';
    html += '</div>';
  }

  if (ackSigs && ackSigs.length > 0) {
    html += '<div style="display: flex; flex-direction: column;">';
    html += '<div style="text-align: center; line-height: 1.15;"><p style="margin:0;">Yang mengetahui,</p></div>';
    
    if (ackSigs.length > 1) {
      let firstValidDate = "";
      for (let sig of ackSigs) {
        let formattedDate = sig.date ? (sig.date.includes('-') ? formatDateWithDay(sig.date) : sig.date) : "";
        if (sig.place || formattedDate) {
          firstValidDate = `<p style="margin: 0; margin-bottom: 20px; line-height: 1.15; text-align: center;">${sig.place ? sig.place + ', ' : ''}${formattedDate}</p>`;
          break;
        }
      }
      html += firstValidDate;
    }

    html += '<div style="display: flex; justify-content: space-around; flex-wrap: wrap; text-align: center;">';
    ackSigs.forEach(sig => {
      let imgHtml = sig.imageBase64 ? `<img src="${sig.imageBase64}" style="max-height: 80px; display: block; margin: 0 auto; object-fit: contain;">` : `<br><br><br>`;
      let pDateHtml = "";
      if (ackSigs.length === 1) {
        let formattedDate = sig.date ? (sig.date.includes('-') ? formatDateWithDay(sig.date) : sig.date) : "";
        if (sig.place || formattedDate) {
          pDateHtml = `<p style="margin: 0; margin-bottom: 5px;">${sig.place ? sig.place + ', ' : ''}${formattedDate}</p>`;
        }
      }
      let align = sig.align || "center";
      html += `
        <div style="flex: 1; min-width: 200px; text-align: center; display: flex; flex-direction: column; align-items: ${align === 'left' ? 'flex-start' : (align === 'right' ? 'flex-end' : 'center')};">
          <div style="display: flex; flex-direction: column; align-items: center; text-align: center;">
            ${pDateHtml}
            <p style="margin: 0; margin-bottom: 5px;">${sig.position || "Jabatan"}</p>
            ${imgHtml}
            <p style="margin: 0; margin-top: 5px;"><b><u>${sig.name || "Nama"}</u></b></p>
            ${sig.nik ? `<p style="margin: 0; font-size: 14px;">${sig.nik}</p>` : ''}
          </div>
        </div>
      `;
    });
    html += '</div>';
    html += '</div>';
  }
  
  html += '</div>';
  return html;
}

function updateInvitationPreview() {
  const kopName = document.getElementById("inv-kop-name").value || "Nama Instansi";
  const kopAddr = document.getElementById("inv-kop-address").value || "Alamat Instansi";
  const kopContact = document.getElementById("inv-kop-contact").value || "Kontak Instansi";
  
  const number = document.getElementById("inv-number").value || "-";
  const attachment = document.getElementById("inv-attachment").value || "-";
  const subject = document.getElementById("inv-subject").value || "Perihal Undangan";
  const dateInput = document.getElementById("inv-date-input").value;
  const city = document.getElementById("inv-city").value || "Kota";
  const to = document.getElementById("inv-to").value || "Nama/Instansi Tujuan";
  const toPlace = document.getElementById("inv-to-place").value || "Tempat";
  
  const opening = document.getElementById("inv-opening").value || "Dengan hormat,";
  const eventDate = document.getElementById("inv-event-date").value || "Senin, 1 Januari 2026";
  const eventTime = document.getElementById("inv-event-time").value || "09.00 - Selesai";
  const eventPlace = document.getElementById("inv-event-place").value || "Ruang Rapat";
  const closing = document.getElementById("inv-closing").value || "Demikian undangan ini kami sampaikan...";
  const cc = document.getElementById("inv-cc").value;
  
  const formattedDateStr = formatDateWithDay(dateInput);
  
  const mainSigs = getSignatureData("inv", "main");
  const ackSigs = getSignatureData("inv", "ack");
  
  const logoDataEl = document.getElementById("inv-kop-logo-data");
  const logoData = logoDataEl ? logoDataEl.value : "";
  const logoRightDataEl = document.getElementById("inv-kop-logo-right-data");
  const logoRightData = logoRightDataEl ? logoRightDataEl.value : "";
  
  let kopHtml = "";
  if (logoData || logoRightData) {
    let leftImg = logoData ? `<img src="${logoData}" style="max-height: 80px; max-width: 80px; margin-right: 20px; object-fit: contain;">` : `<div style="width: 100px;"></div>`;
    let rightImg = logoRightData ? `<img src="${logoRightData}" style="max-height: 80px; max-width: 80px; margin-left: 20px; object-fit: contain;">` : `<div style="width: 100px;"></div>`;
    
    kopHtml = `
      <div style="display: flex; align-items: center; justify-content: center; border-bottom: 3px solid #000; padding-bottom: 10px; margin-bottom: 20px;">
        ${leftImg}
        <div style="text-align: center; flex: 1;">
          <h2 style="margin: 0; font-size: 20px; text-transform: uppercase;"><b>${kopName}</b></h2>
          <p style="margin: 5px 0; font-size: 14px;">${kopAddr}</p>
          <p style="margin: 0; font-size: 12px;">${kopContact}</p>
        </div>
        ${rightImg}
      </div>
    `;
  } else {
    kopHtml = `
      <div style="border-bottom: 3px solid #000; padding-bottom: 10px; margin-bottom: 20px; text-align: center;">
        <h2 style="margin: 0; font-size: 20px; text-transform: uppercase;"><b>${kopName}</b></h2>
        <p style="margin: 5px 0; font-size: 14px;">${kopAddr}</p>
        <p style="margin: 0; font-size: 12px;">${kopContact}</p>
      </div>
    `;
  }

  const container = document.getElementById("preview-invitation-a4");
  container.innerHTML = `
    ${kopHtml}
    
    <div style="display: flex; justify-content: space-between; margin-bottom: 20px;">
      <div>
        <table style="width: 100%;">
          <tr><td style="padding: 2px 0; width: 80px;">Nomor</td><td style="width: 10px;">:</td><td>${number}</td></tr>
          <tr><td style="padding: 2px 0;">Lampiran</td><td>:</td><td>${attachment}</td></tr>
          <tr><td style="padding: 2px 0;">Perihal</td><td>:</td><td><b>${subject}</b></td></tr>
        </table>
      </div>
      <div style="text-align: right;">
        ${city}, ${formattedDateStr}
      </div>
    </div>
    
    <div style="margin-bottom: 20px;">
      Kepada Yth,<br>
      <b>${to}</b><br>
      di ${toPlace}
    </div>
    
    <div style="margin-bottom: 20px; text-align: justify; white-space: pre-line;">
      ${opening}
    </div>
    
    <div style="margin-bottom: 20px; margin-left: 30px;">
      <table style="width: 100%;">
        <tr><td style="padding: 4px 0; width: 120px;">Hari/Tanggal</td><td style="width: 10px;">:</td><td><b>${eventDate}</b></td></tr>
        <tr><td style="padding: 4px 0;">Waktu</td><td>:</td><td>${eventTime}</td></tr>
        <tr><td style="padding: 4px 0;">Tempat</td><td>:</td><td>${eventPlace}</td></tr>
      </table>
    </div>
    
    <div style="margin-bottom: 40px; text-align: justify; white-space: pre-line;">
      ${closing}
    </div>
    
    ${renderSignatures(mainSigs, ackSigs)}
    
    ${cc ? `<div style="margin-top: 30px; text-align: left;">
      <p style="margin: 0; font-weight: bold;">Tembusan:</p>
      <div style="white-space: pre-line;">${cc}</div>
    </div>` : ''}
  `;
  triggerAutoSaveOther("invitation");
}

function updateNotificationPreview() {
  const kopName = document.getElementById("notif-kop-name").value || "Nama Instansi";
  const kopAddr = document.getElementById("notif-kop-address").value || "Alamat Instansi";
  const kopContact = document.getElementById("notif-kop-contact").value || "Kontak Instansi";
  
  const number = document.getElementById("notif-number").value || "-";
  const attachment = document.getElementById("notif-attachment").value || "-";
  const subject = document.getElementById("notif-subject").value || "Perihal Surat";
  const dateInput = document.getElementById("notif-date-input").value;
  const city = document.getElementById("notif-city").value || "Kota";
  const to = document.getElementById("notif-to").value || "Nama/Instansi Tujuan";
  const toPlace = document.getElementById("notif-to-place").value || "Tempat";
  
  const opening = document.getElementById("notif-opening").value || "Dengan hormat,";
  const content = document.getElementById("notif-content").innerHTML || "";
  const closing = document.getElementById("notif-closing").value || "Demikian surat ini...";
  const cc = document.getElementById("notif-cc").value;
  
  const formattedDateStr = formatDateWithDay(dateInput);
  
  const mainSigs = getSignatureData("notif", "main");
  const ackSigs = getSignatureData("notif", "ack");
  
  const logoDataEl = document.getElementById("notif-kop-logo-data");
  const logoData = logoDataEl ? logoDataEl.value : "";
  const logoRightDataEl = document.getElementById("notif-kop-logo-right-data");
  const logoRightData = logoRightDataEl ? logoRightDataEl.value : "";
  
  let kopHtml = "";
  if (logoData || logoRightData) {
    let leftImg = logoData ? `<img src="${logoData}" style="max-height: 80px; max-width: 80px; margin-right: 20px; object-fit: contain;">` : `<div style="width: 100px;"></div>`;
    let rightImg = logoRightData ? `<img src="${logoRightData}" style="max-height: 80px; max-width: 80px; margin-left: 20px; object-fit: contain;">` : `<div style="width: 100px;"></div>`;
    
    kopHtml = `
      <div style="display: flex; align-items: center; justify-content: center; border-bottom: 3px solid #000; padding-bottom: 10px; margin-bottom: 20px;">
        ${leftImg}
        <div style="text-align: center; flex: 1;">
          <h2 style="margin: 0; font-size: 20px; text-transform: uppercase;"><b>${kopName}</b></h2>
          <p style="margin: 5px 0; font-size: 14px;">${kopAddr}</p>
          <p style="margin: 0; font-size: 12px;">${kopContact}</p>
        </div>
        ${rightImg}
      </div>
    `;
  } else {
    kopHtml = `
      <div style="border-bottom: 3px solid #000; padding-bottom: 10px; margin-bottom: 20px; text-align: center;">
        <h2 style="margin: 0; font-size: 20px; text-transform: uppercase;"><b>${kopName}</b></h2>
        <p style="margin: 5px 0; font-size: 14px;">${kopAddr}</p>
        <p style="margin: 0; font-size: 12px;">${kopContact}</p>
      </div>
    `;
  }

  const container = document.getElementById("preview-notification-a4");
  container.innerHTML = `
    ${kopHtml}
    
    <div style="display: flex; justify-content: space-between; margin-bottom: 20px;">
      <div>
        <table style="width: 100%;">
          <tr><td style="padding: 2px 0; width: 80px;">Nomor</td><td style="width: 10px;">:</td><td>${number}</td></tr>
          <tr><td style="padding: 2px 0;">Lampiran</td><td>:</td><td>${attachment}</td></tr>
          <tr><td style="padding: 2px 0;">Perihal</td><td>:</td><td><b>${subject}</b></td></tr>
        </table>
      </div>
      <div style="text-align: right;">
        ${city}, ${formattedDateStr}
      </div>
    </div>
    
    <div style="margin-bottom: 20px;">
      Kepada Yth,<br>
      <b>${to}</b><br>
      di ${toPlace}
    </div>
    
    <div style="margin-bottom: 20px; text-align: justify; white-space: pre-line;">
      ${opening}
    </div>
    
    <div style="margin-bottom: 20px; margin-left: 20px; text-align: justify;">
      ${content}
    </div>
    
    <div style="margin-bottom: 40px; text-align: justify; white-space: pre-line;">
      ${closing}
    </div>
    
    ${renderSignatures(mainSigs, ackSigs)}
    
    ${cc ? `<div style="margin-top: 30px; text-align: left;">
      <p style="margin: 0; font-weight: bold;">Tembusan:</p>
      <div style="white-space: pre-line;">${cc}</div>
    </div>` : ''}
  `;
  triggerAutoSaveOther("notification");
}

