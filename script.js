const STORAGE_KEY = 'study_records';

// Load from localStorage or initialize empty array
let records = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];

// DOM Elements
const form = document.getElementById('add-form');
const subjectInput = document.getElementById('subject-input');
const entriesContainer = document.getElementById('entries-container');
const addDateBtn = document.getElementById('add-date-btn');
const recordsTable = document.getElementById('records-table');
const addModal = document.getElementById('add-modal');
const openModalBtn = document.getElementById('open-modal-btn');
const closeModalBtn = document.getElementById('close-modal-btn');
const toggleTodayBtn = document.getElementById('toggle-today-btn');

// State
let showOnlyToday = false;

// Helper: Get today's date
function getTodayDate() {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
}

// Initialize app
function init() {
    // Set default date to today for the first entry
    const firstDateInput = document.querySelector('.date-input');
    if (firstDateInput) {
        firstDateInput.value = getTodayDate();
    }
    render();
}

// Dynamic form logic
addDateBtn.addEventListener('click', () => {
    const row = document.createElement('div');
    row.className = 'entry-row';
    row.innerHTML = `
        <div class="input-group">
            <label>Date</label>
            <input type="date" class="date-input" value="${getTodayDate()}" required>
        </div>
        <div class="input-group">
            <label>Subtopic <span class="optional-text">(Optional)</span></label>
            <input type="text" class="subtopic-input" placeholder="e.g. Algebra">
        </div>
        <div class="input-group">
            <label>Status</label>
            <select class="status-input">
                <option value="Undone" selected>Undone</option>
                <option value="Done">Done</option>
            </select>
        </div>
        <div class="input-group">
            <label class="hidden-label">&nbsp;</label>
            <button type="button" class="secondary-btn remove-btn">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
        </div>
    `;
    
    // Add remove event listener
    const removeBtn = row.querySelector('.remove-btn');
    removeBtn.addEventListener('click', () => {
        row.remove();
        updateRemoveButtons();
    });
    
    entriesContainer.appendChild(row);
    updateRemoveButtons();
});

function updateRemoveButtons() {
    const rows = entriesContainer.querySelectorAll('.entry-row');
    const removeBtns = entriesContainer.querySelectorAll('.remove-btn');
    if (rows.length === 1) {
        if(removeBtns[0]) removeBtns[0].disabled = true;
    } else {
        removeBtns.forEach(btn => btn.disabled = false);
    }
}

