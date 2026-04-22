exports.getCrisisAlerts = async (req, res) => {
    try {
        // In a real scenario, this would fetch from ReliefWeb, OpenWeatherMap, or an internal AI model.
        // We will simulate a crisis API response.
        const mockAlerts = [
            {
                id: 1,
                severity: 'HIGH',
                type: 'WEATHER',
                message: 'Severe thunderstorms expected this afternoon. Campus may switch to online mode.',
                timestamp: new Date().toISOString()
            },
            {
                id: 2,
                severity: 'MEDIUM',
                type: 'SYSTEM',
                message: 'Routine maintenance at 10 PM. No class disruptions expected.',
                timestamp: new Date(Date.now() - 86400000).toISOString()
            }
        ];

        // Simulate fetching time
        await new Promise(resolve => setTimeout(resolve, 500));

        res.json({
            status: 'success',
            alerts: mockAlerts
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};
