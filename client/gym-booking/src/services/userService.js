import axios from 'axios';

const API_URL = 'http://localhost:5001/api/users';

// Helper function to handle token expiration and logout
const handleTokenExpiration = (error) => {
  if (error.response && error.response.status === 401) {
    // Token is expired or invalid, log out the user
    localStorage.removeItem('token');
    window.location.href = '/login';
  }
};

// Function to handle login
export const loginUser = async (credentials) => {
  try {
    const response = await axios.post(`${API_URL}/login`, credentials);
    const { token } = response.data;
    localStorage.setItem('token', token);  // Store the token in localStorage
    return response.data;  // Return the entire response
  } catch (error) {
    console.error('Login failed', error);
    throw new Error('Login failed. Please check your credentials.');
  }
};

// Function to register a new user
export const registerUser = async (userData) => {
  try {
    const response = await axios.post(`${API_URL}/register`, userData);
    return response.data;
  } catch (error) {
    console.error('Registration failed', error);
    throw new Error('Registration failed.');
  }
};

// Function to retrieve the Admin Dashboard, requires token
export const getAdminDashboard = async () => {
  const token = localStorage.getItem('token');

  if (!token) {
    throw new Error('No token found. Please log in first.');
  }

  try {
    const response = await axios.get(`${API_URL}/admin-dashboard`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;  // Return the data for the Admin Dashboard
  } catch (error) {
    handleTokenExpiration(error);  // Handle expired token
    console.error('Failed to retrieve admin dashboard', error);
    throw new Error('Failed to retrieve admin dashboard.');
  }
};

// Function to fetch user bookings with token expiry handling
export const getUserBookings = async () => {
  const token = localStorage.getItem('token');

  if (!token) {
    throw new Error('No token found. Please log in first.');
  }

  try {
    const response = await axios.get(`${API_URL}/user-bookings`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error) {
    handleTokenExpiration(error);  // Handle expired token
    throw error;
  }
};
