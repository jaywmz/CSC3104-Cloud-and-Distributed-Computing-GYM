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

// Function to fetch all gyms
export const getGyms = async () => {
  try {
    const response = await axios.get(`${API_URL}/getGyms`);
    return response.data;
  } catch (error) {
    console.error('Error fetching gyms:', error.response || error.message);
    throw error;
  }
};

// Function to fetch user's bookings
export const getUserBookings = async () => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('No token found. Please log in first.');
    }

    const response = await axios.get(`${API_URL}/user`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    return response.data;
  } catch (error) {
    console.error('Error fetching user bookings:', error.response || error.message);
    throw error;
  }
};

// Function to fetch gym's bookings
export const getGymBookings = async (gymId) => {
  try {
    const response = await axios.get(`${API_URL}/gym/${gymId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching gym bookings:', error.response || error.message);
    throw error;
  }
};

// Function to create a new booking
export const createBooking = async (bookingData) => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('No token found. Please log in first.');
    }
    const response = await axios.post(API_URL, bookingData, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error) {
    if (error.response && error.response.status === 409) {
      // Handle duplicate booking error
      throw new Error('Duplicate booking: You already have a booking at the same time and gym.');
    } else {
      console.error('Error creating booking:', error.response || error.message);
      throw error;
    }
  }
};

// Function to update a booking
export const updateBooking = async (bookingId, updatedData) => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('No token found. Please log in first.');
    }
    const response = await axios.put(`${API_URL}/update/${bookingId}`, updatedData, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error) {
    console.error('Error updating booking:', error.response || error.message);
    throw error;
  }
};

// Function to delete a booking
export const deleteBooking = async (bookingId) => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('No token found. Please log in first.');
    }
    const response = await axios.delete(`${API_URL}/delete/${bookingId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error) {
    console.error('Error deleting booking:', error.response || error.message);
    throw error;
  }
};
