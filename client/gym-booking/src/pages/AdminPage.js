import React, { useEffect, useState } from 'react';
import '../css/AdminPage.css'; // Link to external CSS for styling

const AdminPage = () => {
    const [gymName, setGymName] = useState('');
    const [maxCap, setMaxCap] = useState('');

    const [equipmentName, setEquipmentName] = useState('');
    const [equipmentType, setEquipmentType] = useState('');
    const [gymID, setGymID] = useState('');
    const [purpose, setPurpose] = useState('');

    const [gyms, setGyms] = useState([]); // Store the list of gyms

    // Fetch the list of gyms when the component loads
    useEffect(() => {
        const fetchGyms = async () => {
            try {
                const response = await fetch('http://localhost:5003/api/get-gyms'); // Replace with your backend route
                const data = await response.json();
                setGyms(data); // Set the gyms in state
            } catch (error) {
                console.error('Error fetching gyms:', error);
            }
        };

        fetchGyms();
    }, []); // Empty dependency array ensures this runs only once when the component mounts

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
            } else {
                alert('Failed to create gym');
            }
        } catch (error) {
            console.error('Error creating gym:', error);
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

    return (
        <div className="admin-page-container">
            {/* Header with Logout Button */}
            <header className="header">
                <h2>Admin Dashboard</h2>
                <button className="logout-button" onClick={handleLogout}>Logout</button>
            </header>

            <div className="form-container">
                {/* Form for creating gym */}
                <div className="form-box">
                    <h3>Create Gym</h3>
                    <input 
                        type="text" 
                        placeholder="Gym Name" 
                        value={gymName} 
                        onChange={(e) => setGymName(e.target.value)} 
                        className="form-input"
                    />
                    <input 
                        type="number" 
                        placeholder="Max Capacity" 
                        value={maxCap} 
                        onChange={(e) => setMaxCap(e.target.value)} 
                        className="form-input"
                    />
                    <button className="create-button" onClick={handleCreateGym}>Create Gym</button>
                </div>

                {/* Form for creating equipment */}
                <div className="form-box">
                    <h3>Create Equipment</h3>
                    <input 
                        type="text" 
                        placeholder="Equipment Name" 
                        value={equipmentName} 
                        onChange={(e) => setEquipmentName(e.target.value)} 
                        className="form-input"
                    />
                    <input 
                        type="text" 
                        placeholder="Equipment Type" 
                        value={equipmentType} 
                        onChange={(e) => setEquipmentType(e.target.value)} 
                        className="form-input"
                    />
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
                    <input 
                        type="text" 
                        placeholder="Purpose" 
                        value={purpose} 
                        onChange={(e) => setPurpose(e.target.value)} 
                        className="form-input"
                    />
                    <button className="create-button" onClick={handleCreateEquipment}>Create Equipment</button>
                </div>
            </div>
        </div>
    );
};

export default AdminPage;
