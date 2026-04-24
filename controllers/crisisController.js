exports.getCrisisAlerts = async (req, res) => {
    try {
        // Tangail, Bangladesh Coordinates
        const latitude = 24.25;
        const longitude = 89.9167;
        
        let alerts = [];

        try {
            // Fetch real-time weather data for Tangail using Open-Meteo
            const response = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true`);
            if (response.ok) {
                const data = await response.json();
                const current = data.current_weather;
                
                // Example logic: High wind or specific weather codes (e.g., rain/thunderstorm > 60)
                if (current.windspeed > 40 || current.weathercode >= 61) {
                    alerts.push({
                        id: Date.now(),
                        severity: 'HIGH',
                        type: 'WEATHER',
                        message: `WARNING (Tangail, Bangladesh): Severe weather conditions detected (Wind: ${current.windspeed}km/h). All classes are shifted ONLINE immediately for safety.`,
                        timestamp: new Date().toISOString()
                    });
                } else {
                    alerts.push({
                        id: Date.now(),
                        severity: 'INFO',
                        type: 'WEATHER',
                        message: `Tangail, Bangladesh: Weather is clear (Temp: ${current.temperature}°C). Classes proceed as normally scheduled on campus.`,
                        timestamp: new Date().toISOString()
                    });
                }
            }
        } catch (fetchError) {
            console.error('Failed to fetch weather data:', fetchError);
            // Fallback mock alert if API fails
            alerts.push({
                id: 1,
                severity: 'HIGH',
                type: 'WEATHER',
                message: 'EMERGENCY: Flood warning in Tangail, Bangladesh. All physical classes are suspended and shifted online.',
                timestamp: new Date().toISOString()
            });
        }

        res.json({
            status: 'success',
            alerts: alerts
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};
