
// Core Architecture: TodoApp Class
class TodoApp {
    constructor() {
        this.storageKey = 'tod_tasks_v2'; // New key for the overhaul
        this.themeKey = 'tod_theme_v2';
        this.tasks = [];
        this.subscribers = [];

        this.init();
    }

    init() {
        this.loadTasks();
        this.loadProfile();
        this.initTheme();
        if (this.tasks.length === 0) this.seedDemoData();
    }

    // --- User Profile ---
    loadProfile() {
        try {
            const data = localStorage.getItem('tod_profile_v1');
            this.userProfile = data ? JSON.parse(data) : {
                name: 'User',
                title: 'Productivity Master',
                email: 'user@example.com',
                phone: '+1 (555) 000-0000',
                photo: null // Base64 string
            };
        } catch (e) {
            console.error('Failed to load profile', e);
            this.userProfile = {
                name: 'User',
                title: 'Productivity Master',
                email: 'user@example.com',
                phone: '+1 (555) 000-0000',
                photo: null
            };
        }
    }

    saveProfile() {
        localStorage.setItem('tod_profile_v1', JSON.stringify(this.userProfile));
        // We might want to notify subscribers if we had any for profile, 
        // but for now, the settings page will just reload or update locally.
        // If we want to update the header or other places, we might need a notifyProfile()
        this.notify(); // Re-use main notify for simplicity to trigger re-renders if needed
    }

    updateProfile(updates) {
        this.userProfile = { ...this.userProfile, ...updates };
        this.saveProfile();
        return this.userProfile;
    }

    // --- State Management ---
    subscribe(callback) {
        this.subscribers.push(callback);
    }

    notify() {
        this.subscribers.forEach(cb => cb(this.tasks));
    }

    // --- Data Persistence ---
    loadTasks() {
        try {
            const data = localStorage.getItem(this.storageKey);
            this.tasks = data ? JSON.parse(data) : [];
        } catch (e) {
            console.error('Failed to load tasks', e);
            this.tasks = [];
        }
    }

    saveTasks() {
        localStorage.setItem(this.storageKey, JSON.stringify(this.tasks));
        this.notify();
    }

    // --- Task CRUD ---
    getTasks() {
        return [...this.tasks]; // Return copy
    }

    getTask(id) {
        return this.tasks.find(t => t.id === id);
    }

    addTask(task) {
        // Ensure ID
        if (!task.id) task.id = crypto.randomUUID();
        // Ensure arrays
        task.subtasks = task.subtasks || [];
        task.tags = task.tags || [];
        task.messages = task.messages || [];
        task.attachments = task.attachments || [];
        task.createdAt = new Date().toISOString();

        this.tasks.unshift(task);
        this.saveTasks();
        return task;
    }

    updateTask(updatedTask) {
        const index = this.tasks.findIndex(t => t.id === updatedTask.id);
        if (index !== -1) {
            this.tasks[index] = { ...this.tasks[index], ...updatedTask };
            this.saveTasks();
            return true;
        }
        return false;
    }

    deleteTask(id) {
        this.tasks = this.tasks.filter(t => t.id !== id);
        this.saveTasks();
    }

    // --- Theme Management ---
    initTheme() {
        const saved = localStorage.getItem(this.themeKey);
        const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

        if (saved === 'dark' || (!saved && systemDark)) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }

    toggleTheme() {
        const isDark = document.documentElement.classList.toggle('dark');
        localStorage.setItem(this.themeKey, isDark ? 'dark' : 'light');
        return isDark;
    }

    // --- Helpers ---
    seedDemoData() {
        const demoTasks = [
            {
                id: '1',
                title: 'Redesign Homepage Hero Section',
                priority: 'High',
                status: 'In Progress',
                dueDate: new Date(Date.now() + 86400000).toISOString(),
                category: 'Work',
                estimate: '2h',
                description: "Update the hero image to use the new 3D assets and change the CTA button copy to 'Get Started Free'.",
                subtasks: [
                    { title: "Update Tailwind Config", completed: true },
                    { title: "Refactor JS Architecture", completed: true },
                    { title: "Verify Glassmorphism", completed: false }
                ],
                tags: ['Design', 'Dev'],
                messages: []
            },
            {
                id: '2',
                title: 'Grocery Shopping',
                priority: 'Low',
                status: 'Todo',
                dueDate: new Date(Date.now() + 172800000).toISOString(),
                category: 'Personal',
                estimate: '1h',
                description: "Buy milk, eggs, bread, and vegetables.",
                subtasks: [],
                tags: ['Shopping'],
                messages: []
            },
            {
                id: '3',
                title: 'Weekly Team Sync',
                priority: 'Medium',
                status: 'Todo',
                dueDate: new Date(Date.now() + 259200000).toISOString(),
                category: 'Work',
                estimate: '1h',
                description: "Discuss project status and blockers.",
                subtasks: [],
                tags: ['Meeting'],
                messages: []
            }
        ];
        this.tasks = demoTasks;
        this.saveTasks();
    }
}

// Global Instance
const app = new TodoApp();

// Legacy Adapter (to keep existing pages working until full switch)
const TaskManager = {
    getAll: () => app.getTasks(),
    getById: (id) => app.getTask(id),
    save: (task) => {
        const exists = app.getTask(task.id);
        if (exists) app.updateTask(task);
        else app.addTask(task);
    },
    delete: (id) => {
        app.deleteTask(id);
    },
    addAttachment: (id, file) => {
        const t = app.getTask(id);
        if (t) {
            t.attachments = t.attachments || [];
            t.attachments.push({ ...file, timestamp: Date.now() });
            app.updateTask(t);
            return true;
        }
        return false;
    },
    getNotifications: () => {
        // Basic Shim for notifications
        return [];
    }
};
