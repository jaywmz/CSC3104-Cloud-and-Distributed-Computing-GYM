import React, { useEffect, useState } from 'react';
import { getOccupancy, updateOccupancy } from '../services/occupancyService';

const OccupancyPage = () => {
  const [occupancy, setOccupancy] = useState({ current: 0, max: 50 });
  const [change, setChange] = useState(1);

  useEffect(() => {
    fetchOccupancy();
  }, []);

  const fetchOccupancy = async () => {
    const data = await getOccupancy();
    setOccupancy(data);
  };

  const handleUpdate = async (change) => {
    await updateOccupancy(change);
    fetchOccupancy(); // Refresh occupancy data
  };

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem('token'); // Remove the token from localStorage
    window.location.href = '/login';  // Redirect to the login page
  };

  return (
    <div>
      <h2>Gym Occupancy</h2>

      {/* Logout Button */}
      <button onClick={handleLogout} style={{ float: 'right' }}>Logout</button>

      <p>
        Current: {occupancy.current} / {occupancy.max}
      </p>
      <button onClick={() => handleUpdate(1)}>Increase Occupancy</button>
      <button onClick={() => handleUpdate(-1)}>Decrease Occupancy</button>
    </div>
  );
};

export default OccupancyPage;