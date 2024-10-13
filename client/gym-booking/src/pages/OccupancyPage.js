import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import '../css/OccupancyPage.css';
import { getOccupancy, startUsing, stopUsing } from '../services/occupancyService';

const OccupancyPage = () => {
    const [occupancy, setOccupancy] = useState([]);
    const [userRole, setUserRole] = useState(null);

    useEffect(() => {
        fetchOccupancy();
        // Get the user role from localStorage or from your authentication service
        const role = localStorage.getItem('role'); // Assuming you store the role in localStorage
        setUserRole(role);
    }, []);

    const fetchOccupancy = async () => {
        try {
            const data = await getOccupancy();
            setOccupancy(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error("Error fetching occupancy data: ", error);
        }
    };

    const handleUpdate = async (change, itemID) => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                window.location.href = '/login';
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

    const handleLogout = () => {
        localStorage.removeItem('token');
        window.location.href = '/login';
    };

    function GymList() {
        if (!occupancy || occupancy.length === 0) {
            return <p className="no-gyms">No gyms available.</p>;
        }

        for (let gym of occupancy) {
            for (let item of gym.equipment) {
                item.status = item.inUse ? "In Use" : "Available";
            }
        }

        return (
            <div className="gym-list">
                {occupancy.map((gym, index) => (
                    <div key={index} className="gym-box">
                        <h3>{gym.gymName} ({gym.occupants}/{gym.maxCap})</h3>
                        <ul>
                            {gym.equipment.map((item) => (
                                <li key={item.itemID} className="equipment-item">
                                    <span className="equipment-name">{item.name}</span>
                                    <span className={`equipment-status ${item.inUse ? 'in-use' : 'available'}`}>
                                        {item.status}
                                    </span>
                                    <div className="equipment-buttons">
                                        <button onClick={() => handleUpdate(1, item.itemID)} className="use-button">Use</button>
                                        <button onClick={() => handleUpdate(-1, item.itemID)} className="stop-button">Stop</button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div className="occupancy-page">
            {/* Header with buttons for Admin and Logout */}
            <header className="header">
                <h2>Gym Occupancy</h2>
                <div className="button-group">
                    {/* Conditionally render the "Admin Page" link if the user is an admin */}
                    {userRole === 'admin' && (
                        <Link to="/admin" className="admin-link">Go to Admin Dashboard</Link>
                    )}
                    <button onClick={handleLogout} className="logout-button">Logout</button>
                </div>
            </header>

            <GymList />
        </div>
    );
};

export default OccupancyPage;
