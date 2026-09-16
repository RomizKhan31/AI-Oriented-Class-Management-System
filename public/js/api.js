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
        } catch (e) { }
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

// Global Toast System using SweetAlert2
const showToast = (message, type = 'success') => {
    if (typeof Swal !== 'undefined') {
        Swal.fire({
            toast: true,
            position: 'bottom-end',
            icon: type,
            title: message,
            showConfirmButton: false,
            timer: 3000,
            timerProgressBar: true,
            customClass: {
                popup: 'swal2-toast'
            }
        });
    } else {
        // Fallback if Swal is not loaded
        alert(`${type.toUpperCase()}: ${message}`);
    }
};

// Professional System Status Indicator
const initSystemStatus = () => {
    // Only show on dashboards, not login page
    if (window.location.pathname === '/' || window.location.pathname === '/index.html') return;

    const nav = document.querySelector('.glass-nav');
    if (!nav) return;

    const statusContainer = document.createElement('div');
    statusContainer.className = 'system-status';
    statusContainer.style.cssText = `
        display: flex;
        align-items: center;
        gap: 8px;
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.1);
        padding: 6px 14px;
        border-radius: 20px;
        font-size: 0.85rem;
        color: #e2e8f0;
        margin: 0 auto;
        box-shadow: 0 4px 15px rgba(0,0,0,0.1);
        backdrop-filter: blur(10px);
        white-space: nowrap;
        cursor: pointer;
        transition: all 0.3s ease;
    `;

    const rightSide = nav.querySelector('.d-flex.align-center.gap-3');
    if (rightSide) {
        nav.insertBefore(statusContainer, rightSide);
    } else {
        nav.appendChild(statusContainer);
    }

    const updateStatus = async () => {
        try {
            const res = await apiFetch('/crisis/alerts');
            if (res.alerts && res.alerts.length > 0) {
                statusContainer.innerHTML = `
                    <span style="width: 8px; height: 8px; background: #ef4444; border-radius: 50%; animation: pulse 2s infinite;"></span>
                    <span style="font-weight: 600; color: #ef4444;">${res.alerts.length} Alert${res.alerts.length > 1 ? 's' : ''}</span>
                `;
                statusContainer.style.borderColor = 'rgba(239, 68, 68, 0.3)';
            } else {
                statusContainer.innerHTML = `
                    <span style="width: 8px; height: 8px; background: #22c55e; border-radius: 50%;"></span>
                    <span style="font-weight: 600; color: #22c55e;">System Normal</span>
                `;
                statusContainer.style.borderColor = 'rgba(34, 197, 94, 0.3)';
            }
        } catch (e) {
            statusContainer.innerHTML = `
                <span style="width: 8px; height: 8px; background: #f59e0b; border-radius: 50%;"></span>
                <span style="font-weight: 600; color: #f59e0b;">Checking...</span>
            `;
        }
    };

    // Add pulse animation
    const style = document.createElement('style');
    style.textContent = `
        @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
        }
    `;
    document.head.appendChild(style);

    updateStatus();
    // Update every 30 seconds
    setInterval(updateStatus, 30000);

    // Click to show details
    statusContainer.addEventListener('click', async () => {
        try {
            const res = await apiFetch('/crisis/alerts');
            if (res.alerts && res.alerts.length > 0) {
                const alertMessages = res.alerts.map(a => `• ${a.message}`).join('\n');
                Swal.fire({
                    title: 'System Alerts',
                    text: alertMessages,
                    icon: 'warning',
                    confirmButtonColor: '#6366f1'
                });
            } else {
                Swal.fire({
                    title: 'System Status',
                    text: 'All systems are operating normally.',
                    icon: 'success',
                    confirmButtonColor: '#6366f1'
                });
            }
        } catch (e) {
            Swal.fire({
                title: 'Status Unavailable',
                text: 'Unable to fetch system status.',
                icon: 'error',
                confirmButtonColor: '#6366f1'
            });
        }
    });
};

document.addEventListener('DOMContentLoaded', () => {
    initSystemStatus();
});
