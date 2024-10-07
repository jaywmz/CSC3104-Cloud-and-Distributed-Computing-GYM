import React, { useEffect, useState } from 'react';
import { getOccupancy, checkIn, checkOut } from '../services/occupancyService';
import { Link } from 'react-router-dom';

const OccupancyPage = () => {
    const [occupancy, setOccupancy] = useState([]);

    useEffect(() => {
        fetchOccupancy();
    }, []);

    const fetchOccupancy = async () => {
        try {
            const data = await getOccupancy();  // Ensure this is an async call
            setOccupancy(Array.isArray(data) ? data : []);  // Ensure data is an array
        } catch (error) {
            console.error("Error fetching occupancy data: ", error);
        }
    };

    // // Handles updating of gym occupancy, whether checking in or checking out
    // const handleUpdate = async (change, gymID) => {
    //     try {
    //         const token = localStorage.getItem('token');
    //         if (!token) {
    //             window.location.href = '/login';  // Redirect to the login page
    //         }
            
    //         if (change > 0) {
    //             await checkIn(token, gymID);
    //         }
    //         else if (change < 0) {
    //             await checkOut(token, gymID);
    //         }
    //     }
    //     catch (err) {
    //         console.error(err);
    //     }

    //     fetchOccupancy(); // Refresh occupancy data
    //     GymList(); // Refresh gym list HTML list
    // };

    // Handle logout
    const handleLogout = () => {
        localStorage.removeItem('token'); // Remove the token from localStorage
        window.location.href = '/login';  // Redirect to the login page
    };

    // Function to create a html list of gyms and their capacity
    function GymList() {
        if (!occupancy || occupancy.length === 0) {
            return <p>No gyms available.</p>;
        }

        const list = occupancy.map((gym, index) => 
            <li key={index}>
                <Link to={`/gym-page/${gym.gymID}`}>{gym.gymName}</Link>, {gym.occupants}/{gym.maxCap}
            </li>
        );

        return <ul>{list}</ul>;
    };

    return (
        <div>
            {/* Logout Button */}
            <button onClick={handleLogout} style={{ float: 'right' }}>Logout</button>

            <h2>Gym Occupancy</h2>

            <GymList />
        </div>
    );
};

export default OccupancyPage;
