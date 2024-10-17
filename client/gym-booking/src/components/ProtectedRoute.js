import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

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

// Unauthorized component to display the error and provide a back button
const Unauthorized = () => {
  const navigate = useNavigate();

  // Function to go back to the previous page
  const handleGoBack = () => {
    navigate(-1);  // This navigates back to the previous page in history
  };
  return (
    <div style={{ textAlign: 'center', marginTop: '50px' }}>
      <h1>Error 401 - Unauthorized</h1>
      <p>Sorry, your request could not be processed.</p>
      {/* Change the button to a link that goes back to the previous page */}
      <a onClick={handleGoBack} style={{ cursor: 'pointer', color: 'blue', textDecoration: 'underline' }}>
        Return
      </a>
    </div>
  );
};

// Token expired component
const TokenExpired = () => {
  const navigate = useNavigate();

  const handleLogin = () => {
    navigate('/login'); // Navigate to the login page
  };

  return (
    <div style={{ textAlign: 'center', marginTop: '50px' }}>
      <h1>Session Expired</h1>
      <p>Your session has expired. Please log in again.</p>
      <a onClick={handleLogin} style={{ cursor: 'pointer', color: 'blue', textDecoration: 'underline' }}>
        Go to Login
      </a>
    </div>
  );
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

  // If no token or the token is expired, display 401 Unauthorized message
  if (!token || isTokenExpired(token)) {
    localStorage.removeItem('token'); // Remove expired token
    return <TokenExpired />;  // Display 401 Unauthorized message
  }

  // If the user's role is not in the list of allowedRoles, display 401 Unauthorized message
  if (userRole && !allowedRoles.includes(userRole)) {
    return <Unauthorized />;  // Display 401 Unauthorized message
  }


  // If token exists and role is allowed, render the requested component
  return children;
};

export default ProtectedRoute;
