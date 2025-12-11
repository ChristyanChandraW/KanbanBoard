// =======================================================
// === File: kanban.js ===
// =======================================================

window.onload = function() {
    loadKanbanBoard();
};

// ⚠️ GANTI DENGAN URL DEPLOYMENT TERBARU ANDA
const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycby2ZrScUX9pZfr2zdOQ14bOXfBz1U9V9MUMXdFFFS1VWbOjs-JSNSF-XvMpNjcc0Ake/exec"; 

// Mapping Status Spreadsheet -> ID HTML Sub-Column
const COLUMN_STATUS_MAP = {
    // TO DO
    'Belum Dimulai': 'sub-col-belum-dimulai',
    'Belum Dimulai (Perlu Konfirmasi)': 'sub-col-perlu-konfirmasi',

    // DOING
    'Fokus Dikerjakan': 'sub-col-focus',
    'Dikerjakan': 'sub-col-focus', 
    'Doing': 'sub-col-focus',
    'Menunggu Konfirmasi': 'sub-col-menunggu-konfirmasi',
    'Menunggu Persetujuan': 'sub-col-menunggu-persetujuan',
    'Menunggu Vendor': 'sub-col-menunggu-persetujuan',

    // REVIEW
    'Dalam Tinjauan': 'col-review',
    'Review': 'col-review',
    
    // DONE
    'Selesai': 'col-done',
    'Done': 'col-done'
};

function loadKanbanBoard() {
    console.log("Mengambil data...");

    fetch(`${APPS_SCRIPT_URL}?action=getTodoData`)
        .then(response => {
            if (!response.ok) throw new Error("Gagal akses URL Apps Script");
            return response.json();
        })
        .then(json => {
            console.log("Data diterima:", json);
            // Handle struktur data { status: 'success', data: [...] }
            if (json.data && Array.isArray(json.data)) {
                renderBoard(json.data);
            } else {
                console.warn("Format data tidak sesuai atau kosong.");
            }
        })
        .catch(error => {
            console.error("Error Fetching:", error);
            document.querySelector('.board-container').innerHTML = 
                `<div style="color:red; text-align:center; margin-top:20px;">
                    <h3>Gagal Memuat Data</h3>
                    <p>${error.message}</p>
                    <small>Pastikan URL Apps Script benar dan Deploy sebagai 'Anyone'</small>
                 </div>`;
        });
}

function getPriorityClass(ticket) {
    const category = String(ticket.Category || "").toLowerCase();
    const task = String(ticket.Task || "").toLowerCase();

    if (category.includes('hardware') || task.includes('urgent')) return 'priority-high';
    if (category.includes('software') || task.includes('penting')) return 'priority-med';
    return 'priority-low';
}

function createCardHTML(ticket) {
    // Mapping Key JSON dari kode.gs
    const id = ticket.ID || "#";
    const task = ticket.Task || "(Tanpa Judul)";
    const assignee = ticket.Name || ticket.Requestor || "Unassigned";
    const status = ticket.Condition || "";
    
    // Format Tanggal
    let dateDisplay = "";
    if (ticket.CreationTimestamp) {
        // Karena dari Apps Script sudah di-format string, kita bisa ambil bagian tanggalnya saja atau parsing ulang
        dateDisplay = ticket.CreationTimestamp.split(' ')[0]; // Ambil YYYY-MM-DD
    }

    const priorityClass = getPriorityClass(ticket);
    const opacityStyle = (status === 'Selesai') ? 'style="opacity:0.7;"' : '';
    const titleStyle = (status === 'Selesai') ? 'style="text-decoration:line-through;"' : '';

    // Ambil judul tugas utama (hapus bagian S: P: O: K: | Asli: ...)
    let displayTitle = task;
    if (displayTitle.includes("| Asli:")) {
        displayTitle = displayTitle.split("| Asli:")[0].trim();
    }

    return `
        <div class="card ${priorityClass}" onclick="alert('ID: ${id}\\nTask: ${task}')" ${opacityStyle}>
            <div class="card-title" ${titleStyle}>${displayTitle}</div>
            <div class="card-meta">
                <span>#${id}</span>
                <span>${assignee}</span>
                <span>${dateDisplay}</span>
            </div>
        </div>
    `;
}

function renderBoard(tickets) {
    // 1. Bersihkan Kolom (Sisakan Header)
    const columns = document.querySelectorAll('.sub-column, #col-review, #col-done');
    columns.forEach(col => {
        // Hapus card, biarkan header
        const headers = col.querySelectorAll('.sub-header');
        col.innerHTML = '';
        headers.forEach(h => col.appendChild(h));
    });

    // 2. Render Kartu Baru
    tickets.forEach(ticket => {
        const status = ticket.Condition;
        if (status && COLUMN_STATUS_MAP[status]) {
            const targetId = COLUMN_STATUS_MAP[status];
            const container = document.getElementById(targetId);
            if (container) {
                container.innerHTML += createCardHTML(ticket);
            }
        }
    });

}

