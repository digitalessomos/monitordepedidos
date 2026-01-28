import { authService } from './services/auth.service.js';
import { databaseService } from './services/database.service.js';
import { uiManager } from './ui/ui.manager.js';
import { getURLs } from './config/urls.js';

// Global App State
window.AppState = {
    data: {
        orders: {},
        staff: [],
        currentUser: null
    },
    update(key, payload) {
        this.data[key] = payload;
        uiManager.renderApp(this.data, handlers);
    }
};

// Handlers for UI actions
const handlers = {
    onCreateOrder: (id, rep) => databaseService.createOrder(id, rep).then(() => uiManager.playSound(rep ? "G4" : "E4")),
    onAssignOrder: (id, rep) => databaseService.assignOrder(id, rep).then(() => uiManager.playSound("G4")),
    onFinalizeOrder: (id) => databaseService.finalizeOrder(id).then(() => uiManager.playSound("C5")),
    onDeleteOrder: (id) => databaseService.deleteOrder(id).then(() => uiManager.playSound("A2")),
    onUpdateStaff: (list) => databaseService.updateStaff(list),
    onSignOut: () => authService.logout().finally(() => {
        localStorage.removeItem('rutatotal_role');
        const URLs = getURLs();
        window.location.href = URLs.login;
    })
};

// Initialize Application
const init = async () => {
    const loadingScreen = document.getElementById('loading-screen');
    
    authService.onAuthChange((user) => {
        if (user) {
            window.AppState.update('currentUser', user);
            
            const params = new URLSearchParams(window.location.search);
            const role = params.get('role') || localStorage.getItem('rutatotal_role') || 'Operador';
            
            const userDisplay = document.getElementById('user-display');
            if (userDisplay) userDisplay.textContent = `${role.toUpperCase()} • ID: ${user.uid}`;

            // Subscribe to real-time data
            databaseService.subscribeToOrders((orders) => window.AppState.update('orders', orders));
            databaseService.subscribeToStaff((staff) => window.AppState.update('staff', staff));

            if (loadingScreen) loadingScreen.style.display = 'none';
            document.getElementById('kanban-container')?.classList.remove('hidden');
            document.getElementById('ops-panel')?.classList.remove('hidden');
        } else {
            // No user, redirect to login if not already there
            if (!window.location.pathname.includes('login.html')) {
                window.location.href = 'login.html';
            }
        }
    });

    await authService.loginAnonymously();
};

// Event Listeners and Global Setup
window.onload = () => {
    init();

    // UI Event Listeners
    document.getElementById('prev-btn').onclick = () => uiManager.slideNumbers(-1, window.AppState.data);
    document.getElementById('next-btn').onclick = () => uiManager.slideNumbers(1, window.AppState.data);

    document.getElementById('history-search').oninput = (e) => {
        uiManager.setSearchQuery(e.target.value);
        uiManager.renderApp(window.AppState.data, handlers);
    };

    document.getElementById('theme-toggle').onclick = () => {
        document.body.classList.toggle('light-mode');
        document.body.classList.toggle('dark-mode', !document.body.classList.contains('light-mode'));
        document.getElementById('theme-text').textContent = document.body.classList.contains('light-mode') ? 'MODO OSCURO' : 'MODO CLARO';
    };

    document.getElementById('start-demo-btn').onclick = () => {
        document.getElementById('ops-panel').classList.remove('hidden');
        document.getElementById('kanban-container').classList.remove('hidden');
        document.getElementById('start-demo-btn').innerHTML = '<i class="fas fa-check-circle"></i><span class="btn-label">TERMINAL</span>';
        uiManager.renderApp(window.AppState.data, handlers);
    };

    // Modal Listeners
    const togModal = (id, show) => {
        const modal = document.getElementById(id);
        if (modal) modal.style.display = show ? 'flex' : 'none';
    };

    document.getElementById('open-staff-modal-btn').onclick = () => {
        uiManager.renderStaffListModal(window.AppState.data.staff, handlers.onUpdateStaff);
        togModal('staffModal', true);
    };
    document.getElementById('close-staff-modal-btn').onclick = () => togModal('staffModal', false);

    document.getElementById('open-history-modal-btn').onclick = () => {
        togModal('historyModal', true);
        uiManager.renderApp(window.AppState.data, handlers);
    };
    document.getElementById('close-history-modal-btn').onclick = () => togModal('historyModal', false);

    document.getElementById('add-staff-btn').onclick = () => {
        const v = document.getElementById('new-staff-name').value.trim();
        const cur = window.AppState.data.staff;
        if (v && !cur.includes(v)) {
            handlers.onUpdateStaff([...cur, v]);
            document.getElementById('new-staff-name').value = '';
            togModal('staffModal', false);
        }
    };

    document.getElementById('clear-history-btn').onclick = async () => {
        if (confirm("¿Purgar todo?")) {
            const ids = Object.keys(window.AppState.data.orders);
            for (const id of ids) await handlers.onDeleteOrder(id);
        }
    };

    document.getElementById('download-pdf-btn').onclick = () => {
        uiManager.generatePDFReport(window.AppState.data.orders, window.AppState.data.staff);
    };

    document.getElementById('logoutBtn').onclick = () => handlers.onSignOut();

    // Loading screen fade out
    setTimeout(() => {
        const ls = document.getElementById('loading-screen');
        if (ls) {
            ls.style.opacity = '0';
            setTimeout(() => ls.style.display = 'none', 500);
        }
    }, 1000);
};
