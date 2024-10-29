from flask import Flask, jsonify, request
from flask_cors import CORS  # Import CORS for cross-origin requests
import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestRegressor

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Load the dataset and train the model
def load_and_train_model():
    # Load the dataset
    file_path = 'Combined_GymOccupancy.csv'  # Make sure this file is in the same directory
    data = pd.read_csv(file_path)

    # Preprocess data
    data['day_of_week'] = data['timestamp'].str[:3]
    data['time'] = data['timestamp'].str.extract(r'(\d{2}:\d{2}:\d{2})')
    data['hour'] = pd.to_datetime(data['time'], format='%H:%M:%S', errors='coerce').dt.hour
    day_mapping = {'Mon': 0, 'Tue': 1, 'Wed': 2, 'Thu': 3, 'Fri': 4, 'Sat': 5, 'Sun': 6}
    data['day_of_week'] = data['day_of_week'].map(day_mapping)
    processed_data = data.dropna(subset=['day_of_week', 'hour'])

    # Aggregate the data
    aggregated_data = processed_data.groupby(['gymID', 'day_of_week', 'hour']).size().reset_index(name='count')

    # Define features and target
    X = aggregated_data[['gymID', 'day_of_week', 'hour']]
    y = aggregated_data['count']

    # Train the model
    model = RandomForestRegressor(n_estimators=100, random_state=42)
    model.fit(X, y)
    return model

# Initialize the model
model = load_and_train_model()

@app.route('/predict', methods=['GET'])
def predict():
    # Get prediction parameters from the request (or use defaults)
    gymID = request.args.get('gymID', default=1, type=int)
    day_of_week = request.args.get('day_of_week', default=0, type=int)  # 0 = Monday, 6 = Sunday
    hour = request.args.get('hour', default=10, type=int)  # 10 AM

    # Create DataFrame for prediction input
    input_data = pd.DataFrame({
        'gymID': [gymID],
        'day_of_week': [day_of_week],
        'hour': [hour]
    })

    # Make prediction
    predicted_count = model.predict(input_data)[0]

    # Categorize occupancy level
    def categorize_occupancy(count):
        if count < 1.5:
            return "Little"
        elif 1.5 <= count < 2.5:
            return "Average"
        else:
            return "Alot"

    category = categorize_occupancy(predicted_count)

    # Return result as JSON
    result = {
        "gymID": gymID,
        "day_of_week": day_of_week,
        "hour": hour,
        "predicted_count": round(predicted_count, 1),
        "category": category
    }
    return jsonify(result)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5004)  # Run the server on port 5004
