let cvData = [];
let letterData = [];
let otherLetterData = [];

try {
  cvData = JSON.parse(localStorage.getItem("progen_cvs")) || [];
  letterData = JSON.parse(localStorage.getItem("progen_letters")) || [];
  otherLetterData =
    JSON.parse(localStorage.getItem("progen_other_letters")) || [];
} catch (e) {
  console.error("Gagal memuat database lokal, melakukan reset:", e);
  cvData = [];
  letterData = [];
  otherLetterData = [];
}

function exportData() {
  const data = {
    cvs: cvData,
    letters: letterData,
    others: otherLetterData,
    exportDate: new Date().toISOString(),
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `SmartDocPro_Backup_${new Date().getTime()}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  showToast("File JSON berhasil diunduh!", "success");
}

function importData(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function (e) {
    try {
      const imported = JSON.parse(e.target.result);
      if (imported.cvs || imported.letters || imported.others) {
        const mergeData = (localArray, importedArray) => {
          if (!importedArray || !Array.isArray(importedArray))
            return localArray;
          let merged = [...localArray];
          importedArray.forEach((impItem) => {
            const existingIndex = merged.findIndex(
              (locItem) => locItem.id === impItem.id,
            );
            if (existingIndex > -1) {
              merged[existingIndex] = impItem;
            } else {
              merged.push(impItem);
            }
          });
          return merged;
        };

        cvData = mergeData(cvData, imported.cvs);
        letterData = mergeData(letterData, imported.letters);
        otherLetterData = mergeData(otherLetterData, imported.others);

        localStorage.setItem("progen_cvs", JSON.stringify(cvData));
        localStorage.setItem("progen_letters", JSON.stringify(letterData));
        localStorage.setItem(
          "progen_other_letters",
          JSON.stringify(otherLetterData),
        );

        updateDashboardStats();
        renderCVHistory();
        renderLetterHistory();
        renderOtherHistory();
        showToast(
          "Data cadangan berhasil digabungkan (Merge) dengan data saat ini!",
          "success",
        );
      } else {
        showToast("Format file backup tidak dikenali oleh sistem.", "error");
      }
    } catch (err) {
      showToast("Gagal memulihkan. File JSON rusak atau korup.", "error");
    }
    event.target.value = "";
  };
  reader.readAsText(file);
}

function getUniqueName(originalName, dataArray, currentId) {
  let maxCount = 0;
  let hasExactMatch = false;
  const escapedName = originalName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const nameRegex = new RegExp(`^${escapedName}(?: \\((\\d+)\\))?$`);
  dataArray.forEach((item) => {
    if (item.id === currentId) return;
    if (item.name === originalName) hasExactMatch = true;
    let match = item.name.match(nameRegex);
    if (match && match[1]) {
      let num = parseInt(match[1], 10);
      if (num > maxCount) maxCount = num;
    }
  });
  if (hasExactMatch || maxCount > 0) {
    return `${originalName} (${Math.max(2, maxCount + 1)})`;
  }
  return originalName;
}

function saveCV(isAutoSave = false) {
  const idInput = document.getElementById("cv-id").value;
  const generatedId = idInput || generateId();

  const nameVal = document.getElementById("cv-name").value.trim();
  const emailVal = document.getElementById("cv-email").value.trim();
  const phoneVal = document.getElementById("cv-phone").value.trim();

  if (!nameVal) {
    if (!isAutoSave) showToast("Nama Lengkap wajib diisi!", "error");
    else document.getElementById("cv-autosave-indicator").innerText = "";
    return;
  }

  if (!isAutoSave) {
    if (emailVal && !validateEmail(emailVal)) {
      showToast("Format Email tidak valid!", "error");
      return;
    }
    if (phoneVal && !validatePhone(phoneVal)) {
      showToast(
        "Format Nomor Telepon tidak valid! (Min. 8 digit numerik)",
        "error",
      );
      return;
    }

    const dynamicSections = [
      "education",
      "experience",
      "project",
      "org",
      "cert",
    ];
    for (let sec of dynamicSections) {
      const dataArray = getDynamicData(sec);
      for (let item of dataArray) {
        if (item.start && item.end && !validateDates(item.start, item.end)) {
          showToast(
            `Rentang tanggal tidak logis pada bagian ${sec.toUpperCase()}!`,
            "error",
          );
          return;
        }
      }
    }
  }

  let summaryHtml = document.getElementById("cv-summary").innerHTML.trim();
  if (summaryHtml === "<br>") summaryHtml = "";

  const uniqueName = getUniqueName(nameVal, cvData, generatedId);

  const cvObj = {
    id: generatedId,
    name: uniqueName,
    date: new Date().toISOString(),
    form: {
      header: {
        name: nameVal,
        email: emailVal,
        phone: phoneVal,
        address: document.getElementById("cv-address").value,
        linkedin: document.getElementById("cv-linkedin").value,
        portfolio: document.getElementById("cv-portfolio").value,
        summary: summaryHtml,
        photo: currentProfilePic,
        qrcode: currentQrCode,
      },
      education: getDynamicData("education"),
      experience: getDynamicData("experience"),
      project: getDynamicData("project"),
      org: getDynamicData("org"),
      cert: getDynamicData("cert"),
      skillList: getSkillData("skill"),
      languageList: getSkillData("language"),
    },
  };

  if (idInput) {
    const idx = cvData.findIndex((c) => c.id === idInput);
    if (idx > -1) cvData[idx] = cvObj;
  } else {
    cvData.push(cvObj);
    document.getElementById("cv-id").value = generatedId;
  }

  try {
    localStorage.setItem("progen_cvs", JSON.stringify(cvData));
    updateDashboardStats();
    renderCVHistory();

    if (isAutoSave) {
      const timeStr = new Date().toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
      });
      document.getElementById("cv-autosave-indicator").innerText =
        `Tersimpan otomatis ${timeStr}`;
    } else {
      showToast("Data CV berhasil disimpan dengan aman!", "success");
      const indicator = document.getElementById("cv-autosave-indicator");
      if (indicator) indicator.innerText = "";
    }
  } catch (e) {
    if (!isAutoSave)
      showToast(
        "Gagal menyimpan data. Pastikan memori browser tidak penuh.",
        "error",
      );
    console.error(e);
  }
}

function deleteCV(id) {
  if (confirm("Anda yakin ingin menghapus CV ini secara permanen?")) {
    cvData = cvData.filter((c) => c.id !== id);
    localStorage.setItem("progen_cvs", JSON.stringify(cvData));
    updateDashboardStats();
    renderCVHistory();
    showToast("Dokumen CV telah dihapus.", "success");
  }
}

function saveLetter(isAutoSave = false) {
  const idInput = document.getElementById("cl-id").value;
  const generatedId = idInput || generateId();

  const nameVal = document.getElementById("cl-name").value.trim();
  const emailVal = document.getElementById("cl-email").value.trim();
  const phoneVal = document.getElementById("cl-phone").value.trim();

  if (!nameVal) {
    if (!isAutoSave) showToast("Nama Lengkap pelamar wajib diisi!", "error");
    else document.getElementById("cl-autosave-indicator").innerText = "";
    return;
  }

  if (!isAutoSave) {
    if (emailVal && !validateEmail(emailVal)) {
      showToast("Format Email pelamar tidak valid!", "error");
      return;
    }
    if (phoneVal && !validatePhone(phoneVal)) {
      showToast("Format Nomor Telepon pelamar tidak valid!", "error");
      return;
    }
  }

  let p1Html = document.getElementById("cl-p1").innerHTML.trim();
  if (p1Html === "<br>") p1Html = "";
  let p3Html = document.getElementById("cl-p3").innerHTML.trim();
  if (p3Html === "<br>") p3Html = "";
  let p4Html = document.getElementById("cl-p4").innerHTML.trim();
  if (p4Html === "<br>") p4Html = "";
  let p5Html = document.getElementById("cl-p5").innerHTML.trim();
  if (p5Html === "<br>") p5Html = "";

  const letterObj = {
    id: generatedId,
    name: nameVal,
    subject: document.getElementById("cl-subject").value,
    date: new Date().toISOString(),
    form: {
      city: document.getElementById("cl-city").value,
      dateInput: document.getElementById("cl-date-input").value,
      subject: document.getElementById("cl-subject").value,
      position: document.getElementById("cl-position").value,
      attachment: document.getElementById("cl-attachment").value,
      to: document.getElementById("cl-to").value,
      companyStreet: document.getElementById("cl-company-street").value,
      companyCity: document.getElementById("cl-company-city").value,
      companyZip: document.getElementById("cl-company-zip").value,
      name: nameVal,
      phone: phoneVal,
      email: emailVal,
      address: document.getElementById("cl-address").value,
      univ: document.getElementById("cl-univ").value,
      major: document.getElementById("cl-major").value,
      p1: p1Html,
      p3: p3Html,
      p4: p4Html,
      p5: p5Html,
    },
  };

  if (idInput) {
    const idx = letterData.findIndex((l) => l.id === idInput);
    if (idx > -1) letterData[idx] = letterObj;
  } else {
    letterData.push(letterObj);
    document.getElementById("cl-id").value = generatedId;
  }

  try {
    localStorage.setItem("progen_letters", JSON.stringify(letterData));
    updateDashboardStats();
    renderLetterHistory();

    if (isAutoSave) {
      const timeStr = new Date().toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
      });
      document.getElementById("cl-autosave-indicator").innerText =
        `Tersimpan otomatis ${timeStr}`;
    } else {
      showToast("Surat Lamaran berhasil disimpan!", "success");
      const indicator = document.getElementById("cl-autosave-indicator");
      if (indicator) indicator.innerText = "";
    }
  } catch (e) {
    if (!isAutoSave)
      showToast("Gagal menyimpan data. Memori mungkin penuh.", "error");
    console.error(e);
  }
}

function deleteLetter(id) {
  if (
    confirm("Anda yakin ingin menghapus Surat Lamaran ini secara permanen?")
  ) {
    letterData = letterData.filter((l) => l.id !== id);
    localStorage.setItem("progen_letters", JSON.stringify(letterData));
    updateDashboardStats();
    renderLetterHistory();
    showToast("Surat Lamaran telah dihapus.", "success");
  }
}

function saveOtherLetter(type, isAutoSave = false) {
  let idInput = "";
  let nameVal = "";
  let indicatorId = "";
  let subject = "";
  let formObj = {};

  if (type === "leave") {
    idInput = document.getElementById("lv-id").value;
    nameVal = document.getElementById("lv-name").value.trim();
    indicatorId = "lv-autosave-indicator";
    subject = "Surat Permohonan Cuti";
    let reasonHtml = document.getElementById("lv-reason").innerHTML.trim();
    if (reasonHtml === "<br>") reasonHtml = "";
    formObj = {
      city: document.getElementById("lv-city").value,
      dateInput: document.getElementById("lv-date-input").value,
      to: document.getElementById("lv-to").value,
      company: document.getElementById("lv-company").value,
      name: nameVal,
      nik: document.getElementById("lv-nik").value,
      position: document.getElementById("lv-position").value,
      department: document.getElementById("lv-department").value,
      start: document.getElementById("lv-start").value,
      end: document.getElementById("lv-end").value,
      reason: reasonHtml,
    };
  } else if (type === "resign") {
    idInput = document.getElementById("rs-id").value;
    nameVal = document.getElementById("rs-name").value.trim();
    indicatorId = "rs-autosave-indicator";
    subject = "Surat Pengunduran Diri (Resign)";
    let reasonHtml = document.getElementById("rs-reason").innerHTML.trim();
    if (reasonHtml === "<br>") reasonHtml = "";
    formObj = {
      city: document.getElementById("rs-city").value,
      dateInput: document.getElementById("rs-date-input").value,
      to: document.getElementById("rs-to").value,
      company: document.getElementById("rs-company").value,
      name: nameVal,
      position: document.getElementById("rs-position").value,
      department: document.getElementById("rs-department").value,
      effective: document.getElementById("rs-effective").value,
      reason: reasonHtml,
    };
  } else if (type === "sick") {
    idInput = document.getElementById("sk-id").value;
    nameVal = document.getElementById("sk-name").value.trim();
    indicatorId = "sk-autosave-indicator";
    subject = "Surat Izin / Sakit";
    let reasonHtml = document.getElementById("sk-reason").innerHTML.trim();
    if (reasonHtml === "<br>") reasonHtml = "";
    formObj = {
      city: document.getElementById("sk-city").value,
      dateInput: document.getElementById("sk-date-input").value,
      to: document.getElementById("sk-to").value,
      company: document.getElementById("sk-company").value,
      name: nameVal,
      nik: document.getElementById("sk-nik").value,
      position: document.getElementById("sk-position").value,
      start: document.getElementById("sk-start").value,
      end: document.getElementById("sk-end").value,
      reason: reasonHtml,
    };
  } else if (type === "invitation") {
    idInput = document.getElementById("inv-id").value;
    const kopNameInput = document.getElementById("inv-kop-name").value.trim();
    nameVal = kopNameInput || "Surat Undangan";
    indicatorId = "inv-autosave-indicator";
    subject = document.getElementById("inv-subject").value || "Surat Undangan";
    formObj = {
      kopName: document.getElementById("inv-kop-name").value,
      kopLogo: document.getElementById("inv-kop-logo-data") ? document.getElementById("inv-kop-logo-data").value : "",
      kopLogoRight: document.getElementById("inv-kop-logo-right-data") ? document.getElementById("inv-kop-logo-right-data").value : "",
      kopAddress: document.getElementById("inv-kop-address").value,
      kopContact: document.getElementById("inv-kop-contact").value,
      number: document.getElementById("inv-number").value,
      attachment: document.getElementById("inv-attachment").value,
      subject: document.getElementById("inv-subject").value,
      dateInput: document.getElementById("inv-date-input").value,
      city: document.getElementById("inv-city").value,
      to: document.getElementById("inv-to").value,
      toPlace: document.getElementById("inv-to-place").value,
      opening: document.getElementById("inv-opening").value,
      eventDate: document.getElementById("inv-event-date").value,
      eventTime: document.getElementById("inv-event-time").value,
      eventPlace: document.getElementById("inv-event-place").value,
      closing: document.getElementById("inv-closing").value,
      mainSigs: getSignatureData("inv", "main"),
      ackSigs: getSignatureData("inv", "ack"),
      cc: document.getElementById("inv-cc").value,
    };
  } else if (type === "notification") {
    idInput = document.getElementById("notif-id").value;
    const kopNameInput = document.getElementById("notif-kop-name").value.trim();
    nameVal = kopNameInput || "Surat Pemberitahuan";
    indicatorId = "notif-autosave-indicator";
    subject = document.getElementById("notif-subject").value || "Surat Pemberitahuan";
    let contentHtml = document.getElementById("notif-content").innerHTML.trim();
    if (contentHtml === "<br>") contentHtml = "";
    formObj = {
      kopName: document.getElementById("notif-kop-name").value,
      kopLogo: document.getElementById("notif-kop-logo-data") ? document.getElementById("notif-kop-logo-data").value : "",
      kopLogoRight: document.getElementById("notif-kop-logo-right-data") ? document.getElementById("notif-kop-logo-right-data").value : "",
      kopAddress: document.getElementById("notif-kop-address").value,
      kopContact: document.getElementById("notif-kop-contact").value,
      number: document.getElementById("notif-number").value,
      attachment: document.getElementById("notif-attachment").value,
      subject: document.getElementById("notif-subject").value,
      dateInput: document.getElementById("notif-date-input").value,
      city: document.getElementById("notif-city").value,
      to: document.getElementById("notif-to").value,
      toPlace: document.getElementById("notif-to-place").value,
      opening: document.getElementById("notif-opening").value,
      content: contentHtml,
      closing: document.getElementById("notif-closing").value,
      mainSigs: getSignatureData("notif", "main"),
      ackSigs: getSignatureData("notif", "ack"),
      cc: document.getElementById("notif-cc").value,
    };
  }

  const generatedId = idInput || generateId();

  if (!nameVal && (type === "leave" || type === "resign" || type === "sick")) {
    if (!isAutoSave) showToast("Nama Lengkap wajib diisi!", "error");
    else {
      const ind = document.getElementById(indicatorId);
      if(ind) ind.innerText = "";
    }
    return;
  }

  if ((type === "invitation" || type === "notification")) {
    const isKopEmpty = type === "invitation" ? !document.getElementById("inv-kop-name").value.trim() : !document.getElementById("notif-kop-name").value.trim();
    if (isKopEmpty) {
      if (!isAutoSave) showToast("Nama Instansi / Organisasi wajib diisi!", "error");
      else {
        const ind = document.getElementById(indicatorId);
        if(ind) ind.innerText = "";
      }
      return;
    }
  }

  if (!isAutoSave && (type === "leave" || type === "sick")) {
    const startVal = document.getElementById(type === "leave" ? "lv-start" : "sk-start").value;
    const endVal = document.getElementById(type === "leave" ? "lv-end" : "sk-end").value;
    if (startVal && endVal && !validateDates(startVal, endVal)) {
      showToast(
        "Tanggal Selesai tidak logis karena mendahului Tanggal Mulai!",
        "error",
      );
      return;
    }
  }

  let letterObj = {
    id: generatedId,
    type: type,
    name: nameVal,
    subject: subject,
    date: new Date().toISOString(),
    form: formObj,
  };

  if (idInput) {
    const idx = otherLetterData.findIndex((l) => l.id === idInput);
    if (idx > -1) otherLetterData[idx] = letterObj;
  } else {
    otherLetterData.push(letterObj);
    if (type === "leave") document.getElementById("lv-id").value = generatedId;
    else if (type === "resign") document.getElementById("rs-id").value = generatedId;
    else if (type === "sick") document.getElementById("sk-id").value = generatedId;
    else if (type === "invitation") document.getElementById("inv-id").value = generatedId;
    else if (type === "notification") document.getElementById("notif-id").value = generatedId;
  }

  try {
    localStorage.setItem(
      "progen_other_letters",
      JSON.stringify(otherLetterData),
    );
    updateDashboardStats();
    renderOtherHistory();

    if (isAutoSave) {
      const timeStr = new Date().toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
      });
      const ind = document.getElementById(indicatorId);
      if(ind) ind.innerText = `Tersimpan otomatis ${timeStr}`;
    } else {
      showToast("Surat Administrasi berhasil diarsipkan!", "success");
      const indicator = document.getElementById(indicatorId);
      if (indicator) indicator.innerText = "";
    }
  } catch (e) {
    if (!isAutoSave)
      showToast("Proses arsip gagal karena masalah memori cache.", "error");
    console.error(e);
  }
}

function deleteOtherLetter(id) {
  if (
    confirm(
      "Anda yakin ingin menghapus surat administrasi ini secara permanen?",
    )
  ) {
    otherLetterData = otherLetterData.filter((l) => l.id !== id);
    localStorage.setItem(
      "progen_other_letters",
      JSON.stringify(otherLetterData),
    );
    updateDashboardStats();
    renderOtherHistory();
    showToast("Arsip surat berhasil dihapus.", "success");
  }
}
