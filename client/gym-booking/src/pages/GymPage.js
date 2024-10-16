import React, { useEffect, useState } from 'react';
import { getGym, checkIn, checkOut } from '../services/occupancyService';
import { useParams } from 'react-router-dom';
import "../css/GymPage.css"

const GymPage = () => {
    const { id } = useParams();
    const [gym, setGym] = useState({});

    useEffect(() => {
        fetchGym();
        // eslint-disable-next-line react-hooks/exhaustive-deps
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
                let response = await checkIn(token, gymID);
                console.log(response);
                if (response === "User has already checked-in to a gym.") {
                    document.getElementById("message").innerHTML = "User has already checked-in to a gym.";
                }
                else {
                    window.location.href = '/occupancy';
                }
            }
            else if (change < 0) {
                let response = await checkOut(token, gymID);
                if (response === "User has not checked-in to this gym before.") {
                    document.getElementById("message").innerHTML = "User has not checked-in to this gym before.";
                }
                else {
                    window.location.href = '/occupancy';
                }
            }
        }
        catch (err) {
            console.error(err);
        }

        
    };

    // Handle logout
    const handleBack = () => {
        window.location.href = '/occupancy';
    };

    return (
        <div id="gym">
            {/* Logout Button */}
            <button onClick={handleBack} id="back-button">Back</button>

            <h1 id="gymName">{gym.gymName}</h1>  

            <div id="buttonGroup">
                <button onClick={() => handleUpdate(1, gym.gymID)} id="checkInBtn">Check in</button>
                <button onClick={() => handleUpdate(-1, gym.gymID)} id="checkOutBtn">Check out</button>
            </div>

            <p id={"message"}></p>
        </div>
    );
};

export default GymPage;