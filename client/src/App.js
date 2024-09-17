import React, { useState } from "react";
import GymFloorPlan from "./components/GymFloorPlan"; // Your existing gym floor plan
import Modal from "./components/modal";
import "./styles.css";

export default function App() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [isTestModalOpen, setIsTestModalOpen] = useState(false);

  const testConnectionBook = async () => {
    try{
      // Call the booking service
      const response = await fetch("http://localhost:3002/test", {
        method: "GET",
        headers: {
          "Content-Type": "application/json"
        }
      });

      const data = await response.json();
      setMessage(data.message);
      setIsTestModalOpen(true);
    }catch(err){
      console.error(err);
    }
  }

  const testConnectionOccu = async () => {
    try{
      // Call the occupancy service
      const response = await fetch("http://localhost:3003/test", {
        method: "GET",
        headers: {
          "Content-Type": "application/json"
        }
      });

      const data = await response.json();
      setMessage(data.message);
      setIsTestModalOpen(true);
    }catch(err){
      console.error(err);
    }
  }

  const testConnectionUser = async () => {
    try{
      // Call the user service
      const response = await fetch("http://localhost:3001/test", {
        method: "GET",
        headers: {
          "Content-Type": "application/json"
        }
      });

      const data = await response.json();
      setMessage(data.message);
      setIsTestModalOpen(true);
    }catch(err){
      console.error(err);
    }
  }

  return (
    <div className="App">
      <h2>Gym Occupancy Floor Plan</h2>
      <button onClick={() => setIsModalOpen(true)}>Open Gym Floor Plan</button>

      {/* Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <h2>Gym Floor Plan</h2>
        <GymFloorPlan />
      </Modal>

      <div>
        <h2>Test Buttons</h2>
        <h3>Click on buttons to test calling the microservices</h3>
        <button onClick={testConnectionBook} >Booking Service</button>
        <button onClick={testConnectionOccu} >Occupancy Service</button>
        <button onClick={testConnectionUser}>User Service</button>
      </div>

        {/* Message Modal */}
      <Modal isOpen={isTestModalOpen} onClose={() => setIsTestModalOpen(false)}>
        <h2>Service Response</h2>
        <p>{message}</p>
        <button onClick={() => setIsTestModalOpen(false)}>Close</button>
      </Modal>

    </div>
  );
}
