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
  const [showPrompt, setShowPrompt] = useState(false); // State to show the prompt
  const [redirectToLogin, setRedirectToLogin] = useState(false); // State to manage redirect

  useEffect(() => {
    if (!token || isTokenExpired(token)) {
      // Show a confirmation prompt when the token is expired or missing
      setShowPrompt(true);
    }
  }, [token]);

  // Handle user confirmation to redirect
  const handleConfirmRedirect = () => {
    localStorage.removeItem('token'); // Remove expired token
    setRedirectToLogin(true); // Set the redirect flag to true
  };

  // Decode the token to get the user's role
  const decodedToken = decodeToken(token);

  // If there's no token or the token is expired, or user has confirmed redirect, navigate to login
  if (redirectToLogin) {
    return <Navigate to="/login" replace />;
  }

  // If the user cancels the prompt, you can keep them on the current page or handle accordingly
  if (showPrompt) {
    return (
      <div>
        <p>Your session has expired. Please log in again.</p>
        <button onClick={handleConfirmRedirect}>OK</button>
      </div>
    );
  }

  // Check if the user's role is in the list of allowedRoles
  if (!allowedRoles.includes(decodedToken?.role)) {
    return <Navigate to="/unauthorized" replace />; // Redirect to unauthorized page if role is not allowed
  }

  // If token exists and role is allowed, render the requested component
  return children;
};

export default ProtectedRoute;
