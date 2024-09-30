import React, { useEffect, useState } from 'react';
import { getOccupancy, checkIn, checkOut } from '../services/occupancyService';

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

    const handleUpdate = async (change) => {
        // TO-DO:
        // get userID and gymID programmatically and remove hardcoded IDs
        // validate user's userID with user microservice using gRPC

        const userID = 2;
        const gymID = 1;

        if (change > 0) {
            await checkIn(userID, gymID);
        }
        else if (change < 0) {
            await checkOut(userID, gymID);
        }

        fetchOccupancy(); // Refresh occupancy data
        GymList(); // Refresh gym list
    };

    function GymList() {
        if (!occupancy || occupancy.length === 0) {
            return <p>No gyms available.</p>;
        }

        const list = occupancy.map((gym, index) => 
            <li key={index}>
                {gym.gymName}, {gym.occupants}/{gym.maxCap}
            </li>
        );

        return <ul>{list}</ul>;
    };

    return (
        <div>
            <h2>Gym Occupancy</h2>

            <GymList />

            <button onClick={() => handleUpdate(1)}>Increase Occupancy</button>
            <button onClick={() => handleUpdate(-1)}>Decrease Occupancy</button>
        </div>
    );
};

export default OccupancyPage;
