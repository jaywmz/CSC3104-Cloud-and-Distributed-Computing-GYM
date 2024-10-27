import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error

# Load the dataset
file_path = 'Combined_GymOccupancy.csv'
data = pd.read_csv(file_path)

# Parse timestamp and extract day of week and hour
data['day_of_week'] = data['timestamp'].str[:3]  # Extract first three letters (Mon, Tue, etc.)
data['time'] = data['timestamp'].str.extract(r'(\d{2}:\d{2}:\d{2})')  # Extract time in HH:MM:SS format

# Convert extracted time to datetime and get the hour
data['hour'] = pd.to_datetime(data['time'], format='%H:%M:%S', errors='coerce').dt.hour

# Map days of the week to numerical values (0=Monday, ..., 6=Sunday)
day_mapping = {'Mon': 0, 'Tue': 1, 'Wed': 2, 'Thu': 3, 'Fri': 4, 'Sat': 5, 'Sun': 6}
data['day_of_week'] = data['day_of_week'].map(day_mapping)

# Drop rows with invalid data
processed_data = data.dropna(subset=['day_of_week', 'hour'])

# Aggregate the data to count entries per day, hour, and gym
aggregated_data = processed_data.groupby(['gymID', 'day_of_week', 'hour']).size().reset_index(name='count')

# Define features (gymID, day_of_week, hour) and target (count)
X = aggregated_data[['gymID', 'day_of_week', 'hour']]
y = aggregated_data['count']

# Split data into training and testing sets
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# Train a RandomForest model
model = RandomForestRegressor(n_estimators=100, random_state=42)
model.fit(X_train, y_train)

# Predict and evaluate the model
y_pred = model.predict(X_test)
mae = mean_absolute_error(y_test, y_pred)
print(f'Mean Absolute Error: {mae}')

# Create input data for predictions (all gyms, hours, and days of the week)
gyms = processed_data['gymID'].unique()
prediction_input = pd.DataFrame({
    'gymID': np.repeat(gyms, 24 * 7),  # Repeat for each gym, day, and hour
    'day_of_week': np.tile(np.repeat(range(7), 24), len(gyms)),  # Repeat days and hours for each gym
    'hour': np.tile(range(24), 7 * len(gyms))  # Tile hours for each gym and day
})

# Predict occupancy for all hours, gyms, and days of the week
predictions = model.predict(prediction_input)

# Add predictions to the dataframe
prediction_input['predicted_count'] = predictions

# Categorize the occupancy into "Little", "Average", "Alot"
def categorize_occupancy(count):
    if count < 1.5:
        return "Little"
    elif 1.5 <= count < 2.5:
        return "Average"
    else:
        return "Alot"

# Apply the categorization to the predicted counts
prediction_input['category'] = prediction_input['predicted_count'].apply(categorize_occupancy)

# Define colors based on categories
color_mapping = {"Little": "blue", "Average": "yellow", "Alot": "red"}

# Generate a separate bubble chart for each gym
for gym in gyms:
    plt.figure(figsize=(12, 8))

    # Filter data for the current gym
    gym_data = prediction_input[prediction_input['gymID'] == gym]

    # Plot the scatter plot with color representing the occupancy category
    for category in color_mapping:
        cat_data = gym_data[gym_data['category'] == category]
        plt.scatter(cat_data['hour'], cat_data['day_of_week'], 
                    s=cat_data['predicted_count'] * 20,  # Scale dot size by occupancy
                    color=color_mapping[category], alpha=0.7, label=category)

    # Add labels and title
    plt.title(f'Predicted Occupancy for Gym {gym} by Time and Day')
    plt.xlabel('Hour of the Day')
    plt.ylabel('Day of the Week (0=Monday, 6=Sunday)')
    plt.xticks(range(0, 24))  # Show all hours from 0 to 23
    plt.yticks(range(0, 7), ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'])  # Show day names

    # Add a legend to indicate the color categories
    plt.legend(title="Occupancy Category")

    # Display the scatter plot
    plt.grid(True)
    plt.tight_layout()

    # Show the plot
    plt.show()
