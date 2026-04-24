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

// Live Weather Widget for Tangail
const initWeatherWidget = async () => {
    // Only show on dashboards, not login page
    if (window.location.pathname === '/' || window.location.pathname === '/index.html') return;

    const nav = document.querySelector('.glass-nav');
    if (!nav) return;

    const weatherContainer = document.createElement('div');
    weatherContainer.className = 'weather-widget';
    weatherContainer.style.cssText = `
        display: flex;
        align-items: center;
        gap: 8px;
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.1);
        padding: 4px 10px;
        border-radius: 20px;
        font-size: 0.85rem;
        color: #e2e8f0;
        margin: 0 auto;
        box-shadow: 0 4px 15px rgba(0,0,0,0.1);
        backdrop-filter: blur(10px);
        white-space: nowrap;
    `;

    const rightSide = nav.querySelector('.d-flex.align-center.gap-3');
    if (rightSide) {
        nav.insertBefore(weatherContainer, rightSide);
    } else {
        nav.appendChild(weatherContainer);
    }

    const updateWeather = async () => {
        try {
            weatherContainer.innerHTML = '<span style="font-size:0.8rem">Loading weather...</span>';
            const res = await fetch('https://api.open-meteo.com/v1/forecast?latitude=24.2513&longitude=89.9167&current=temperature_2m,weather_code&timezone=auto');
            const data = await res.json();

            const temp = data.current.temperature_2m;
            const code = data.current.weather_code;

            // Map WMO weather codes to emojis
            let icon = '🌤️';
            let desc = 'Clear';
            if (code <= 1) { icon = '☀️'; desc = 'Clear'; }
            else if (code <= 3) { icon = '⛅'; desc = 'Partly Cloudy'; }
            else if (code <= 48) { icon = '🌫️'; desc = 'Fog'; }
            else if (code <= 55) { icon = '🌧️'; desc = 'Drizzle'; }
            else if (code <= 65) { icon = '🌧️'; desc = 'Rain'; }
            else if (code <= 77) { icon = '❄️'; desc = 'Snow'; }
            else if (code <= 82) { icon = '🌦️'; desc = 'Showers'; }
            else { icon = '⛈️'; desc = 'Thunderstorm'; }

            weatherContainer.innerHTML = `
                <span title="Tangail, Bangladesh" style="font-weight:600; color:var(--primary)">Tangail</span>
                <span style="font-size: 1.2rem">${icon}</span>
                <span style="font-weight: bold">${temp}°C</span>
                <span style="font-size: 0.75rem; color: #94a3b8; margin-left:4px;">${desc}</span>
            `;
        } catch (e) {
            weatherContainer.innerHTML = '<span style="font-size:0.8rem; color:#f87171">Weather Unavailable</span>';
        }
    };

    updateWeather();
    // Update every 30 minutes
    setInterval(updateWeather, 30 * 60 * 1000);
};

document.addEventListener('DOMContentLoaded', () => {
    initCrisisAlert();
    initWeatherWidget();
});
