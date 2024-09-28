import React from 'react';
import { Navigate } from 'react-router-dom';

// ProtectedRoute component with role-based access control
const ProtectedRoute = ({ children, allowedRoles }) => {
  const token = localStorage.getItem('token'); // Check if token is present in localStorage

  // If there's no token, redirect to login page
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // Decode the token to get the user's role
  const decodedToken = JSON.parse(atob(token.split('.')[1])); // Decode the JWT token

  // Check if the user's role is in the list of allowedRoles
  if (!allowedRoles.includes(decodedToken.role)) {
    return <Navigate to="/unauthorized" replace />; // Redirect to unauthorized page if role is not allowed
  }

  // If token exists and role is allowed, render the requested component
  return children;
};

export default ProtectedRoute;
