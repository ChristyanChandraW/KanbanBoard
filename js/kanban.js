// =======================================================
// === File: kanban.js (VERSI CEPAT & FIX) ===
// =======================================================

// 1. KONFIGURASI UTAMA
const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxu2hCc_54_TKFJTGAY0J0i_iC-TodXzgWzmU8NyVMquZjibdg_yjHr0WMwqrucLuU/exec"; 

const COLUMN_STATUS_MAP = {
    'Belum Dimulai': 'sub-col-belum-dimulai',
    'Belum Dimulai (Perlu Konfirmasi)': 'sub-col-perlu-konfirmasi',
    'Fokus Dikerjakan': 'sub-col-focus',
    'Dikerjakan': 'sub-col-focus', 
    'Doing': 'sub-col-focus',
    'Menunggu Konfirmasi': 'sub-col-menunggu-konfirmasi',
    'Menunggu Persetujuan': 'sub-col-menunggu-persetujuan',
    'Menunggu Vendor': 'sub-col-menunggu-persetujuan',
    'Dalam Tinjauan': 'col-review',
    'Review': 'col-review',
    'Selesai': 'col-done',
    'Done': 'col-done'
};

// 2. INIT FUNGSI SAAT LOAD
document.addEventListener("DOMContentLoaded", () => {
    loadKanbanBoard();
    initDarkMode();
    setupSearchLogic();
});

// Refresh otomatis tiap 2 menit
setInterval(loadKanbanBoard, 120000);

// 3. FUNGSI LOAD DATA (OPTIMASI CACHE)
async function loadKanbanBoard() {
    console.time("FetchTime");
    
    // Tampilkan cache dulu supaya cepat (Instant Loading)
    const cached = localStorage.getItem("kanbanCacheData");
    if (cached) {
        renderBoard(JSON.parse(cached));
    }

    try {
        const response = await fetch(`${APPS_SCRIPT_URL}?action=getTodoData`);
        const json = await response.json();
        
        if (json && json.data) {
            // Jika data baru berbeda dengan cache, update tampilan
            if (JSON.stringify(json.data) !== cached) {
                renderBoard(json.data);
                localStorage.setItem("kanbanCacheData", JSON.stringify(json.data));
            }
        }
    } catch (err) {
        console.error("Gagal ambil data:", err);
    } finally {
        console.timeEnd("FetchTime");
    }
}

// 4. RENDER KE HTML
function renderBoard(tickets) {
    // Bersihkan semua kolom kecuali header
    const columns = document.querySelectorAll('.sub-column, #col-review, #col-done');
    columns.forEach(col => {
        const header = col.querySelector('.sub-header') || col.querySelector('.column-header');
        col.innerHTML = '';
        if (header) col.appendChild(header);
    });

    // Masukkan kartu ke kolom masing-masing
    tickets.forEach(ticket => {
        const status = ticket.Condition;
        const targetId = COLUMN_STATUS_MAP[status];
        if (targetId) {
            const container = document.getElementById(targetId);
            if (container) {
                container.insertAdjacentHTML('beforeend', createCardHTML(ticket));
            }
        }
    });
}

function createCardHTML(ticket) {
    const id = ticket.ID || "N/A";
    const task = ticket.Task || "No Task";
    const name = ticket.Name || "Anonim";
    const priority = (task.toLowerCase().includes('urgent')) ? 'priority-high' : 'priority-low';
    
    return `
        <div class="card ${priority}" onclick="openTaskDetail('${id}')">
            <div class="card-title">${task}</div>
            <div class="card-meta">
                <span>#${id}</span> | <span>${name}</span>
            </div>
        </div>
    `;
}

// 5. LOGIKA SEARCH & DARK MODE (FIX)
function setupSearchLogic() {
    const searchInput = document.getElementById('mainSearch');
    if (!searchInput) return;

    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            const val = searchInput.value.trim();
            if (!val) return;

            if (val.toLowerCase() === 'see') {
                const toggle = document.getElementById('darkModeToggle');
                if (toggle) toggle.click();
                searchInput.value = "";
            } else {
                window.open(`task.html?id=${val}`, "_blank");
            }
        }
    });
}

function initDarkMode() {
    const toggle = document.getElementById('darkModeToggle');
    if (!toggle) return;

    const isDark = localStorage.getItem('theme') === 'dark';
    toggle.checked = isDark;
    if (isDark) document.body.classList.add('dark-mode');

    toggle.addEventListener('change', () => {
        document.body.classList.toggle('dark-mode', toggle.checked);
        localStorage.setItem('theme', toggle.checked ? 'dark' : 'light');
    });
}

function openTaskDetail(id) {
    window.open(`task.html?id=${id}`, "_blank");
}

function executeReport() {
    const date = document.getElementById('inputDate').value;
    const month = document.getElementById('inputMonth').value;
    if (date) window.open(`report.html?date=${date}`, "_blank");
    else if (month) window.open(`report.html?month=${month}`, "_blank");
    else alert("Pilih tanggal atau bulan!");
}


