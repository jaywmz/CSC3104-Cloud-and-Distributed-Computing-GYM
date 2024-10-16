import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import BookingPage from './pages/BookingPage';
import OccupancyPage from './pages/OccupancyPage';
import AdminPage from './pages/AdminPage';
import GymPage from './pages/GymPage';
import UserPage from './pages/UserPage';
import ProtectedRoute from './components/ProtectedRoute'; // Import ProtectedRoute
import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css';

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
            <ProtectedRoute allowedRoles={['user', 'admin']}>  {/* Allow all users */}
              <BookingPage />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/occupancy" 
          element={
            <ProtectedRoute allowedRoles={['user', 'admin']}> {/* Allow all users for now*/}
              <OccupancyPage />
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/gym/:id" 
          element={
            <ProtectedRoute allowedRoles={['user', 'admin']}> {/* Allow all users for now*/}
              <GymPage />
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={['admin']}> {/* Only allow admins */}
              <AdminPage />
            </ProtectedRoute>
          } 
        />
        
        <Route
          path="/user"
          element={
            <ProtectedRoute allowedRoles={['user', 'admin']}> {/* Allow all users */}
              <UserPage />
            </ProtectedRoute>
          }
        />
      </Routes>

    </Router>
  );
};

export default App;
