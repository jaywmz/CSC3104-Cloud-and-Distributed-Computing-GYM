import axios from 'axios';

// The backend URL for the booking-service
const API_URL = 'http://localhost:5002/api/bookings';

// Function to fetch all bookings
export const getBookings = async () => {
  try {
    const response = await axios.get(API_URL);
    return response.data;
  } catch (error) {
    console.error('Error fetching bookings:', error.response || error.message);
    throw error;
  }
};

// Function to create a new booking
export const createBooking = async (bookingData) => {
  try {
    const response = await axios.post(API_URL, bookingData);
    return response.data;
  } catch (error) {
    console.error('Error creating booking:', error.response || error.message);
    throw error;
  }
};
