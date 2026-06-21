function downloadPDF(elementId, filenamePrefix) {
  const element = document.getElementById(elementId);
  let nameField = "Document";

  if (elementId === "preview-cv-a4")
    nameField = document.getElementById("cv-name").value;
  else if (elementId === "preview-letter-a4") {
    let name = document.getElementById("cl-name").value;
    let posEl = document.getElementById("cl-position");
    let pos = posEl ? posEl.value : "";
    nameField = pos ? `${name}_${pos}` : name;
  } else if (elementId === "preview-leave-a4")
    nameField = document.getElementById("lv-name").value;
  else if (elementId === "preview-resign-a4")
    nameField = document.getElementById("rs-name").value;

  const finalName = nameField ? nameField.replace(/\s+/g, "_") : "Document";
  executeExport(
    element.innerHTML,
    filenamePrefix,
    finalName,
    event.currentTarget,
  );
}

function downloadCVFromHistory(id, btnElement) {
  const cv = cvData.find((c) => c.id === id);
  if (!cv) return;
  executeExport(buildSavedCVHTML(cv.form), "CV_ATS", cv.name, btnElement);
}

function downloadLetterFromHistory(id, btnElement) {
  const cl = letterData.find((l) => l.id === id);
  if (!cl) return;
  let finalName = cl.name;
  if (cl.form && cl.form.position) {
    finalName = `${cl.name}_${cl.form.position}`;
  }
  executeExport(
    buildSavedLetterHTML(cl.form),
    "Surat_Lamaran",
    finalName,
    btnElement,
  );
}

function downloadOtherFromHistory(id, btnElement) {
  const item = otherLetterData.find((l) => l.id === id);
  if (!item) return;
  if (item.type === "leave") {
    executeExport(
      buildSavedLeaveHTML(item.form),
      "Surat_Cuti",
      item.name,
      btnElement,
    );
  } else {
    executeExport(
      buildSavedResignHTML(item.form),
      "Surat_Resign",
      item.name,
      btnElement,
    );
  }
}

function executeExport(htmlContent, filenamePrefix, name, btn) {
  const finalName = name ? name.replace(/\s+/g, "_") : "Document";
  const documentTitle = `${filenamePrefix}_${finalName}`;

  let originalHTML = "";
  if (btn) {
    originalHTML = btn.innerHTML;
    btn.innerHTML =
      '<i class="fa-solid fa-spinner fa-spin mr-1"></i> Menyiapkan...';
    btn.disabled = true;
  }

  const printContainer = document.getElementById("print-content");
  printContainer.innerHTML = htmlContent;

  const originalTitle = document.title;

  setTimeout(() => {
    document.title = documentTitle;
    window.print();
    document.title = originalTitle;

    if (btn) {
      btn.innerHTML = originalHTML;
      btn.disabled = false;
    }
  }, 300);
}

function downloadDOCX(elementId, filenamePrefix) {
  const element = document.getElementById(elementId);
  let nameField = "Document";

  if (elementId === "preview-cv-a4")
    nameField = document.getElementById("cv-name").value;
  else if (elementId === "preview-letter-a4") {
    let name = document.getElementById("cl-name").value;
    let posEl = document.getElementById("cl-position");
    let pos = posEl ? posEl.value : "";
    nameField = pos ? `${name}_${pos}` : name;
  } else if (elementId === "preview-leave-a4")
    nameField = document.getElementById("lv-name").value;
  else if (elementId === "preview-resign-a4")
    nameField = document.getElementById("rs-name").value;

  const finalName = nameField ? nameField.replace(/\s+/g, "_") : "Document";
  executeDocxExport(
    element.innerHTML,
    filenamePrefix,
    finalName,
    event.currentTarget,
  );
}

function downloadDocxCVFromHistory(id, btnElement) {
  const cv = cvData.find((c) => c.id === id);
  if (!cv) return;
  executeDocxExport(buildSavedCVHTML(cv.form), "CV_ATS", cv.name, btnElement);
}

function downloadDocxLetterFromHistory(id, btnElement) {
  const cl = letterData.find((l) => l.id === id);
  if (!cl) return;
  let finalName = cl.name;
  if (cl.form && cl.form.position) {
    finalName = `${cl.name}_${cl.form.position}`;
  }
  executeDocxExport(
    buildSavedLetterHTML(cl.form),
    "Surat_Lamaran",
    finalName,
    btnElement,
  );
}

