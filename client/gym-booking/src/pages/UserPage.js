import 'bootstrap/dist/css/bootstrap.min.css'; // Import Bootstrap
import React, { useEffect, useState } from 'react';
import { jwtDecode } from 'jwt-decode';

const UserPage = () => {
  const [username, setUsername] = useState('');
  const [role, setRole] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      // Decode the token to get the username
      const decodedToken = jwtDecode(token);
      setUsername(decodedToken.username);
      setRole(decodedToken.role);
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = '/login';
  };

  return (
    <div className="container mt-3">
      <div className="card mb-3 shadow-sm rounded">
        <div className="card-body p-2 m-3">
          <h2 className="card-title text-center">Welcome to GymKube, {username}!</h2>
          <nav className="navbar navbar-expand-lg navbar-light bg-light mb-3 shadow-sm p-2">
            <div className="container-fluid">
              <ul className="navbar-nav mx-auto">
                <li className="nav-item"><a className="nav-link" href="/bookings">Bookings</a></li>
                <li className="nav-item"><a className="nav-link" href="/occupancy">Gyms</a></li>
                {role === 'admin' && (
                  <li className="nav-item"><a className="nav-link" href="/admin">Admin Dashboard</a></li>
                )}
              </ul>
            </div>
          </nav>
          <div className="text-center">
            <button onClick={handleLogout} className="btn btn-gradient">Logout</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserPage;