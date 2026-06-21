let mergeFiles = [];
let draggedIndex = null;

let splitFile = null;
let splitPdfDoc = null;
let totalPages = 0;

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

function switchTool(tool) {
  document.getElementById("view-merge").classList.add("hidden");
  document.getElementById("view-split").classList.add("hidden");

  document.getElementById("tab-merge").className =
    "px-5 py-2.5 font-semibold text-sm lg:text-base rounded-t-lg text-gray-500 hover:bg-gray-100 transition-colors";
  document.getElementById("tab-split").className =
    "px-5 py-2.5 font-semibold text-sm lg:text-base rounded-t-lg text-gray-500 hover:bg-gray-100 transition-colors";

  if (tool === "merge") {
    document.getElementById("view-merge").classList.remove("hidden");
    document.getElementById("tab-merge").className =
      "px-5 py-2.5 font-semibold text-sm lg:text-base rounded-t-lg bg-blue-100 text-primary transition-colors";
  } else {
    document.getElementById("view-split").classList.remove("hidden");
    document.getElementById("tab-split").className =
      "px-5 py-2.5 font-semibold text-sm lg:text-base rounded-t-lg bg-blue-100 text-primary transition-colors";
  }
}

function handleMergeSelection(event) {
  const files = Array.from(event.target.files);
  if (files.length === 0) return;

  files.forEach((file) => {
    if (file.type === "application/pdf") {
      mergeFiles.push(file);
    } else {
      showToast("Sistem mendeteksi file non-PDF dan menolaknya", "error");
    }
  });

  event.target.value = "";
  renderMergeList();
}

function removeMergeFile(index) {
  mergeFiles.splice(index, 1);
  renderMergeList();
}

function renderMergeList() {
  const listContainer = document.getElementById("merge-list");
  const mergeBtn = document.getElementById("merge-btn");

  listContainer.innerHTML = `
        <div id="merge-empty-state" class="text-center py-8" style="display: none;">
            <p class="text-gray-400 italic">Belum ada file PDF yang dimasukkan ke dalam antrean.</p>
        </div>
    `;

  const emptyState = document.getElementById("merge-empty-state");

  if (mergeFiles.length === 0) {
    emptyState.style.display = "block";
    mergeBtn.classList.add("hidden");
    return;
  }

  if (mergeFiles.length >= 2) {
    mergeBtn.classList.remove("hidden");
  } else {
    mergeBtn.classList.add("hidden");
  }

  mergeFiles.forEach((file, index) => {
    const item = document.createElement("div");
    item.className =
      "flex justify-between items-center p-4 border border-gray-200 rounded-lg bg-white shadow-sm hover:shadow transition-shadow cursor-move";
    item.draggable = true;

    item.addEventListener("dragstart", (e) => {
      draggedIndex = index;
      e.dataTransfer.effectAllowed = "move";
      setTimeout(() => item.classList.add("opacity-50"), 0);
    });

    item.addEventListener("dragover", (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
      item.classList.add("border-blue-500");
    });

    item.addEventListener("dragleave", (e) => {
      item.classList.remove("border-blue-500");
    });

    item.addEventListener("drop", (e) => {
      e.preventDefault();
      item.classList.remove("border-blue-500");
      const targetIndex = index;
      if (draggedIndex !== null && draggedIndex !== targetIndex) {
        const draggedFile = mergeFiles.splice(draggedIndex, 1)[0];
        mergeFiles.splice(targetIndex, 0, draggedFile);
        renderMergeList();
      }
    });

    item.addEventListener("dragend", () => {
      item.classList.remove("opacity-50");
      draggedIndex = null;
    });

    const sizeInMB = (file.size / (1024 * 1024)).toFixed(2);

    item.innerHTML = `
            <div class="flex items-center gap-4 overflow-hidden pointer-events-none">
                <i class="fa-solid fa-grip-vertical text-gray-400 text-lg"></i>
                <div class="w-12 h-12 bg-red-100 text-red-500 rounded-lg flex items-center justify-center flex-shrink-0 text-xl">
                    <i class="fa-solid fa-file-pdf"></i>
                </div>
                <div class="truncate">
                    <p class="font-medium text-sm lg:text-base text-gray-800 truncate">${file.name}</p>
                    <p class="text-xs lg:text-sm text-gray-500">${sizeInMB} MB</p>
                </div>
            </div>
            <button onclick="removeMergeFile(${index})" class="text-red-500 hover:bg-red-50 p-2 lg:p-3 rounded-lg transition-colors flex-shrink-0 relative z-10 pointer-events-auto">
                <i class="fa-solid fa-trash"></i>
            </button>
        `;
    listContainer.appendChild(item);
  });
}

