// src/components/SystemAnalysis.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Box,
  Button,
  CircularProgress,
  Typography,
  Divider,
  Paper,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Grid,
  Chip,
  Alert,
  Snackbar
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DoneIcon from '@mui/icons-material/Done';
import SystemSecurityUpdateGoodIcon from '@mui/icons-material/SystemSecurityUpdateGood';
import StorageIcon from '@mui/icons-material/Storage';
import SettingsEthernetIcon from '@mui/icons-material/SettingsEthernet';
import ApiIcon from '@mui/icons-material/Api';
import LanguageIcon from '@mui/icons-material/Language';
import WarningIcon from '@mui/icons-material/Warning';

const getIconForType = (type) => {
  switch (type) {
    case 'ui':
      return <SystemSecurityUpdateGoodIcon />;
    case 'database':
      return <StorageIcon />;
    case 'api':
      return <ApiIcon />;
    case 'service':
      return <SettingsEthernetIcon />;
    case 'external':
      return <LanguageIcon />;
    default:
      return <SystemSecurityUpdateGoodIcon />;
  }
};

const SystemAnalysis = ({ file, metadata, onAnalysisComplete, onBack }) => {
  const [loading, setLoading] = useState(true);
  const [analysis, setAnalysis] = useState(null);
  const [error, setError] = useState(null);
  const [showError, setShowError] = useState(false);

  useEffect(() => {
    const analyzeSystem = async () => {
      try {
        setLoading(true);
        console.log("Analyzing system with fileId:", file.id);
        console.log("Metadata:", metadata);
        
        // Make API call to analyze the system
        const response = await axios.post('http://localhost:8000/api/analyze-system', {
          fileId: file.id,
          metadata: metadata
        });
        
        console.log("Analysis response:", response.data);
        
        if (response.data.error) {
          throw new Error(response.data.error);
        }
        
        setAnalysis(response.data.result);
        setLoading(false);
      } catch (err) {
        console.error("Error analyzing system:", err);
        setError(err.message || 'Failed to analyze system architecture. Please try again.');
        setShowError(true);
        setLoading(false);
        
        // For demo purposes, if the API fails, use mock data
        // In production, you'd want to handle this differently
        setAnalysis(mockSystemAnalysis());
      }
    };

    analyzeSystem();
  }, [file, metadata]);

  const handleContinue = () => {
    onAnalysisComplete(analysis);
  };

  // Mock data as fallback if API fails
  const mockSystemAnalysis = () => {
    console.warn("Using mock system analysis data due to API failure");
    return {
      components: [
        { name: 'Frontend Web App', type: 'ui', description: 'React-based user interface', technologies: ['React', 'Material UI'] },
        { name: 'API Gateway', type: 'api', description: 'RESTful API gateway', technologies: ['Express.js', 'Node.js'] },
        { name: 'Authentication Service', type: 'service', description: 'User authentication and authorization', technologies: ['OAuth 2.0', 'JWT'] },
        { name: 'Product Service', type: 'service', description: 'Core product management', technologies: ['Java', 'Spring Boot'] },
        { name: 'Inventory Service', type: 'service', description: 'Inventory tracking and management', technologies: ['Java', 'Spring Boot'] },
        { name: 'User Database', type: 'database', description: 'User data storage', technologies: ['PostgreSQL'] },
        { name: 'Product Database', type: 'database', description: 'Product catalog storage', technologies: ['MongoDB'] },
        { name: 'CDN', type: 'external', description: 'Content delivery network', technologies: ['Cloudflare'] },
      ],
      dependencies: [
        { source: 'Frontend Web App', target: 'API Gateway', type: 'REST' },
        { source: 'API Gateway', target: 'Authentication Service', type: 'REST' },
        { source: 'API Gateway', target: 'Product Service', type: 'REST' },
        { source: 'API Gateway', target: 'Inventory Service', type: 'REST' },
        { source: 'Authentication Service', target: 'User Database', type: 'Database' },
        { source: 'Product Service', target: 'Product Database', type: 'Database' },
        { source: 'Inventory Service', target: 'Product Database', type: 'Database' },
        { source: 'Frontend Web App', target: 'CDN', type: 'External' },
      ],
      criticalPaths: [
        ['Frontend Web App', 'API Gateway', 'Authentication Service', 'User Database'],
        ['Frontend Web App', 'API Gateway', 'Product Service', 'Product Database'],
      ],
      singlePointsOfFailure: [
        { name: 'API Gateway', impact: 'All services become inaccessible' },
        { name: 'Product Database', impact: 'Product and inventory data unavailable' }
      ],
      recommendations: [
        'Implement API Gateway redundancy across multiple availability zones',
        'Set up database replication for Product Database',
        'Add circuit breakers between API Gateway and backend services',
        'Implement frontend caching strategy for product data'
      ],
      availabilityTier: 'tier2',
      tierJustification: 'The system has indirect revenue impact with customer-facing components. Backend service redundancy is limited, and there are identified single points of failure. Recommended availability target: 99.9%.'
    };
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 4 }}>
        <CircularProgress size={60} thickness={4} />
        <Typography variant="h6" sx={{ mt: 2 }}>
          Analyzing System Architecture...
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          This may take a few moments
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Snackbar 
        open={showError} 
        autoHideDuration={6000} 
        onClose={() => setShowError(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert severity="error" onClose={() => setShowError(false)}>
          {error}
        </Alert>
      </Snackbar>
      
      <Typography variant="h6" gutterBottom>
        System Architecture Analysis
      </Typography>
      
      <Typography variant="body1" paragraph>
        Project: <strong>{metadata.name}</strong> • Business Impact: <strong>{metadata.businessImpact.charAt(0).toUpperCase() + metadata.businessImpact.slice(1)}</strong>
      </Typography>
      
      <Grid container spacing={3}>
        {/* Components Section */}
        <Grid item xs={12} md={6}>
          <Paper elevation={2} sx={{ p: 2, height: '100%' }}>
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
              System Components
            </Typography>
            <List dense>
              {analysis.components.map((component, index) => (
                <ListItem key={index}>
                  <ListItemIcon>
                    {getIconForType(component.type)}
                  </ListItemIcon>
                  <ListItemText 
                    primary={component.name} 
                    secondary={
                      <>
                        {component.description}
                        <Box sx={{ mt: 0.5 }}>
                          {component.technologies.map((tech, i) => (
                            <Chip 
                              key={i} 
                              label={tech} 
                              size="small" 
                              variant="outlined" 
                              sx={{ mr: 0.5, mb: 0.5 }} 
                            />
                          ))}
                        </Box>
                      </>
                    }
                  />
                </ListItem>
              ))}
            </List>
          </Paper>
        </Grid>
        
        {/* Dependencies and Critical Paths */}
        <Grid item xs={12} md={6}>
          <Paper elevation={2} sx={{ p: 2, height: '100%' }}>
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
              Dependencies & Critical Paths
            </Typography>
            
            <Typography variant="subtitle2" gutterBottom>
              Dependencies
            </Typography>
            <List dense sx={{ mb: 2 }}>
              {analysis.dependencies.map((dep, index) => (
                <ListItem key={index}>
                  <ListItemText 
                    primary={`${dep.source} → ${dep.target}`} 
                    secondary={`Type: ${dep.type}`} 
                  />
                </ListItem>
              ))}
            </List>
            
            <Divider sx={{ my: 2 }} />
            
            <Typography variant="subtitle2" gutterBottom>
              Critical Paths
            </Typography>
            <List dense>
              {analysis.criticalPaths.map((path, index) => (
                <ListItem key={index}>
                  <ListItemText 
                    primary={`Path ${index + 1}`} 
                    secondary={path.join(' → ')} 
                  />
                </ListItem>
              ))}
            </List>
          </Paper>
        </Grid>
        
        {/* SPOFs and Recommendations */}
        <Grid item xs={12}>
          <Paper elevation={2} sx={{ p: 2 }}>
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
              Identified Risks & Recommendations
            </Typography>
            
            <Typography variant="subtitle2" gutterBottom>
              Single Points of Failure
            </Typography>
            <List dense sx={{ mb: 2 }}>
              {analysis.singlePointsOfFailure.map((spof, index) => (
                <ListItem key={index}>
                  <ListItemIcon>
                    <WarningIcon color="warning" />
                  </ListItemIcon>
                  <ListItemText 
                    primary={spof.name} 
                    secondary={`Impact: ${spof.impact}`} 
                  />
                </ListItem>
              ))}
            </List>
            
            <Divider sx={{ my: 2 }} />
            
            <Typography variant="subtitle2" gutterBottom>
              Recommendations
            </Typography>
            <List dense>
              {analysis.recommendations.map((rec, index) => (
                <ListItem key={index}>
                  <ListItemIcon>
                    <DoneIcon color="success" />
                  </ListItemIcon>
                  <ListItemText primary={rec} />
                </ListItem>
              ))}
            </List>
          </Paper>
        </Grid>
        
        {/* Availability Tier */}
        <Grid item xs={12}>
          <Paper elevation={2} sx={{ p: 2 }}>
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
              Availability Classification
            </Typography>
            
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <Typography variant="subtitle2" sx={{ mr: 1 }}>
                Recommended Tier:
              </Typography>
              <Chip 
                label={`Tier ${analysis.availabilityTier.charAt(4)} (99.9% Availability Target)`} 
                color="primary" 
                variant="filled" 
              />
            </Box>
            
            <Typography variant="body2">
              {analysis.tierJustification}
            </Typography>
          </Paper>
        </Grid>
      </Grid>
      
      <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between' }}>
        <Button 
          startIcon={<ArrowBackIcon />} 
          onClick={onBack}
        >
          Back
        </Button>
        <Button 
          variant="contained" 
          color="primary"
          onClick={handleContinue}
        >
          Continue to Destructive Testing
        </Button>
      </Box>
    </Box>
  );
};

export default SystemAnalysis;