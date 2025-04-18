import React, { useState, useEffect } from 'react';
import { Container, Box, Stepper, Step, StepLabel, Typography, Paper, Alert } from '@mui/material';
import UploadForm from './components/UploadForm';
import SystemAnalysis from './components/SystemAnalysis';
import DestructiveTestAnalysis from './components/DestructiveTestAnalysis';
import PRRSummary from './components/PRRSummary';
import './App.css';

function App() {
  const [activeStep, setActiveStep] = useState(0);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [metadata, setMetadata] = useState({
    name: '',
    description: '',
    businessImpact: ''
  });
  const [analysisResults, setAnalysisResults] = useState({
    systemAnalysis: null,
    destructiveTestAnalysis: null
  });
  const [apiStatus, setApiStatus] = useState('Checking...');
  
  useEffect(() => {
    // Test API connection when component mounts
    fetch('http://localhost:8000/api/ping')
      .then(response => response.json())
      .then(data => {
        console.log("API Response:", data);
        setApiStatus('Connected: ' + data.message);
      })
      .catch(error => {
        console.error("API Connection Error:", error);
        setApiStatus('Error: ' + error.message);
      });
  }, []);

  const steps = [
    'Upload Architecture Diagram',
    'System Analysis',
    'Destructive Test Analysis',
    'PRR Summary'
  ];

  const handleFileUpload = (file, projectMetadata) => {
    setUploadedFile(file);
    setMetadata(projectMetadata);
    setActiveStep(1);
  };

  const handleSystemAnalysisComplete = (results) => {
    setAnalysisResults(prev => ({
      ...prev,
      systemAnalysis: results
    }));
    setActiveStep(2);
  };

  const handleDestructiveTestComplete = (results) => {
    setAnalysisResults(prev => ({
      ...prev,
      destructiveTestAnalysis: results
    }));
    setActiveStep(3);
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  return (
    <Container maxWidth="lg" className="app-container">
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" align="center" gutterBottom>
          SRE Production Readiness Review Tool
        </Typography>
        
        <Box sx={{ mb: 3 }}>
          <Alert severity={apiStatus.includes('Error') ? 'error' : 'success'}>
            API Status: {apiStatus}
          </Alert>
        </Box>
        
        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        <Paper elevation={3} sx={{ p: 3 }}>
          {activeStep === 0 && (
            <UploadForm onSubmit={handleFileUpload} />
          )}
          
          {activeStep === 1 && (
            <SystemAnalysis 
              file={uploadedFile}
              metadata={metadata}
              onAnalysisComplete={handleSystemAnalysisComplete}
              onBack={handleBack}
            />
          )}
          
          {activeStep === 2 && (
            <DestructiveTestAnalysis
              systemAnalysis={analysisResults.systemAnalysis}
              metadata={metadata}
              onAnalysisComplete={handleDestructiveTestComplete}
              onBack={handleBack}
            />
          )}
          
          {activeStep === 3 && (
            <PRRSummary
              analysisResults={analysisResults}
              metadata={metadata}
              onBack={handleBack}
            />
          )}
        </Paper>
      </Box>
    </Container>
  );
}

export default App;