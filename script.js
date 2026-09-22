const STORAGE_KEY = 'study_records';

// Load from localStorage or initialize empty array
let records = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];

// DOM Elements
const form = document.getElementById('add-form');
const dateInput = document.getElementById('date-input');
const subjectInput = document.getElementById('subject-input');
const statusInput = document.getElementById('status-input');
const tableBody = document.getElementById('table-body');
const totalCount = document.getElementById('total-count');
const doneCount = document.getElementById('done-count');
const undoneCount = document.getElementById('undone-count');
const filterSelect = document.getElementById('filter-select');
const sortBtn = document.getElementById('sort-btn');

// State
let currentFilter = 'All';
let sortAsc = true;

// Initialize app
function init() {
    // Set default date to today in YYYY-MM-DD
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    dateInput.value = `${yyyy}-${mm}-${dd}`;
    
    render();
}

// Add new record
form.addEventListener('submit', (e) => {
    e.preventDefault();
    const newRecord = {
        id: Date.now().toString(),
        date: dateInput.value,
        subject: subjectInput.value.trim(),
        status: statusInput.value
    };
    
    if (newRecord.subject === '') return;
    
    records.push(newRecord);
    save();
    render();
    
    // Reset subject input for next entry
    subjectInput.value = '';
    subjectInput.focus();
});

// Delete record
function deleteRecord(id) {
    records = records.filter(r => r.id !== id);
    save();
    render();
}

// Toggle status between Done and Undone
function toggleStatus(id) {
    const record = records.find(r => r.id === id);
    if (record) {
        record.status = record.status === 'Done' ? 'Undone' : 'Done';
        save();
        render();
    }
}

// Save records to localStorage
function save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}

// Format date string from YYYY-MM-DD to DD MMM YYYY
function formatDate(dateStr) {
    if (!dateStr) return '';
    const [year, month, day] = dateStr.split('-');
    const dateObj = new Date(year, month - 1, day);
    return dateObj.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

// Render the UI
function render() {
    // Update stats
    totalCount.textContent = records.length;
    const done = records.filter(r => r.status === 'Done').length;
    doneCount.textContent = done;
    undoneCount.textContent = records.length - done;

    // Apply Filter
    let displayRecords = records;
    if (currentFilter !== 'All') {
        displayRecords = records.filter(r => r.status === currentFilter);
    }

    // Apply Sort
    displayRecords.sort((a, b) => {
        if (a.date === b.date) return 0;
        const result = a.date > b.date ? 1 : -1;
        return sortAsc ? result : -result;
    });

    // Render table rows
    tableBody.innerHTML = '';
    
    if (displayRecords.length === 0) {
        const tr = document.createElement('tr');
        const td = document.createElement('td');
        td.colSpan = 4;
        td.textContent = 'No study records found.';
        td.style.textAlign = 'center';
        td.style.color = 'var(--text-muted)';
        td.style.padding = '2rem';
        tr.appendChild(td);
        tableBody.appendChild(tr);
        return;
    }

    displayRecords.forEach(record => {
        const tr = document.createElement('tr');
        
        // Date Column
        const dateTd = document.createElement('td');
        dateTd.setAttribute('data-label', 'Date');
        dateTd.textContent = formatDate(record.date);

        // Subject Column
        const subjectTd = document.createElement('td');
        subjectTd.setAttribute('data-label', 'Subject');
        subjectTd.textContent = record.subject;
        subjectTd.style.fontWeight = '500';

        // Status Column
        const statusTd = document.createElement('td');
        statusTd.setAttribute('data-label', 'Status');
        const statusBadge = document.createElement('span');
        statusBadge.className = `status-badge ${record.status.toLowerCase()}`;
        statusBadge.innerHTML = record.status === 'Done' ? '&#10003; Done' : '&#9711; Undone';
        statusBadge.onclick = () => toggleStatus(record.id);
        statusTd.appendChild(statusBadge);

        // Action Column
        const actionTd = document.createElement('td');
        actionTd.setAttribute('data-label', 'Action');
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-btn';
        deleteBtn.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                <line x1="10" y1="11" x2="10" y2="17"></line>
                <line x1="14" y1="11" x2="14" y2="17"></line>
            </svg>
            Delete
        `;
        deleteBtn.onclick = () => deleteRecord(record.id);
        actionTd.appendChild(deleteBtn);

        tr.appendChild(dateTd);
        tr.appendChild(subjectTd);
        tr.appendChild(statusTd);
        tr.appendChild(actionTd);

        tableBody.appendChild(tr);
    });
}

// Event Listeners for controls
filterSelect.addEventListener('change', (e) => {
    currentFilter = e.target.value;
    render();
});

sortBtn.addEventListener('click', () => {
    sortAsc = !sortAsc;
    sortBtn.innerHTML = `Sort by Date ${sortAsc ? '&uarr;' : '&darr;'}`;
    render();
});

// Run init on load
init();
