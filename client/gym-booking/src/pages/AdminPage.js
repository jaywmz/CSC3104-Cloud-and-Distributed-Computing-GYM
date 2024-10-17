import React, { useEffect, useState } from 'react';
import '../css/AdminPage.css'; // Link to external CSS for styling
import { getAllBookings } from '../services/occupancyService';
import { useNavigate } from 'react-router-dom';

const AdminPage = () => {
    const [activeTab, setActiveTab] = useState('createGym'); // Manage active tab
    const [gymName, setGymName] = useState('');
    const [maxCap, setMaxCap] = useState('');
    const [equipmentName, setEquipmentName] = useState('');
    const [equipmentType, setEquipmentType] = useState('');
    const [gymID, setGymID] = useState('');
    const [purpose, setPurpose] = useState('');
    const [bookings, setBookings] = useState([]); // Store the list of bookings
    const [gyms, setGyms] = useState([]); // Store the list of gyms
    const [loadingGyms, setLoadingGyms] = useState(false);
    const [loadingBookings, setLoadingBookings] = useState(false);
    const [error, setError] = useState('');

    const navigate = useNavigate(); // For back navigation

    // Fetch the list of gyms when the component loads
    useEffect(() => {
        fetchGyms();
    }, []); // Empty dependency array ensures this runs only once when the component mounts

    const fetchGyms = async () => {
        setLoadingGyms(true);
        try {
            const response = await fetch('http://localhost:5003/api/get-gyms'); // Replace with your backend route
            const data = await response.json();
            setGyms(data); // Set the gyms in state
        } catch (error) {
            setError('Error fetching gyms.');
            console.error('Error fetching gyms:', error);
        } finally {
            setLoadingGyms(false);
        }
    };

    // Fetch all bookings when the component loads
    useEffect(() => {
        const fetchBookings = async () => {
            setLoadingBookings(true);
            try {
                const bookings = await getAllBookings(); // Fetch bookings using the middleware
                setBookings(bookings); // Set the bookings in state
            } catch (error) {
                setError('Error fetching bookings.');
                console.error('Error fetching bookings:', error);
            } finally {
                setLoadingBookings(false);
            }
        };

        fetchBookings();
    }, []);

    // Handle gym creation
    const handleCreateGym = async () => {
        if (!gymName || !maxCap) {
            alert('Please fill in all fields for the gym');
            return;
        }

        try {
            const response = await fetch('http://localhost:5003/api/create-gym', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ gymName, maxCap }),
            });

            if (response.ok) {
                alert('Gym created successfully!');
                setGymName('');
                setMaxCap('');
                fetchGyms(); // Refresh gyms list after creation
            } else {
                alert('Failed to create gym');
            }
        } catch (error) {
            console.error('Error creating gym:', error);
        }
    };

    // Handle gym editing
    const handleEditGym = async (gymID) => {
        const gymToEdit = gyms.find(gym => gym.gymID === gymID);
        if (!gymToEdit) {
            alert('Gym not found');
            return;
        }

        setGymName(gymToEdit.gymName);
        setMaxCap(gymToEdit.maxCap);
        setGymID(gymToEdit.gymID);
        setActiveTab('editGym');
    };

    const handleUpdateGym = async () => {
        if (!gymName || !maxCap || !gymID) {
            alert('Please fill in all fields for the gym');
            return;
        }

        try {
            const response = await fetch(`http://localhost:5003/api/edit-gym/${gymID}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ gymName, maxCap }),
            });

            if (response.ok) {
                alert('Gym updated successfully!');
                setGymName('');
                setMaxCap('');
                fetchGyms(); // Refresh gyms list after update
                setActiveTab('createGym');
            } else {
                alert('Failed to update gym');
            }
        } catch (error) {
            console.error('Error updating gym:', error);
        }
    };

    // Handle gym deletion
    const handleDeleteGym = async (gymID) => {
        const confirmDelete = window.confirm("Are you sure you want to delete this gym?");
        if (!confirmDelete) return;

        try {
            const response = await fetch(`http://localhost:5003/api/delete-gym/${gymID}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                alert('Gym deleted successfully!');
                fetchGyms(); // Refresh gyms list after deletion
            } else {
                alert('Failed to delete gym');
            }
        } catch (error) {
            console.error('Error deleting gym:', error);
        }
    };

    // Handle equipment creation
    const handleCreateEquipment = async () => {
        if (!equipmentName || !equipmentType || !gymID || !purpose) {
            alert('Please fill in all fields for the equipment');
            return;
        }

        try {
            const response = await fetch('http://localhost:5003/api/create-equipment', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ equipmentName, equipmentType, gymID, purpose }),
            });

            if (response.ok) {
                alert('Equipment created successfully!');
                setEquipmentName('');
                setEquipmentType('');
                setGymID('');
                setPurpose('');
            } else {
                alert('Failed to create equipment');
            }
        } catch (error) {
            console.error('Error creating equipment:', error);
        }
    };

    // Handle logout
    const handleLogout = () => {
        localStorage.removeItem('token');
        window.location.href = '/login';
    };

    // Back button handler: go to the previous page
    const handleBack = () => {
        navigate(-1); // Navigate to previous page
    };

    // Map the gym ID from bookings to gym name
    const getGymDetailsById = (gymId) => {
        const gym = gyms.find(gym => gym.gymID === gymId);
        return gym ? { gymName: gym.gymName, gymID: gym.gymID } : { gymName: 'Unknown Gym', gymID: gymId };
    };

    // Render tab content based on the active tab
    const renderTabContent = () => {
        if (activeTab === 'createGym' || activeTab === 'editGym') {
            return (
                <div className="form-box">
                    <h3>{activeTab === 'editGym' ? 'Edit Gym' : 'Create Gym'}</h3>
                    <input 
                        type="text" 
                        placeholder="Gym Name" 
                        value={gymName} 
                        onChange={(e) => setGymName(e.target.value)} 
                        className="form-input"
                    />
                    <select
                        value={maxCap}
                        onChange={(e) => setMaxCap(e.target.value)}
                        className="form-input"
                    >
                        <option value="">Select Max Capacity</option>
                        <option value="20">20</option>
                        <option value="30">30</option>
                        <option value="50">50</option>
                        <option value="100">100</option>
                    </select>
                    <button className="create-button" onClick={activeTab === 'editGym' ? handleUpdateGym : handleCreateGym}>
                        {activeTab === 'editGym' ? 'Update Gym' : 'Create Gym'}
                    </button>
                </div>
            );
        } else if (activeTab === 'createEquipment') {
            return (
                <div className="form-box">
                    <h3>Create Equipment</h3>
                    <input 
                        type="text" 
                        placeholder="Equipment Name" 
                        value={equipmentName} 
                        onChange={(e) => setEquipmentName(e.target.value)} 
                        className="form-input"
                    />
                    <select 
                        value={equipmentType} 
                        onChange={(e) => setEquipmentType(e.target.value)} 
                        className="form-input"
                    >
                        <option value="">Select Equipment Type</option>
                        <option value="Treadmill">Treadmill</option>
                        <option value="Dumbbell">Dumbbell</option>
                        <option value="Bench Press">Bench Press</option>
                        <option value="Stationary Bike">Stationary Bike</option>
                        <option value="Rowing Machine">Rowing Machine</option>
                        <option value="Leg Press">Leg Press</option>
                    </select>
                    {loadingGyms ? (
                        <p>Loading gyms...</p>
                    ) : (
                        <select 
                            value={gymID} 
                            onChange={(e) => setGymID(e.target.value)} 
                            className="form-input"
                        >
                            <option value="">Select Gym</option>
                            {gyms.map(gym => (
                                <option key={gym.gymID} value={gym.gymID}>
                                    {gym.gymName}
                                </option>
                            ))}
                        </select>
                    )}
                    <select
                        value={purpose}
                        onChange={(e) => setPurpose(e.target.value)}
                        className="form-input"
                    >
                        <option value="">Select Purpose</option>
                        <option value="Cardio">Cardio</option>
                        <option value="Strength">Strength</option>
                        <option value="Flexibility">Flexibility</option>
                    </select>
                    <button className="create-button" onClick={handleCreateEquipment}>Create Equipment</button>
                </div>
            );
        } else if (activeTab === 'viewBookings') {
            return (
                <div className="form-box">
                    <h3>All Bookings</h3>
                    {loadingBookings ? (
                        <p>Loading bookings...</p>
                    ) : (
                        <table className="booking-table">
                            <thead>
                                <tr>
                                    <th>User</th>
                                    <th>Slot</th>
                                    <th>Gym Name</th>
                                    <th>Gym ID</th>
                                </tr>
                            </thead>
                            <tbody>
                                {bookings.map((booking) => {
                                    const gymDetails = getGymDetailsById(booking.gymId);
                                    return (
                                        <tr key={booking.id}>
                                            <td>{booking.user}</td>
                                            <td>{booking.slot}</td>
                                            <td>{gymDetails.gymName}</td>
                                            <td>{gymDetails.gymID}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
                </div>
            );
        } else if (activeTab === 'manageGyms') {
            return (
                <div className="form-box">
                    <h3>Manage Gyms</h3>
                    <ul className="gym-list">
                        {gyms.map((gym) => (
                            <li key={gym.gymID}>
                                {gym.gymName} (Gym ID: {gym.gymID}, Max Capacity: {gym.maxCap})
                                <button className="edit-button" onClick={() => handleEditGym(gym.gymID)}>Edit</button>
                                <button className="delete-button" onClick={() => handleDeleteGym(gym.gymID)}>Delete</button>
                            </li>
                        ))}
                    </ul>
                </div>
            );
        }
    };

    return (
        <div className="admin-page-container">
            {/* Back Button */}
            <div className="back-button-container">
                <button className="back-button" onClick={handleBack}>
                    &larr; Back
                </button>
            </div>

            {/* Header with Logout Button */}
            <header className="header">
                <h2>Admin Dashboard</h2>
                <button className="logout-button" onClick={handleLogout}>Logout</button>
            </header>

            {/* Tabs for navigation */}
            <nav className="tabs">
                <button
                    className={activeTab === 'createGym' ? 'active' : ''}
                    onClick={() => setActiveTab('createGym')}
                >
                    Create Gym
                </button>
                <button
                    className={activeTab === 'createEquipment' ? 'active' : ''}
                    onClick={() => setActiveTab('createEquipment')}
                >
                    Create Equipment
                </button>
                <button
                    className={activeTab === 'manageGyms' ? 'active' : ''}
                    onClick={() => setActiveTab('manageGyms')}
                >
                    Manage Gyms
                </button>
                <button
                    className={activeTab === 'viewBookings' ? 'active' : ''}
                    onClick={() => setActiveTab('viewBookings')}
                >
                    View Bookings
                </button>
            </nav>

            {/* Render content based on selected tab */}
            <div className="tab-content">
                {error && <p className="error">{error}</p>}
                {renderTabContent()}
            </div>
        </div>
    );
};

export default AdminPage;
