import axios from 'axios';

const API_URL = 'http://localhost:5002/api/bookings';

export const getBookings = async () => {
  const response = await axios.get(API_URL);
  return response.data;
};

export const createBooking = async (bookingData) => {
  const response = await axios.post(API_URL, bookingData);
  return response.data;
};
