import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import BookingPage from './pages/BookingPage';
import OccupancyPage from './pages/OccupancyPage';
import ProtectedRoute from './components/ProtectedRoute'; // Import ProtectedRoute

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Protected Routes with role-based access */}
        <Route 
          path="/bookings" 
          element={
            <ProtectedRoute allowedRoles={['user', 'admin']}>  {/* Only allow users */}
              <BookingPage />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/occupancy-page" 
          element={
            <ProtectedRoute allowedRoles={['user', 'admin']}> {/* Only allow admins */}
              <OccupancyPage />
            </ProtectedRoute>
          } 
        />
      </Routes>
    </Router>
  );
};

export default App;
