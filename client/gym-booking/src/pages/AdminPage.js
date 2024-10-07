import React, { useEffect, useState } from 'react';

const AdminPage = () => {

    // Handle logout
    const handleLogout = () => {
        localStorage.removeItem('token'); // Remove the token from localStorage
        window.location.href = '/login';  // Redirect to the login page
    };
    
    return (
        <div>
            {/* Logout Button */}
            <button onClick={handleLogout} style={{ float: 'right' }}>Logout</button>

            <h2>Admin Page</h2>

        </div>
    );
};

export default AdminPage;