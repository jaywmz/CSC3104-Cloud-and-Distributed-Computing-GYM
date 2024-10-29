import React from 'react';
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, YAxis } from 'recharts';

const PredictionGraph = ({ gymID, predictions }) => {
    // Prepare data for the graph with additional tooltip information
    const data = predictions.map(prediction => ({
        dayHour: `Day: ${['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][prediction.day_of_week]}, Hour: ${prediction.hour}`,
        predictedCount: prediction.predicted_count,
        fillColor: prediction.category === 'Little' ? '#4caf50' : prediction.category === 'Average' ? '#ffeb3b' : '#f44336'
    }));

    return (
        <div className="prediction-graph">
            <h3>Gym ID: {gymID}</h3>
            <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data} margin={{ top: 20, right: 30, bottom: 20, left: 40 }} barCategoryGap={2}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <YAxis />
                    <Tooltip 
                        formatter={(value, name, props) => [
                            `Predicted Count: ${value}`,
                            `${props.payload.dayHour}`
                        ]}
                    />
                    <Legend />
                    <Bar dataKey="predictedCount" fill={({ payload }) => payload.fillColor} />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
};

export default PredictionGraph;
