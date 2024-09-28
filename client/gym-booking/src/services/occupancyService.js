import axios from 'axios';

const API_URL = 'http://localhost:5003/api/occupancy';

export const getOccupancy = async () => {
    const response = await axios.get(API_URL);
    return response.data;
};

export const updateOccupancy = async (change) => {
    const response = await axios.post(API_URL, { change });
    return response.data;
};
