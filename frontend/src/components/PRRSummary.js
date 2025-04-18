// src/components/PRRSummary.js
import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  CircularProgress,
  Typography,
  Divider,
  Paper,
  Tabs,
  Tab,
  Alert,
  IconButton
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DownloadIcon from '@mui/icons-material/Download';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import ArticleIcon from '@mui/icons-material/Article';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningIcon from '@mui/icons-material/Warning';
import InfoIcon from '@mui/icons-material/Info';
import BugReportIcon from '@mui/icons-material/BugReport';
import MonitorHeartIcon from '@mui/icons-material/MonitorHeart';

// This would be an actual API call in a real implementation
const mockGeneratePRR = async (analysisResults, metadata) => {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  // Mock response data
  return {
    title: metadata.name + " - Production Readiness Review",
    version: "1.0",
    date: new Date().toLocaleDateString(),
    sections: [
      {
        title: "Service Overview",
        content: `${metadata.name} is a ${metadata.businessImpact} impact service that provides product and inventory management capabilities. The service is designed for a retail environment and handles core e-commerce functionality including product catalog management, inventory tracking, and user authentication.

Based on the business requirements and technical analysis, this service has been classified as a Tier 2 system with a target availability of 99.9%.`
      },
      {
        title: "Architecture Analysis",
        content: `The system consists of the following key components:

- Frontend Web App: React-based user interface
- API Gateway: Central entry point for all service requests
- Authentication Service: Handles user authentication and authorization
- Product Service: Core product management functionality
- Inventory Service: Tracks and manages inventory levels
- User Database: PostgreSQL database for user data
- Product Database: MongoDB database for product catalog

Critical paths have been identified between the Frontend and backend services, with all traffic routing through the API Gateway. Single points of failure have been identified in the API Gateway and Product Database.`
      },
      {
        title: "Resilience Testing Strategy",
        content: `A comprehensive destructive testing plan has been developed to validate system resilience. Key test scenarios include:

1. API Gateway Latency Injection: Testing frontend resilience to backend latency
2. Product Database Termination: Validating cache effectiveness and recovery
3. Authentication Service CPU Stress: Ensuring session stability under load
4. Network Partition Testing: Verifying graceful degradation under connectivity issues

Each test has been defined with Litmus Chaos configurations, expected outcomes, and detailed blast radius analysis. The testing approach covers both direct dependencies and potential cascading failures.`
      },
      {
        title: "Availability Design",
        content: `The system has been classified as Tier 2 (High) with a target availability of 99.9%, allowing for approximately 8.76 hours of downtime per year.

Key factors in this classification:
- Indirect revenue impact through customer-facing components
- Critical dependency on shared Product Database
- API Gateway as a single point of failure
- Limited redundancy in certain components

Availability improvement recommendations:
- Implement redundant API Gateway instances across availability zones
- Configure database replication for the Product Database
- Add circuit breakers between API Gateway and backend services
- Implement frontend caching for product data`
      },
      {
        title: "Observability Strategy",
        content: `The following observability implementation is recommended:

- Implement OpenTelemetry instrumentation for all services with the agent and SDK approach
- Deploy collectors in a hub and spoke model
- Define SLOs based on the identified steady-state metrics:
  * API Gateway Response Time: p95 < 300ms
  * Authentication Service Success Rate: > 99.9%
  * Product Service Error Rate: < 0.1%
  * End-to-End Transaction Success: > 99.5%

Dashboards should be created to track these metrics with appropriate alerting thresholds.`
      },
      {
        title: "Identified Risks & Mitigations",
        content: `Key risks identified through system analysis and destructive testing:

1. API Gateway as SPOF
   - Mitigation: Deploy redundant instances across zones
   - Mitigation: Implement circuit breakers to prevent cascading failures

2. Product Database shared dependency
   - Mitigation: Implement read replicas for high availability
   - Mitigation: Develop caching strategy at service level

3. Limited resilience testing for "Known Unknowns"
   - Mitigation: Schedule regular game days to explore edge cases
   - Mitigation: Implement canary deployments for early detection

4. Potential cascading failures
   - Mitigation: Add bulkheads between components
   - Mitigation: Implement retry mechanisms with exponential backoff`
      },
      {
        title: "Recommendations & Next Steps",
        content: `Based on the complete analysis, the following recommendations are prioritized:

1. Address single points of failure in API Gateway and Product Database
2. Implement the defined Chaos Testing plan to validate resilience
3. Deploy comprehensive OpenTelemetry instrumentation for observability
4. Establish SLOs and configure appropriate alerting
5. Develop runbooks for identified failure scenarios
6. Schedule quarterly resilience testing and game days

The system should undergo a follow-up review after implementing these recommendations to validate improvements.`
      }
    ]
  };
};

