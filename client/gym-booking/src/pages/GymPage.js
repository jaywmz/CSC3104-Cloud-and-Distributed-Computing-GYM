import React, { useEffect, useState } from 'react';
import { getGym, checkIn, checkOut } from '../services/occupancyService';
import { useParams } from 'react-router-dom';

const GymPage = () => {
    const { id } = useParams();
    const [gym, setGym] = useState({});

    useEffect(() => {
        fetchGym();
    }, []);

    const fetchGym = async () => {
        try {
            const gymID = id; // hardcode for test, need to get dynamically but not sure how yet
            const data = await getGym(gymID);
            if (data) { 
                setGym(data);
            }
            else {
                console.log("No gym data found");
                return;
            }
        } catch (error) {
            console.log("Error fetching gym data: ", error);
        }
    };

    // Handles updating of gym occupancy, whether checking in or checking out
    const handleUpdate = async (change, gymID) => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                window.location.href = '/login';  // Redirect to the login page
            }
            
            if (change > 0) {
                await checkIn(token, gymID);
            }
            else if (change < 0) {
                await checkOut(token, gymID);
            }
        }
        catch (err) {
            console.error(err);
        }

        fetchGym(); // Refresh occupancy data
    };

    // Handle logout
    const handleLogout = () => {
        localStorage.removeItem('token'); // Remove the token from localStorage
        window.location.href = '/login';  // Redirect to the login page
    };

    return (
        <div>
            {/* Logout Button */}
            <button onClick={handleLogout} style={{ float: 'right' }}>Logout</button>

            <h2>{gym.gymName}</h2>

            <button onClick={() => handleUpdate(1, gym.gymID)}>Check in</button>
            <button onClick={() => handleUpdate(-1, gym.gymID)}>Check out</button>
        </div>
    );
};

export default GymPage;