import React, { useEffect, useState } from 'react';
import { getOccupancy, startUsing, stopUsing } from '../services/occupancyService';
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

    // Handles updating of gym occupancy, whether checking in or checking out
    const handleUpdate = async (change, itemID) => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                window.location.href = '/login';  // Redirect to the login page
            }
            
            if (change > 0) {
                await startUsing(token, itemID);
            }
            else if (change < 0) {
                await stopUsing(token, itemID);
            }
        }
        catch (err) {
            console.error(err);
        }

        fetchOccupancy(); // Refresh occupancy data
        GymList(); // Refresh gym list HTML list
    };

    // Handle logout
    const handleLogout = () => {
        localStorage.removeItem('token'); // Remove the token from localStorage
        window.location.href = '/login';  // Redirect to the login page
    };

    // Function to create a html list of gyms and their equipment
    function GymList() {
        if (!occupancy || occupancy.length === 0) {
            return <p>No gyms available.</p>;
        }

        // insert status attribute to each equipment item for usage label text
        for (let gym of occupancy) {
            for (let item of gym.equipment) {
                if (item.inUse) {
                    item.status = "in-use";
                }
                else {
                    item.status = "not in-use";
                }
            }
        }

        const list = occupancy.map((gym, index) => 
            <li key={index}>
                <Link to={`/gym-page/${gym.gymID}`}>{gym.gymName}</Link>, {gym.occupants}/{gym.maxCap}
                <ul>
                    {gym.equipment.map((item) => 
                        <li>{item.name}&nbsp;
                            <label id={item.itemID}>{item.status}</label>&nbsp;
                            <button onClick={() => handleUpdate(1, item.itemID)}>Use</button>
                            <button onClick={() => handleUpdate(-1, item.itemID)}>Stop using</button>
                        </li>
                    )}
                </ul>
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
