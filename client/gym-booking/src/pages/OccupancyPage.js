import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import '../css/OccupancyPage.css';
import { getOccupancy } from '../services/occupancyService';

const OccupancyPage = () => {
    const [occupancy, setOccupancy] = useState([]);
    const [userRole, setUserRole] = useState(null);

    useEffect(() => {
        fetchOccupancy();
        const role = localStorage.getItem('role'); // Assuming you store the role in localStorage
        setUserRole(role);

        // Polling the backend every few seconds to fetch updated occupancy data
        const intervalId = setInterval(() => {
            fetchOccupancy();
        }, 5000); // Fetch occupancy every 5 seconds

        return () => clearInterval(intervalId); // Cleanup interval on component unmount
    }, []);

    const fetchOccupancy = async () => {
        try {
            const data = await getOccupancy();
            setOccupancy(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error("Error fetching occupancy data: ", error);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        window.location.href = '/login';
    };

    function GymList() {
        if (!occupancy || occupancy.length === 0) {
            return <p className="no-gyms">No gyms available.</p>;
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
                                        {item.inUse ? "In Use" : "Available"}
                                    </span>
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
            <header className="header">
                <h2>Gym Occupancy</h2>
                <div className="button-group">
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