function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`prr-tabpanel-${index}`}
      aria-labelledby={`prr-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const PRRSummary = ({ analysisResults, metadata, onBack }) => {
  const [loading, setLoading] = useState(true);
  const [prrDocument, setPrrDocument] = useState(null);
  const [error, setError] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const generatePRR = async () => {
      try {
        setLoading(true);
        const document = await mockGeneratePRR(analysisResults, metadata);
        setPrrDocument(document);
        setLoading(false);
      } catch (err) {
        setError('Failed to generate PRR document. Please try again.');
        setLoading(false);
      }
    };

    generatePRR();
  }, [analysisResults, metadata]);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleCopyToClipboard = () => {
    if (!prrDocument) return;
    
    // Construct text content of the PRR document
    const content = `# ${prrDocument.title}
Version: ${prrDocument.version}
Date: ${prrDocument.date}

${prrDocument.sections.map(section => `## ${section.title}\n\n${section.content}`).join('\n\n')}
`;
    
    navigator.clipboard.writeText(content).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    });
  };

  const handleDownloadPDF = () => {
    // In a real implementation, this would call an API to generate a PDF
    alert('In a real implementation, this would generate and download a PDF version of the PRR document.');
  };

  const handleDownloadWord = () => {
    // In a real implementation, this would call an API to generate a Word document
    alert('In a real implementation, this would generate and download a Word version of the PRR document.');
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 4 }}>
        <CircularProgress size={60} thickness={4} />
        <Typography variant="h6" sx={{ mt: 2 }}>
          Generating PRR Document...
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          This may take a few moments
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box>
        <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>
        <Button startIcon={<ArrowBackIcon />} onClick={onBack}>Back</Button>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">
          Production Readiness Review
        </Typography>
        
        <Box>
          <IconButton 
            color={copied ? "success" : "primary"} 
            onClick={handleCopyToClipboard}
            title="Copy to clipboard"
          >
            {copied ? <CheckCircleIcon /> : <ContentCopyIcon />}
          </IconButton>
          
          <IconButton 
            color="primary" 
            onClick={handleDownloadPDF}
            title="Download as PDF"
          >
            <PictureAsPdfIcon />
          </IconButton>
          
          <IconButton 
            color="primary" 
            onClick={handleDownloadWord}
            title="Download as Word document"
          >
            <ArticleIcon />
          </IconButton>
        </Box>
      </Box>
      
      <Typography variant="body1" paragraph>
        <strong>{prrDocument.title}</strong> • Version: {prrDocument.version} • Date: {prrDocument.date}
      </Typography>
      
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Tabs value={tabValue} onChange={handleTabChange} variant="scrollable" scrollButtons="auto">
          <Tab label="Complete Document" />
          <Tab label="Service Overview" />
          <Tab label="Architecture" />
          <Tab label="Resilience Testing" />
          <Tab label="Availability" />
          <Tab label="Observability" />
          <Tab label="Risks & Recommendations" />
        </Tabs>
      </Box>
      
      <TabPanel value={tabValue} index={0}>
        <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
          <Typography variant="h5" gutterBottom>
            {prrDocument.title}
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Version: {prrDocument.version} • Date: {prrDocument.date}
          </Typography>
          
          {prrDocument.sections.map((section, index) => (
            <Box key={index} sx={{ mb: 4 }}>
              <Typography variant="h6" gutterBottom>
                {section.title}
              </Typography>
              <Typography variant="body1" component="div" sx={{ whiteSpace: 'pre-line' }}>
                {section.content}
              </Typography>
              {index < prrDocument.sections.length - 1 && <Divider sx={{ mt: 3 }} />}
            </Box>
          ))}
        </Paper>
      </TabPanel>
      
      <TabPanel value={tabValue} index={1}>
        <Paper elevation={2} sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <InfoIcon sx={{ mr: 1, color: 'primary.main' }} />
            <Typography variant="h6">
              {prrDocument.sections[0].title}
            </Typography>
          </Box>
          <Typography variant="body1" component="div" sx={{ whiteSpace: 'pre-line' }}>
            {prrDocument.sections[0].content}
          </Typography>
        </Paper>
      </TabPanel>
      
      <TabPanel value={tabValue} index={2}>
        <Paper elevation={2} sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <MonitorHeartIcon sx={{ mr: 1, color: 'primary.main' }} />
            <Typography variant="h6">
              {prrDocument.sections[1].title}
            </Typography>
          </Box>
          <Typography variant="body1" component="div" sx={{ whiteSpace: 'pre-line' }}>
            {prrDocument.sections[1].content}
          </Typography>
        </Paper>
      </TabPanel>
      
      <TabPanel value={tabValue} index={3}>
        <Paper elevation={2} sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <BugReportIcon sx={{ mr: 1, color: 'primary.main' }} />
            <Typography variant="h6">
              {prrDocument.sections[2].title}
            </Typography>
          </Box>
          <Typography variant="body1" component="div" sx={{ whiteSpace: 'pre-line' }}>
            {prrDocument.sections[2].content}
          </Typography>
        </Paper>
      </TabPanel>
      
      <TabPanel value={tabValue} index={4}>
        <Paper elevation={2} sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <CheckCircleIcon sx={{ mr: 1, color: 'primary.main' }} />
            <Typography variant="h6">
              {prrDocument.sections[3].title}
            </Typography>
          </Box>
          <Typography variant="body1" component="div" sx={{ whiteSpace: 'pre-line' }}>
            {prrDocument.sections[3].content}
          </Typography>
        </Paper>
      </TabPanel>
      
      <TabPanel value={tabValue} index={5}>
        <Paper elevation={2} sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <InfoIcon sx={{ mr: 1, color: 'primary.main' }} />
            <Typography variant="h6">
              {prrDocument.sections[4].title}
            </Typography>
          </Box>
          <Typography variant="body1" component="div" sx={{ whiteSpace: 'pre-line' }}>
            {prrDocument.sections[4].content}
          </Typography>
        </Paper>
      </TabPanel>
      
      <TabPanel value={tabValue} index={6}>
        <Paper elevation={2} sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <WarningIcon sx={{ mr: 1, color: 'primary.main' }} />
            <Typography variant="h6">
              {prrDocument.sections[5].title}
            </Typography>
          </Box>
          <Typography variant="body1" component="div" sx={{ whiteSpace: 'pre-line' }}>
            {prrDocument.sections[5].content}
          </Typography>
          
          <Divider sx={{ my: 3 }} />
          
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <CheckCircleIcon sx={{ mr: 1, color: 'success.main' }} />
            <Typography variant="h6">
              {prrDocument.sections[6].title}
            </Typography>
          </Box>
          <Typography variant="body1" component="div" sx={{ whiteSpace: 'pre-line' }}>
            {prrDocument.sections[6].content}
          </Typography>
        </Paper>
      </TabPanel>
      
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
          startIcon={<DownloadIcon />}
          onClick={handleDownloadPDF}
        >
          Download PRR Document
        </Button>
      </Box>
    </Box>
  );
};

export default PRRSummary;