async function mergePDFs() {
  if (mergeFiles.length < 2) {
    showToast("Proses penggabungan membutuhkan minimal 2 file PDF", "error");
    return;
  }

  const mergeBtn = document.getElementById("merge-btn");
  const originalText = mergeBtn.innerHTML;
  mergeBtn.innerHTML =
    '<i class="fa-solid fa-spinner fa-spin mr-2"></i> Sedang Merakit PDF...';
  mergeBtn.disabled = true;

  try {
    const { PDFDocument } = PDFLib;
    const mergedPdf = await PDFDocument.create();

    for (const file of mergeFiles) {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await PDFDocument.load(arrayBuffer);
      const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
      copiedPages.forEach((page) => mergedPdf.addPage(page));
    }

    const mergedPdfFile = await mergedPdf.save();
    const blob = new Blob([mergedPdfFile], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "Berkas_Gabungan_SmartDocPro.pdf";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showToast("Penggabungan berhasil! File sedang diunduh.", "success");
    mergeFiles = [];
    renderMergeList();
  } catch (error) {
    showToast(
      "Terjadi kegagalan saat membaca atau merakit dokumen PDF.",
      "error",
    );
  } finally {
    mergeBtn.innerHTML = originalText;
    mergeBtn.disabled = false;
  }
}

async function handleSplitSelection(event) {
  const file = event.target.files[0];
  if (!file) return;

  if (file.type !== "application/pdf") {
    showToast("Sistem mendeteksi file non-PDF dan menolaknya", "error");
    event.target.value = "";
    return;
  }

  splitFile = file;
  event.target.value = "";

  try {
    const arrayBuffer = await file.arrayBuffer();
    const { PDFDocument } = PDFLib;
    splitPdfDoc = await PDFDocument.load(arrayBuffer);
    totalPages = splitPdfDoc.getPageCount();
    renderSplitView();
  } catch (error) {
    showToast("Gagal membaca file PDF.", "error");
    splitFile = null;
    splitPdfDoc = null;
    totalPages = 0;
    renderSplitView();
  }
}

function removeSplitFile() {
  splitFile = null;
  splitPdfDoc = null;
  totalPages = 0;
  renderSplitView();
}

function renderSplitView() {
  const listContainer = document.getElementById("split-list");

  listContainer.innerHTML = `
        <div id="split-empty-state" class="text-center py-8" style="display: none;">
            <p class="text-gray-400 italic">Belum ada file PDF yang dipilih.</p>
        </div>
    `;

  const emptyState = document.getElementById("split-empty-state");

  if (!splitFile) {
    emptyState.style.display = "block";
    return;
  }

  const sizeInMB = (splitFile.size / (1024 * 1024)).toFixed(2);

  const item = document.createElement("div");
  item.className =
    "p-4 border border-gray-200 rounded-lg bg-white shadow-sm";
  item.innerHTML = `
        <div class="flex justify-between items-center mb-4 pb-4 border-b border-gray-100">
            <div class="flex items-center gap-4 overflow-hidden">
                <div class="w-12 h-12 bg-red-100 text-red-500 rounded-lg flex items-center justify-center flex-shrink-0 text-xl">
                    <i class="fa-solid fa-file-pdf"></i>
                </div>
                <div class="truncate">
                    <p class="font-medium text-sm lg:text-base text-gray-800 truncate">${splitFile.name}</p>
                    <p class="text-xs lg:text-sm text-gray-500">${sizeInMB} MB | Total: ${totalPages} Halaman</p>
                </div>
            </div>
            <button onclick="removeSplitFile()" class="text-red-500 hover:bg-red-50 p-2 lg:p-3 rounded-lg transition-colors flex-shrink-0">
                <i class="fa-solid fa-trash"></i>
            </button>
        </div>
        <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Pilih Halaman yang Ingin Diekstrak</label>
            <input type="text" id="split-pages-input" placeholder="Contoh: 1, 3, 5-8" class="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none">
            <p class="text-xs text-gray-500 mt-2">Gunakan koma untuk halaman acak, dan strip untuk rentang berurutan.</p>
            <button onclick="splitPDF()" id="split-btn" class="w-full mt-4 bg-primary hover:bg-blue-800 text-tertiary px-5 py-3 rounded-lg font-medium transition-all shadow-md text-sm flex justify-center items-center">
                <i class="fa-solid fa-scissors mr-2"></i> Ekstrak & Unduh PDF
            </button>
        </div>
    `;
  listContainer.appendChild(item);
}

async function splitPDF() {
  const inputVal = document.getElementById("split-pages-input").value.trim();
  if (!inputVal) {
    showToast("Masukkan rentang halaman terlebih dahulu", "error");
    return;
  }

  const pageIndicesToKeep = new Set();
  const parts = inputVal.split(",");

  for (const part of parts) {
    const range = part.split("-").map((s) => parseInt(s.trim(), 10));

    if (range.length === 1) {
      if (!isNaN(range[0]) && range[0] > 0 && range[0] <= totalPages) {
        pageIndicesToKeep.add(range[0] - 1);
      }
    } else if (range.length === 2) {
      const start = range[0];
      const end = range[1];
      if (
        !isNaN(start) &&
        !isNaN(end) &&
        start > 0 &&
        start <= end &&
        end <= totalPages
      ) {
        for (let i = start; i <= end; i++) {
          pageIndicesToKeep.add(i - 1);
        }
      }
    }
  }

  const indicesArray = Array.from(pageIndicesToKeep).sort((a, b) => a - b);

  if (indicesArray.length === 0) {
    showToast("Format halaman tidak valid atau di luar jangkauan", "error");
    return;
  }

  const splitBtn = document.getElementById("split-btn");
  const originalText = splitBtn.innerHTML;
  splitBtn.innerHTML =
    '<i class="fa-solid fa-spinner fa-spin mr-2"></i> Mengekstrak...';
  splitBtn.disabled = true;

  try {
    const { PDFDocument } = PDFLib;
    const newPdf = await PDFDocument.create();

    const copiedPages = await newPdf.copyPages(splitPdfDoc, indicesArray);
    copiedPages.forEach((page) => newPdf.addPage(page));

    const newPdfBytes = await newPdf.save();
    const blob = new Blob([newPdfBytes], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `Ekstrak_${splitFile.name}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showToast("Halaman berhasil diekstrak dan diunduh!", "success");
  } catch (error) {
    showToast("Terjadi kesalahan saat mengekstrak halaman.", "error");
  } finally {
    splitBtn.innerHTML = originalText;
    splitBtn.disabled = false;
  }
}