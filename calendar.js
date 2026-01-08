const calendarState = {
    currentMonth: new Date().getMonth(),
    currentYear: new Date().getFullYear(),
    selectedDate: new Date()
};

const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
];

function renderCalendar() {
    const grid = document.getElementById('calendar-grid');
    const monthDisplay = document.getElementById('current-month-display');
    const prevBtn = document.getElementById('prev-month');
    const nextBtn = document.getElementById('next-month');

    if (!grid || !monthDisplay) return;

    // Update Header
    monthDisplay.textContent = `${months[calendarState.currentMonth]} ${calendarState.currentYear}`;

    // Clear Grid
    grid.innerHTML = '';

    // Data Prep: Map tasks to dates for indicators
    const tasks = TaskManager.getAll();
    const tasksByDate = {};
    tasks.forEach(task => {
        if (task.dueDate && task.status !== 'Completed') {
            // Normalize to YYYY-MM-DD for simple comparison
            const dateStr = new Date(task.dueDate).toDateString();
            if (!tasksByDate[dateStr]) tasksByDate[dateStr] = [];
            tasksByDate[dateStr].push(task);
        }
    });

    // First day of the month
    const firstDay = new Date(calendarState.currentYear, calendarState.currentMonth, 1).getDay();
    // Days in Month
    const daysInMonth = new Date(calendarState.currentYear, calendarState.currentMonth + 1, 0).getDate();
    // Days in Previous Month
    const daysInPrevMonth = new Date(calendarState.currentYear, calendarState.currentMonth, 0).getDate();

    // Adjust for Monday start (0 = Mon, 6 = Sun)
    let startingDay = firstDay - 1;
    if (startingDay < 0) startingDay = 6;

    // Previous Month Padding
    for (let i = 0; i < startingDay; i++) {
        const day = daysInPrevMonth - startingDay + i + 1;
        const cell = document.createElement('span');
        cell.className = "p-2 text-sm text-[#d1d5db] dark:text-[#4b5563] opacity-50";
        cell.textContent = day;
        grid.appendChild(cell);
    }

    // Current Month Days
    for (let i = 1; i <= daysInMonth; i++) {
        const date = new Date(calendarState.currentYear, calendarState.currentMonth, i);
        const dateStr = date.toDateString();
        const hasTasks = tasksByDate[dateStr] && tasksByDate[dateStr].length > 0;
        const isSelected = date.toDateString() === calendarState.selectedDate.toDateString();
        const isToday = date.toDateString() === new Date().toDateString();

        const cell = document.createElement('div');
        // Use flex and column to position dot
        cell.className = "relative flex flex-col items-center justify-center h-10 w-10 mx-auto rounded-full cursor-pointer transition-all hover:bg-[#f3f4f6] dark:hover:bg-[#283039]";

        // Drag Drop Attributes
        cell.dataset.date = dateStr; // Store date for drop handler
        cell.ondragover = (e) => {
            e.preventDefault();
            cell.classList.add('bg-primary/20', 'scale-110'); // Highlight
        };
        cell.ondragleave = (e) => {
            cell.classList.remove('bg-primary/20', 'scale-110');
        };
        cell.ondrop = handleDropOnDate;

        if (isSelected) {
            cell.classList.add('bg-primary', 'text-white', 'hover:bg-primary', 'shadow-lg', 'shadow-primary/30', 'font-bold');
        } else if (isToday) {
            cell.classList.add('border', 'border-primary', 'text-primary', 'font-bold');
        } else {
            cell.className += " text-[#111418] dark:text-white text-sm font-medium";
        }

        const dayNum = document.createElement('span');
        dayNum.textContent = i;
        cell.appendChild(dayNum);

        // Dot Indicator
        if (hasTasks && !isSelected) { // Don't show dot if selected (bg is blue)
            const dot = document.createElement('div');
            dot.className = "absolute bottom-1 w-1 h-1 rounded-full bg-primary";
            cell.appendChild(dot);
        }

        cell.addEventListener('click', () => {
            calendarState.selectedDate = date;
            renderCalendar(); // Re-render to update selection style
            renderSelectedDayTasks(); // Update task list below
        });

        grid.appendChild(cell);
    }
}

