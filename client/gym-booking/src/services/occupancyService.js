import axios from 'axios';

const GET_OCCUPANCY_API_URL = 'http://localhost:5003/api/occupancy';
const GET_GYM_API_URL = 'http://localhost:5003/api/gym';
const CHECK_IN_API_URL = 'http://localhost:5003/api/check-in';
const CHECK_OUT_API_URL = 'http://localhost:5003/api/check-out';

export const getOccupancy = async () => {
    const response = await axios.get(GET_OCCUPANCY_API_URL);
    return response.data;
};

export const getGym = async (gymID) => {
    const response = await axios.get(GET_GYM_API_URL, { params: {id: gymID} } );
    return response.data;
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