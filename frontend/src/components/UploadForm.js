// src/components/UploadForm.js
import React, { useState } from 'react';
import axios from 'axios';
import { 
  Box, 
  Button, 
  TextField, 
  Typography, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
  Grid,
  Paper,
  Alert,
  Snackbar
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';

const UploadForm = ({ onSubmit }) => {
  const [file, setFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [metadata, setMetadata] = useState({
    name: '',
    description: '',
    businessImpact: '',
  });
  const [errors, setErrors] = useState({});
  const [uploading, setUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showError, setShowError] = useState(false);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      
      // Create preview for image files
      if (selectedFile.type.includes('image')) {
        const reader = new FileReader();
        reader.onload = () => {
          setFilePreview(reader.result);
        };
        reader.readAsDataURL(selectedFile);
      } else {
        setFilePreview(null);
      }
    }
  };

  const handleMetadataChange = (e) => {
    const { name, value } = e.target;
    setMetadata(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when field is updated
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!metadata.name.trim()) {
      newErrors.name = 'Project name is required';
    }
    
    if (!metadata.description.trim()) {
      newErrors.description = 'Description is required';
    }
    
    if (!metadata.businessImpact) {
      newErrors.businessImpact = 'Business impact selection is required';
    }
    
    if (!file) {
      newErrors.file = 'Architecture diagram is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (validateForm()) {
      try {
        setUploading(true);
        
        // Create a FormData object to send the file
        const formData = new FormData();
        formData.append('file', file); // 'file' must match the parameter name in FastAPI
        
        console.log("Uploading file:", file.name);
        
        // Make the API call to upload the diagram
        const response = await axios.post('http://localhost:8000/api/upload-diagram', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
        
        console.log("Upload response:", response.data);
        
        // Pass the file metadata and file ID to the parent component
        onSubmit({
          file: file,
          id: response.data.fileId
        }, metadata);
      } catch (error) {
        console.error("Error uploading file:", error);
        setErrorMessage(error.message || 'Failed to upload file. Please try again.');
        setShowError(true);
      } finally {
        setUploading(false);
      }
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit} noValidate>
      <Typography variant="h6" gutterBottom>
        Upload Architecture Diagram and Project Information
      </Typography>
      
      <Snackbar 
        open={showError} 
        autoHideDuration={6000} 
        onClose={() => setShowError(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert severity="error" onClose={() => setShowError(false)}>
          {errorMessage}
        </Alert>
      </Snackbar>
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            required
            label="Project Name"
            name="name"
            value={metadata.name}
            onChange={handleMetadataChange}
            error={!!errors.name}
            helperText={errors.name}
            margin="normal"
          />
          
          <TextField
            fullWidth
            required
            label="Description"
            name="description"
            value={metadata.description}
            onChange={handleMetadataChange}
            error={!!errors.description}
            helperText={errors.description}
            multiline
            rows={4}
            margin="normal"
          />
          
          <FormControl fullWidth margin="normal" error={!!errors.businessImpact}>
            <InputLabel required>Business Impact</InputLabel>
            <Select
              name="businessImpact"
              value={metadata.businessImpact}
              label="Business Impact"
              onChange={handleMetadataChange}
            >
              <MenuItem value="critical">Critical - Direct Revenue Impact</MenuItem>
              <MenuItem value="high">High - Indirect Revenue Impact</MenuItem>
              <MenuItem value="medium">Medium - Operational Impact</MenuItem>
              <MenuItem value="low">Low - Minimal Business Impact</MenuItem>
            </Select>
            {errors.businessImpact && (
              <Typography variant="caption" color="error">
                {errors.businessImpact}
              </Typography>
            )}
          </FormControl>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Paper 
            elevation={1} 
            sx={{ 
              p: 2, 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              minHeight: 200,
              border: '2px dashed #ccc',
              backgroundColor: '#fafafa'
            }}
          >
            <input
              type="file"
              accept="image/*,.lucid,.vsdx,.pdf"
              id="architecture-upload"
              style={{ display: 'none' }}
              onChange={handleFileChange}
            />
            <label htmlFor="architecture-upload">
              <Button
                variant="contained"
                component="span"
                startIcon={<CloudUploadIcon />}
                sx={{ mb: 2 }}
                disabled={uploading}
              >
                Select Architecture Diagram
              </Button>
            </label>
            
            {filePreview ? (
              <Box sx={{ mt: 2, width: '100%', textAlign: 'center' }}>
                <img 
                  src={filePreview} 
                  alt="Architecture Preview" 
                  style={{ maxWidth: '100%', maxHeight: 200 }} 
                />
                <Typography variant="body2" sx={{ mt: 1 }}>
                  {file.name} ({(file.size / 1024).toFixed(1)} KB)
                </Typography>
              </Box>
            ) : file ? (
              <Typography variant="body2" sx={{ mt: 2 }}>
                {file.name} ({(file.size / 1024).toFixed(1)} KB)
              </Typography>
            ) : (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                Supported formats: Images, Lucidchart exports, Visio, PDF
              </Typography>
            )}
            
            {errors.file && (
              <Typography variant="caption" color="error" sx={{ mt: 1 }}>
                {errors.file}
              </Typography>
            )}
          </Paper>
        </Grid>
      </Grid>
      
      <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
        <Button 
          type="submit" 
          variant="contained" 
          color="primary"
          size="large"
          disabled={uploading}
        >
          {uploading ? 'Uploading...' : 'Analyze Architecture'}
        </Button>
      </Box>
    </Box>
  );
};

export default UploadForm;