function generateSmartItinerary(destinations, days = 2, maxBudget = 3000, pace = 'moderate') {
    if (!destinations || !Array.isArray(destinations) || destinations.length === 0) {
        return { itinerary: [], totalCost: 0 };
    }

    const placesPerDay = pace === 'relaxed' ? 2 : pace === 'moderate' ? 3 : 4;
    const itinerary = [];
    let totalCost = 0;

    for (let i = 0; i < days; i++) {
        const dayDestinations = destinations.slice(i * placesPerDay, (i + 1) * placesPerDay);
        if (dayDestinations.length === 0) break;

        const dayCost = dayDestinations.reduce((acc, d) => acc + (Number(d.entry_fee_inr) || 0), 0);
        totalCost += dayCost;

        itinerary.push({
            day: i + 1,
            totalHours: (dayDestinations.length * 2.5).toFixed(1),
            dayDistanceKm: (dayDestinations.length * 35).toFixed(0),
            destinations: dayDestinations.map(d => ({
                ...d,
                latitude: Number(d.latitude),
                longitude: Number(d.longitude)
            }))
        });
    }

    return { itinerary, totalCost };
}

module.exports = { generateSmartItinerary };