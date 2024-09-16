import React, { useState } from 'react';
import './GymFloorPlan.css';  // Import styles for GymFloorPlan

export default function GymFloorPlan() {
  const [selected, setSelected] = useState(null);

  const rooms = [
    { name: 'Dumbbell Area', x: 50, y: 50, width: 150, height: 100, color: '#3b82f6' },
    { name: 'Treadmill Area', x: 250, y: 50, width: 150, height: 100, color: '#a229b6' },
    { name: 'Bike Area', x: 50, y: 200, width: 150, height: 100, color: '#f43f5e' },
    { name: 'Lobby', x: 250, y: 200, width: 150, height: 100, color: '#34d399' }
  ];

  return (
    <div className="floorplan">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 500 500"
        style={{ border: '1px solid #ccc', width: '100%', height: '500px' }}
      >
        {rooms.map((room, index) => (
          <g key={index}>
            <rect
              x={room.x}
              y={room.y}
              width={room.width}
              height={room.height}
              fill={selected === room.name ? room.color : '#ddd'}
              stroke="black"
              strokeWidth="2"
              onMouseEnter={() => setSelected(room.name)}
              onMouseLeave={() => setSelected(null)}
            />
            <text x={room.x + room.width / 4} y={room.y + room.height / 2} fill="black">
              {room.name}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}
