// src/services/MLService.js
import axios from 'axios';

export const fetchPredictions = async (gymID, day_of_week, hour) => {
    try {
        const response = await axios.get('http://localhost:5004/predict', {
            params: {
                gymID,
                day_of_week,
                hour,
            },
        });
        console.log(`Fetched prediction for gymID ${gymID}, day ${day_of_week}, hour ${hour}:`, response.data);
        return response.data;
    } catch (error) {
        console.error(`Error fetching prediction for gymID ${gymID}, day ${day_of_week}, hour ${hour}:`, error);
        return null;
    }
};