function renderSelectedDayTasks() {
    const container = document.getElementById('selected-day-tasks');
    const dateDisplay = document.getElementById('selected-date-display');
    const addBtn = document.getElementById('add-task-date-btn');

    if (!container || !dateDisplay) return;

    const date = calendarState.selectedDate;

    // Update Date Header
    const options = { month: 'long', day: 'numeric', year: 'numeric' };
    dateDisplay.textContent = date.toLocaleDateString('en-US', options);

    // Update Add Button Link
    // Format YYYY-MM-DD for input type="datetime-local" roughly
    // Or just pass query param and handle logic later.
    // Let's pass ISO string start
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateParam = `${year}-${month}-${day}`;

    addBtn.onclick = () => {
        window.location.href = `todo.html?new=true&date=${dateParam}`;
    };

    // Filter Tasks
    const allTasks = TaskManager.getAll();
    const dayTasks = allTasks.filter(task => {
        if (!task.dueDate) return false;
        const taskDate = new Date(task.dueDate);
        return taskDate.toDateString() === date.toDateString() && task.status !== 'Completed';
    });

    container.innerHTML = '';

    if (dayTasks.length === 0) {
        container.innerHTML = `
            <div class="flex flex-col items-center justify-center p-8 gap-2 text-[#9dabb9] text-sm italic">
                <span>No tasks for this day</span>
            </div>
        `;
        return;
    }

    // Get Profile for Avatar
    const profile = ProfileManager.get();
    const avatarStyle = profile.profilePic
        ? `background-image: url('${profile.profilePic}'); background-size: cover; background-position: center; border: none;`
        : '';

    dayTasks.forEach(task => {
        const div = document.createElement('div');
        div.className = "group relative flex items-center justify-between gap-4 p-4 rounded-xl bg-white dark:bg-[#1b252f] border border-[#e5e7eb] dark:border-[#283039] hover:border-primary/50 transition-colors cursor-grab active:cursor-grabbing";
        div.onclick = () => window.location.href = `todo.html?id=${task.id}`;

        // Draggable Logic
        div.draggable = true;
        div.ondragstart = (e) => {
            e.dataTransfer.setData("text/plain", task.id);
            e.dataTransfer.effectAllowed = "move";
            div.style.opacity = '0.5';
        };
        div.ondragend = () => {
            div.style.opacity = '1';
        };

        let priorityColor = 'bg-[#d1d5db]';
        // ... (rest of render logic remains same) ...
        if (task.priority === 'High') priorityColor = 'bg-red-500';
        if (task.priority === 'Medium') priorityColor = 'bg-yellow-500';

        // Truncate Description
        const desc = task.description && task.description.length > 50
            ? task.description.substring(0, 50) + '...'
            : (task.description || '');

        div.innerHTML = `
            <div class="flex items-center gap-4 flex-1 pointer-events-none"> <!-- Disable pointer events on children so drag works easier -->
                 <!-- Avatar with Profile Pic if available -->
                 <div class="flex items-center justify-center size-10 shrink-0 rounded-full border-2 border-[#d1d5db] dark:border-[#4b5563] bg-[#f3f4f6] dark:bg-[#283039]" style="${avatarStyle}">
                    ${!profile.profilePic ? '<span class="material-symbols-outlined text-[#9dabb9]">person</span>' : ''}
                 </div>
                 
                 <div class="flex flex-col flex-1 gap-1">
                    <div class="flex items-center justify-between">
                        <h3 class="text-[#111418] dark:text-white text-base font-bold leading-tight">${task.title}</h3>
                    </div>
                    ${desc ? `<p class="text-xs text-[#6b7280] dark:text-[#9dabb9] line-clamp-1">${desc}</p>` : ''}
                    
                    <div class="flex items-center gap-2 mt-1">
                        <span class="text-[#6b7280] dark:text-[#9dabb9] text-xs font-medium">${new Date(task.dueDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        <div class="size-1 rounded-full ${priorityColor}"></div>
                        <span class="text-primary text-xs font-bold">${task.category}</span>
                    </div>
                </div>
            </div>
            
            <button onclick="event.stopPropagation(); window.location.href='todo.html?id=${task.id}&edit=true'" 
                class="z-10 p-2 rounded-full text-[#9dabb9] hover:text-primary hover:bg-[#f3f4f6] dark:hover:bg-[#283039] transition-colors pointer-events-auto" title="Edit Task">
                <span class="material-symbols-outlined" style="font-size: 20px;">edit</span>
            </button>
        `;
        container.appendChild(div);
    });
}

// Drop Handler
function handleDropOnDate(e) {
    e.preventDefault();
    e.currentTarget.classList.remove('bg-primary/20', 'scale-110');

    const taskId = e.dataTransfer.getData("text/plain");
    const targetDateStr = e.currentTarget.dataset.date;

    if (taskId && targetDateStr) {
        const task = TaskManager.getById(taskId);
        if (task) {
            // Keep original time, change date
            const oldDate = new Date(task.dueDate);
            const newDate = new Date(targetDateStr);

            newDate.setHours(oldDate.getHours());
            newDate.setMinutes(oldDate.getMinutes());

            task.dueDate = newDate.toISOString();
            TaskManager.save(task);

            // Refresh
            renderCalendar();
            renderSelectedDayTasks();
        }
    }
}

function changeMonth(delta) {
    let newMonth = calendarState.currentMonth + delta;
    let newYear = calendarState.currentYear;

    if (newMonth > 11) {
        newMonth = 0;
        newYear++;
    } else if (newMonth < 0) {
        newMonth = 11;
        newYear--;
    }

    calendarState.currentMonth = newMonth;
    calendarState.currentYear = newYear;
    renderCalendar();
}

document.addEventListener('DOMContentLoaded', () => {
    // Initial Render
    renderCalendar();
    renderSelectedDayTasks();

    document.getElementById('prev-month').addEventListener('click', () => changeMonth(-1));
    document.getElementById('next-month').addEventListener('click', () => changeMonth(1));
});
