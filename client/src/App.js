import React, { useState } from "react";
import GymFloorPlan from "./components/GymFloorPlan"; // Your existing gym floor plan
import Modal from "./components/modal";
import "./styles.css";

export default function App() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="App">
      <h2>Gym Occupancy Floor Plan</h2>
      <button onClick={() => setIsModalOpen(true)}>Open Gym Floor Plan</button>

      {/* Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <h2>Gym Floor Plan</h2>
        <GymFloorPlan />
      </Modal>
    </div>
  );
}
