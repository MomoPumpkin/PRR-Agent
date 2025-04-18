# PRR-Agent
A demo application to automate the process of PRRs

## Project Structure

The project is divided into two main parts:

1. **Backend**: Contains the server-side logic implemented in Python.
   - `app.py`: Main application file for the backend.
   - `requirements.txt`: Lists the Python dependencies.
   - `test-gemini.py`: Test file for backend functionality.

2. **Frontend**: Contains the client-side code implemented in JavaScript (React).
   - `src/`: Contains the main React components and styles.
   - `public/`: Contains static files like `index.html` and `manifest.json`.

## Prerequisites

- Python 3.8 or higher
- Node.js and npm

## Setup Instructions

### Backend

1. Navigate to the `backend` directory:
   ```bash
   cd backend
   ```
2. Create a virtual environment:
   ```bash
   python3 -m venv venv
   source venv/bin/activate
   ```
3. Install the required dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Run the backend server:
   ```bash
   python app.py
   ```

### Frontend

1. Navigate to the `frontend` directory:
   ```bash
   cd frontend
   ```
2. Install the required dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm start
   ```

## Usage

1. Open your browser and navigate to the frontend URL (usually `http://localhost:3000`).
2. Use the provided interface to upload files, analyze data, and view PRR summaries.

## Additional Notes

- The `sample-architecture-diagram.png` provides an overview of the system architecture.
- Ensure the backend server is running before starting the frontend.

## License

This project is licensed under the terms of the LICENSE file.
