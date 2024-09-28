import React, { useState } from 'react';
import { loginUser } from '../services/userService';
import { useNavigate } from 'react-router-dom'; // Import the useNavigate hook

const LoginPage = () => {
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [message, setMessage] = useState('');
  const navigate = useNavigate(); // Initialize useNavigate for redirection

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCredentials({ ...credentials, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await loginUser(credentials);
      
      // Store the token in localStorage
      localStorage.setItem('token', response.token);
      setMessage('Login successful!');
      
      // Redirect user based on role
      const decodedToken = JSON.parse(atob(response.token.split('.')[1])); // Decode JWT token
      if (decodedToken.role === 'admin') {
        navigate('/occupancy-page'); // Use navigate to redirect to occupancy page for admin users
      } else {
        navigate('/bookings'); // Use navigate to redirect to the booking page for regular users
      }
      
    } catch (error) {
      setMessage('Login failed. Please check your credentials.');
    }
  };

  return (
    <div>
      <h2>Login</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          name="username"
          placeholder="Username"
          value={credentials.username}
          onChange={handleChange}
        />
        <input
          type="password"
          name="password"
          placeholder="Password"
          value={credentials.password}
          onChange={handleChange}
        />
        <button type="submit">Login</button>
      </form>
      {message && <p>{message}</p>}
    </div>
  );
};

export default LoginPage;
