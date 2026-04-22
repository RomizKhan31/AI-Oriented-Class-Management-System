// Global API helper
const API_URL = '/api';

const apiFetch = async (endpoint, options = {}) => {
    const token = localStorage.getItem('token');
    
    const headers = {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        ...options.headers
    };

    const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers
    });

    if (!response.ok) {
        let errorMsg = 'An error occurred';
        try {
            const error = await response.json();
            errorMsg = error.message || errorMsg;
        } catch(e) {}
        throw new Error(errorMsg);
    }

    // For 204 or empty bods
    try {
        return await response.json();
    } catch {
        return {};
    }
};

// Global Crisis Alert Widget System
const initCrisisAlert = () => {
    const widget = document.getElementById('crisis-widget');
    const messageEl = document.getElementById('crisis-message');
    
    if (!widget || !messageEl) return;

    const checkForCrisis = async () => {
        try {
            const data = await apiFetch('/crisis/alerts');
            if (data.alerts && data.alerts.length > 0) {
                // Show the highest severity alert
                messageEl.textContent = data.alerts[0].message;
                widget.classList.add('active');
                
                // Remove warning after 3 seconds
                setTimeout(() => {
                    widget.classList.remove('active');
                }, 3000);
            } else {
                widget.classList.remove('active');
            }
        } catch (error) {
            console.error('Failed to fetch crisis alerts', error);
        }
    };

    // Check immediately on load
    checkForCrisis();
    
    // Check every 1 minute
    setInterval(checkForCrisis, 60000);
};

// Global Toast System
const showToast = (message, type = 'success') => {
    let container = document.getElementById('toast-container');
    if(!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        document.body.appendChild(container);
    }
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <span style="font-size:1.2rem">${type === 'success' ? '✅' : '❌'}</span>
        <span>${message}</span>
    `;
    
    container.appendChild(toast);
    
    // Trigger animation
    setTimeout(() => toast.classList.add('show'), 10);
    
    // Remove after 3s
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
};

document.addEventListener('DOMContentLoaded', initCrisisAlert);
