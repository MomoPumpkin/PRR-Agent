# SRE PRR Agent

An AI-powered agent system that automates SRE workflow across SDLC stages, particularly focused on architecture diagram analysis, destructive testing, and PRR document generation.

## Project Overview

This project uses:
- Google ADK and Claude/OpenAI for AI analysis
- FastAPI for the backend API
- React with Material UI for the frontend interface

The system allows users to:
1. Upload architecture diagrams
2. Generate system analysis
3. Create comprehensive destructive testing plans
4. Produce PRR documents with export options

## Getting Started

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Create a virtual environment:
```bash
python -m venv venv
```

3. Activate the virtual environment:
   - Windows: `venv\Scripts\activate`
   - Linux/Mac: `source venv/bin/activate`

4. Install dependencies:
```bash
pip install -r requirements.txt
```

5. Start the backend server:
```bash
uvicorn app:app --reload --host 0.0.0.0 --port 8000
```

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the frontend development server:
```bash
npm start
```

4. Access the application at http://localhost:3000

## Usage

1. Upload an architecture diagram (image or Lucidchart export)
2. Enter project metadata
3. Review the system analysis
4. Generate a destructive testing plan
5. View and download the complete PRR document

## Project Structure

```
sre_prr_agent/
├── frontend/                         # React frontend
│   ├── src/
│   │   ├── components/               # React components 
│   │   │   ├── UploadForm.js         
│   │   │   ├── SystemAnalysis.js     
│   │   │   ├── DestructiveTestAnalysis.js
│   │   │   └── PRRSummary.js        
│   │   ├── App.js                    # Main app component
│   │   └── App.css                   # CSS styles
│   ├── package.json                  # Node dependencies
│   └── README.md                     # Frontend docs
└── backend/                          # Python backend
    ├── app.py                        # FastAPI + Google ADK implementation
    └── requirements.txt              # Python dependencies
```

## Current Limitations

- The implementation uses mock data; actual LLM integration requires proper API keys
- Image analysis requires LLM with vision capabilities
- PDF/Word export functionality needs to be implemented