import axios from 'axios';

const API_URL = 'http://localhost:5001/api/users';

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
    console.error('Failed to retrieve admin dashboard', error);
    throw new Error('Failed to retrieve admin dashboard.');
  }
};