function downloadDocxOtherFromHistory(id, btnElement) {
  const item = otherLetterData.find((l) => l.id === id);
  if (!item) return;
  if (item.type === "leave") {
    executeDocxExport(
      buildSavedLeaveHTML(item.form),
      "Surat_Cuti",
      item.name,
      btnElement,
    );
  } else {
    executeDocxExport(
      buildSavedResignHTML(item.form),
      "Surat_Resign",
      item.name,
      btnElement,
    );
  }
}

function executeDocxExport(htmlContent, filenamePrefix, name, btn) {
  const finalName = name ? name.replace(/\s+/g, "_") : "Document";
  const documentTitle = `${filenamePrefix}_${finalName}.docx`;

  let originalHTML = "";
  if (btn) {
    originalHTML = btn.innerHTML;
    btn.innerHTML =
      '<i class="fa-solid fa-spinner fa-spin mr-1"></i> Memproses...';
    btn.disabled = true;
  }

  const tempDiv = document.createElement("div");
  tempDiv.innerHTML = htmlContent;

  const flexHeaders = tempDiv.querySelectorAll(
    ".ats-item-header, .ats-item-sub",
  );
  flexHeaders.forEach((el) => {
    const spans = el.querySelectorAll("span");
    if (spans.length === 2) {
      const table = document.createElement("table");
      table.style.width = "100%";
      table.style.borderCollapse = "collapse";
      table.style.marginBottom = el.classList.contains("ats-item-header")
        ? "2px"
        : "5px";

      let weightStr = el.classList.contains("ats-item-header")
        ? "font-weight: bold;"
        : "";

      table.innerHTML = `<tr>
                <td style="text-align: left; padding: 0; vertical-align: top; ${weightStr} font-size: 10pt;">${spans[0].innerHTML}</td>
                <td style="text-align: right; padding: 0; vertical-align: top; font-weight: bold; font-size: 10pt;">${spans[1].innerHTML}</td>
            </tr>`;
      el.parentNode.replaceChild(table, el);
    }
  });

  const cvHeader = tempDiv.querySelector('div[style*="display: flex"]');
  if (cvHeader) {
    const table = document.createElement("table");
    table.style.width = "100%";
    table.style.borderCollapse = "collapse";
    table.style.marginBottom = "15px";

    let trHtml = "<tr>";
    const children = Array.from(cvHeader.children);
    children.forEach((child) => {
      let align = "center";
      let width = "auto";
      if (child.tagName.toLowerCase() === "img") {
        width = "90px";
      } else {
        width = "100%";
        align = "left";
      }
      trHtml += `<td style="vertical-align: middle; text-align: ${align}; width: ${width}; padding: 0 10px;">${child.outerHTML}</td>`;
    });
    trHtml += "</tr>";
    table.innerHTML = trHtml;
    cvHeader.parentNode.replaceChild(table, cvHeader);
  }

  const cleanHtmlContent = tempDiv.innerHTML;

  const preHtml = `<!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>Export</title>
        <style>
            body { font-family: "Arial", sans-serif; font-size: 10pt; color: black; }
            .ats-name { font-size: 16pt; font-weight: bold; text-align: center; margin-bottom: 5px; text-transform: uppercase; }
            .ats-contact { font-size: 10pt; text-align: center; margin-bottom: 15px; }
            .ats-section-title { font-size: 11pt; font-weight: bold; border-bottom: 1pt solid black; padding-bottom: 2px; margin-top: 15px; margin-bottom: 10px; text-transform: uppercase; }
            .ats-desc { font-size: 10pt; text-align: justify; margin-bottom: 10px; }
            ul { margin-top: 0; padding-left: 20px; list-style-type: disc; }
            li { margin-bottom: 2px; }
            .cl-header { text-align: right; margin-bottom: 20px; }
            .cl-recipient { margin-bottom: 20px; }
            .cl-body { text-align: justify; line-height: 1.5; margin-bottom: 15px; }
            .cl-signature { margin-top: 15px; }
        </style>
    </head>
    <body>`;

  const postHtml = "</body></html>";
  const fullHtml = preHtml + cleanHtmlContent + postHtml;

  try {
    const converted = htmlDocx.asBlob(fullHtml, {
      orientation: "portrait",
      margins: { top: 1134, right: 1134, bottom: 1134, left: 1134 },
    });

    saveAs(converted, documentTitle);

    if (typeof showToast === "function") {
      showToast("Dokumen berhasil diekspor ke format DOCX!", "success");
    }
  } catch (error) {
    console.error("Docx Export Error:", error);
    if (typeof showToast === "function") {
      showToast("Gagal mengekspor dokumen ke DOCX.", "error");
    }
  }

  if (btn) {
    btn.innerHTML = originalHTML;
    btn.disabled = false;
  }
}
