import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../css/OccupancyPage.css';
import { getOccupancy } from '../services/occupancyService';
import {jwtDecode} from 'jwt-decode'; // Import jwtDecode for decoding token

const OccupancyPage = () => {
    const [occupancy, setOccupancy] = useState([]);
    const [userRole, setUserRole] = useState(null);
    const [username, setUsername] = useState(''); // New state for storing the username
    const navigate = useNavigate();

    useEffect(() => {
        
        const token = localStorage.getItem('token'); // Assuming you store the role in localStorage
        if (token) {
            try {
                const decodedToken = jwtDecode(token); // Decode the token to get the username and role
                setUsername(decodedToken.username); // Set the username from the token
                setUserRole(decodedToken.role);
            } catch (error) {
                console.error("Invalid token", error);
                localStorage.removeItem('token'); // Clear invalid token
                navigate('/login'); // Redirect to login
            }
        }
        fetchOccupancy();

        // Polling the backend every few seconds to fetch updated occupancy data
        const intervalId = setInterval(() => {
            fetchOccupancy();
        }, 5000); // Fetch occupancy every 5 seconds

        return () => clearInterval(intervalId); // Cleanup interval on component unmount
    }, [navigate]);

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
            {/* Navbar like in BookingPage */}
            <nav className="navbar navbar-expand-lg navbar-light bg-light mb-3 shadow-sm p-2">
                <div className="container-fluid">
                    <a className="navbar-brand" href="/user">GymKube</a>
                    <ul className="navbar-nav me-auto">
                        <li className="nav-item"><Link className="nav-link" to="/bookings">Bookings</Link></li>
                        <li className="nav-item"><Link className="nav-link" to="/occupancy">Gyms</Link></li>
                        {userRole === 'admin' && (
                            <li className="nav-item"><Link className="nav-link" to="/admin">Admin Dashboard</Link></li>
                        )}
                    </ul>
                    <div className="collapse navbar-collapse" id="navbarNav">
                        <ul className="navbar-nav ms-auto">
                            <li className="nav-item">
                                {/* Display the username here */}
                                <span className="navbar-text me-3">Logged in as: <strong>{username}</strong></span>
                            </li>
                            <li className="nav-item">
                                <button onClick={handleLogout} className="btn btn-gradient btn-sm">Logout</button>
                            </li>
                        </ul>
                    </div>
                </div>
            </nav>

            {/* Gym List */}
            <GymList />
        </div>
    );
};

export default OccupancyPage;
