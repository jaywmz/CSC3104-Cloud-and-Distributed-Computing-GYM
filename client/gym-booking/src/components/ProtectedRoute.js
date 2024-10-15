import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';

// Decode the JWT token
const decodeToken = (token) => {
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch (e) {
    return null;
  }
};

// Check if the token is expired
const isTokenExpired = (token) => {
  const decodedToken = decodeToken(token);
  if (!decodedToken) return true;

  const currentTime = Date.now() / 1000; // Convert current time to seconds
  return decodedToken.exp < currentTime;  // Check if the expiration time has passed
};

const ProtectedRoute = ({ children, allowedRoles }) => {
  const token = localStorage.getItem('token'); // Retrieve token from localStorage
  const [userRole, setUserRole] = useState(null); // Store user role from token

  useEffect(() => {
    if (token && !isTokenExpired(token)) {
      // Decode the token and set the user's role
      const decoded = decodeToken(token);
      setUserRole(decoded?.role);
    }
  }, [token]);

  // If no token or the token is expired, redirect to the login page
  if (!token || isTokenExpired(token)) {
    localStorage.removeItem('token'); // Remove expired token
    return <Navigate to="/login" replace />;
  }

  // If the user's role is not in the list of allowedRoles, redirect to unauthorized page
  if (userRole && !allowedRoles.includes(userRole)) {
    return <Navigate to="/unauthorized" replace />;
  }

  // If token exists and role is allowed, render the requested component
  return children;
};

export default ProtectedRoute;