// Add new records
form.addEventListener('submit', (e) => {
    e.preventDefault();
    const subject = subjectInput.value.trim();
    if (!subject) return;

    const rows = entriesContainer.querySelectorAll('.entry-row');
    rows.forEach(row => {
        const dateVal = row.querySelector('.date-input').value;
        const subtopicVal = row.querySelector('.subtopic-input') ? row.querySelector('.subtopic-input').value.trim() : '';
        const statusVal = row.querySelector('.status-input').value;
        
        if (dateVal) {
            records.push({
                id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
                date: dateVal,
                subject: subject,
                subtopic: subtopicVal,
                status: statusVal
            });
        }
    });
    
    save();
    render();
    
    // Reset form
    subjectInput.value = '';
    const extraRows = Array.from(rows).slice(1);
    extraRows.forEach(r => r.remove());
    const firstRow = entriesContainer.querySelector('.entry-row');
    if(firstRow) {
        firstRow.querySelector('.date-input').value = getTodayDate();
        if(firstRow.querySelector('.subtopic-input')) firstRow.querySelector('.subtopic-input').value = '';
        firstRow.querySelector('.status-input').value = 'Undone';
    }
    updateRemoveButtons();
    
    addModal.close();
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
    // Apply Filter for Today's Tasks
    let displayRecords = records;
    if (showOnlyToday) {
        const today = getTodayDate();
        displayRecords = records.filter(r => r.date === today);
    }

    // Group by Subject
    const grouped = {};
    displayRecords.forEach(r => {
        const lowerSub = r.subject.toLowerCase();
        if (!grouped[lowerSub]) {
            grouped[lowerSub] = {
                originalSubject: r.subject,
                entries: []
            };
        }
        grouped[lowerSub].entries.push(r);
    });

    // Sort Subjects alphabetically
    const sortedSubjects = Object.keys(grouped).sort((a, b) => a.localeCompare(b));

    // Sort internal entries by date ascending
    sortedSubjects.forEach(sub => {
        grouped[sub].entries.sort((a, b) => {
            if (a.date === b.date) return 0;
            return a.date > b.date ? 1 : -1;
        });
    });

    // Render table rows
    const existingTbodies = recordsTable.querySelectorAll('tbody');
    existingTbodies.forEach(tb => tb.remove());
    
    if (displayRecords.length === 0) {
        const tbody = document.createElement('tbody');
        const tr = document.createElement('tr');
        const td = document.createElement('td');
        td.colSpan = 4;
        td.textContent = 'No study records found.';
        td.style.textAlign = 'center';
        td.style.color = 'var(--text-muted)';
        td.style.padding = '2rem';
        tr.appendChild(td);
        tbody.appendChild(tr);
        recordsTable.appendChild(tbody);
        return;
    }

    sortedSubjects.forEach(subKey => {
        const group = grouped[subKey];
        const entries = group.entries;
        const rowspan = entries.length;

        const tbody = document.createElement('tbody');

        // Mobile header row (hidden on desktop)
        const mobileHeaderTr = document.createElement('tr');
        mobileHeaderTr.className = 'mobile-subject-header hide-desktop';
        mobileHeaderTr.innerHTML = `<td colspan="4"><h3>${group.originalSubject}</h3></td>`;
        tbody.appendChild(mobileHeaderTr);

        // Mobile column header row (hidden on desktop)
        const mobileColHeader = document.createElement('tr');
        mobileColHeader.className = 'mobile-col-header hide-desktop';
        mobileColHeader.innerHTML = `<td>Date</td><td>Subtopic</td><td>Status</td><td>Action</td>`;
        tbody.appendChild(mobileColHeader);

        entries.forEach((record, index) => {
            const tr = document.createElement('tr');
            
            // Date Column
            const dateTd = document.createElement('td');
            dateTd.setAttribute('data-label', 'Date');
            dateTd.textContent = formatDate(record.date);

            // Subject Column (Only for the first entry, or hidden on desktop for subsequent entries)
            const subjectTd = document.createElement('td');
            subjectTd.setAttribute('data-label', 'Subject');
            subjectTd.textContent = group.originalSubject;
            subjectTd.style.fontWeight = '500';
            
            if (index === 0) {
                subjectTd.rowSpan = rowspan;
                subjectTd.classList.add('hide-mobile');
            } else {
                subjectTd.classList.add('hide-desktop', 'hide-mobile');
            }

            // Subtopic Column
            const subtopicTd = document.createElement('td');
            subtopicTd.setAttribute('data-label', 'Subtopic');
            subtopicTd.textContent = record.subtopic || '-';
            if(!record.subtopic) {
                subtopicTd.style.color = 'var(--text-muted)';
            }

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
            tr.appendChild(subtopicTd);
            tr.appendChild(statusTd);
            tr.appendChild(actionTd);

            tbody.appendChild(tr);
        });
        
        recordsTable.appendChild(tbody);
    });
}

// Event Listeners for controls
toggleTodayBtn.addEventListener('click', () => {
    showOnlyToday = !showOnlyToday;
    toggleTodayBtn.textContent = showOnlyToday ? "Show All Tasks" : "Show Today's Tasks";
    toggleTodayBtn.classList.toggle('active-filter', showOnlyToday);
    render();
});

// Modal Logic
openModalBtn.addEventListener('click', () => {
    addModal.showModal();
});

closeModalBtn.addEventListener('click', () => {
    addModal.close();
});

addModal.addEventListener('click', (e) => {
    const dialogDimensions = addModal.getBoundingClientRect();
    if (
        e.clientX < dialogDimensions.left ||
        e.clientX > dialogDimensions.right ||
        e.clientY < dialogDimensions.top ||
        e.clientY > dialogDimensions.bottom
    ) {
        addModal.close();
    }
});

// Run init on load
init();
