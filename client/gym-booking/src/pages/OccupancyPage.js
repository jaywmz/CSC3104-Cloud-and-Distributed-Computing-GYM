import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../css/OccupancyPage.css';
import { getOccupancy } from '../services/occupancyService';

const OccupancyPage = () => {
    const [occupancy, setOccupancy] = useState([]);
    const [userRole, setUserRole] = useState(null);
    const navigate = useNavigate();

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
        window.location.href = '/';
    };

    // Back button to navigate to /user
    const handleBack = () => {
        navigate('/user');
    };

    function GymList() {
        if (!occupancy || occupancy.length === 0) {
            return <p className="no-gyms">No gyms available.</p>;
        }
    
        return (
            <div className="gym-list row">
                {occupancy.map((gym, index) => (
                    <div key={index} className="gym-box col-md-6 mb-4">
                        <div className="card shadow-lg h-100">
                            <div className="card-body">
                                <h3 className="card-title">
                                    <Link to={`/gym/${gym.gymID}`} className="gym-link">
                                        {gym.gymName} ({gym.occupants}/{gym.maxCap})
                                    </Link>
                                </h3>
                                <ul className="list-group">
                                    {gym.equipment.map((item) => (
                                        <li key={item.itemID} className="list-group-item d-flex justify-content-between">
                                            <span>{item.name}</span>
                                            <span className={`badge ${item.inUse ? 'bg-danger' : 'bg-success'}`}>
                                                {item.inUse ? "In Use" : "Available"}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
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
                        <Link to="/admin" className="btn btn-primary me-2">Go to Admin Dashboard</Link>
                    )}
                    <button onClick={handleLogout} className="btn btn-danger">Logout</button>
                </div>
            </header>

            {/* Gym List */}
            <GymList />
        </div>
    );
};

export default OccupancyPage;
