import axios from 'axios';

const GET_ALL_GYMS_API_URL = 'http://localhost:5003/api/all-gyms';
const GET_GYM_API_URL = 'http://localhost:5003/api/gym';
const CREATE_GYM_API_URL = 'http://localhost:5003/api/create-gym';
const DELETE_GYM_API_URL = 'http://localhost:5003/api/delete-gym';
const CHECK_IN_API_URL = 'http://localhost:5003/api/check-in';
const CHECK_OUT_API_URL = 'http://localhost:5003/api/check-out';
const START_USING_API_URL = 'http://localhost:5003/api/start-using';
const STOP_USING_API_URL = 'http://localhost:5003/api/stop-using';
// const GET_ALL_BOOKINGS_API_URL = 'http://localhost:5003/api/get-all-bookings';


// export const getAllBookings = async () => {
//     try {
//         const response = await axios.get(GET_ALL_BOOKINGS_API_URL);
//         return response.data; // Return the list of bookings
//     } catch (error) {
//         console.error('Error fetching bookings:', error);
//         throw new Error('Failed to fetch bookings.');
//     }
// };

export const getAllGyms = async () => {
    const response = await axios.get(GET_ALL_GYMS_API_URL);
    return response.data;
};

export const getGym = async (gymID) => {
    const response = await axios.get(GET_GYM_API_URL, { params: {id: gymID} } );
    return response.data;
};

export const createGym = async (gymID, maxCap) => {
    const reqParams = [gymID, maxCap];
    const response = await axios.post(CREATE_GYM_API_URL, reqParams);
    return response;
};

export const deleteGym = async (gymID) => {
    const response = await axios.delete(DELETE_GYM_API_URL, { params : { gymID } });
    return response;
};

export const checkIn = async (token, gymID) => {
    const reqParams = [token, gymID];
    const response = await axios.post(CHECK_IN_API_URL, reqParams);
    return response.data;
};

export const checkOut = async (token, gymID) => {
    const reqParams = [token, gymID];
    const response = await axios.post(CHECK_OUT_API_URL, reqParams);
    return response.data;
};

// export const startUsing = async (token, itemID) => {
//     const reqParams = [token, itemID];
//     const response = await axios.post(START_USING_API_URL, reqParams);
//     return response.data;
// };

// export const stopUsing = async (token, itemID) => {
//     const reqParams = [token, itemID];
//     const response = await axios.post(STOP_USING_API_URL, reqParams);
//     return response.data;
// };