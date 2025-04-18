// src/components/DestructiveTestAnalysis.js
import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  CircularProgress,
  Typography,
  Divider,
  Paper,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Grid,
  Chip,
  Alert,
  Stepper,
  Step,
  StepLabel
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import BugReportIcon from '@mui/icons-material/BugReport';
import AssessmentIcon from '@mui/icons-material/Assessment';
import PsychologyIcon from '@mui/icons-material/Psychology';
import ScienceIcon from '@mui/icons-material/Science';
import GppBadIcon from '@mui/icons-material/GppBad';

// This would be an actual API call in a real implementation
const mockDestructiveTestAnalysis = async (systemAnalysis, metadata) => {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 4000));
  
  // Mock response data based on the chaos testing prompt
  return {
    dependencyAnalysis: {
      summary: 'The system has several critical dependencies that warrant chaos testing',
      dependencies: [
        { 
          name: 'API Gateway Dependency', 
          description: 'All services are accessed through the API Gateway, making it a critical SPOF',
          impact: 'Failure would render all backend services inaccessible to end users'
        },
        { 
          name: 'Product Database Dependency', 
          description: 'Both Product and Inventory services rely on the same database',
          impact: 'Failure affects multiple services and core functionality'
        },
        { 
          name: 'Authentication Service Dependency', 
          description: 'Required for user authentication across all protected endpoints',
          impact: 'Failure would prevent authenticated operations system-wide'
        },
        { 
          name: 'External CDN Dependency', 
          description: 'Frontend static assets delivery depends on external CDN',
          impact: 'Failure would degrade UI experience but not break core functionality'
        }
      ]
    },
    steadyStateDefinitions: {
      summary: 'The following steady states define normal system operation for validating chaos experiments',
      states: [
        {
          name: 'API Gateway Response Time',
          description: 'API Gateway responds to health checks within 300ms',
          metric: 'p95 latency < 300ms',
          threshold: '300ms'
        },
        {
          name: 'Authentication Service Availability',
          description: 'Authentication service correctly validates tokens',
          metric: 'Success rate > 99.9%',
          threshold: '99.9%'
        },
        {
          name: 'Product Service Functionality',
          description: 'Product service returns valid product data',
          metric: 'Error rate < 0.1%',
          threshold: '0.1%'
        },
        {
          name: 'Database Query Performance',
          description: 'Database queries complete within acceptable timeframe',
          metric: 'p95 query time < 100ms',
          threshold: '100ms'
        },
        {
          name: 'End-to-End Transaction',
          description: 'Complete product search to checkout flow succeeds',
          metric: 'Success rate > 99.5%',
          threshold: '99.5%'
        }
      ]
    },
    hypotheses: {
      summary: 'Test hypotheses for chaos testing scenarios',
      items: [
        {
          description: 'When the API Gateway experiences high latency, the frontend will degrade gracefully with proper timeouts',
          testApproach: 'Inject latency at the API Gateway level and observe frontend behavior'
        },
        {
          description: 'When the Product Database becomes unavailable, the Product Service will serve cached data',
          testApproach: 'Terminate Product Database connections and validate Product Service response'
        },
        {
          description: 'When the Authentication Service is under high load, legitimate user sessions remain valid',
          testApproach: 'Generate high CPU load on Authentication Service while monitoring active sessions'
        },
        {
          description: 'When network connectivity between services is degraded, retry mechanisms will maintain functionality',
          testApproach: 'Introduce packet loss between services and monitor recovery behavior'
        }
      ]
    },
    experiments: {
      summary: 'Prioritized chaos experiments to validate system resilience',
      items: [
        {
          name: 'API Gateway Latency Injection',
          description: 'Inject 1000ms latency to API Gateway responses',
          components: ['API Gateway'],
          expectedResult: 'Frontend shows loading states and retries failed requests',
          litmusConfig: `apiVersion: litmuschaos.io/v1alpha1
kind: ChaosEngine
metadata:
  name: api-gateway-latency
spec:
  appinfo:
    appns: 'default'
    applabel: 'app=api-gateway'
    appkind: 'deployment'
  chaosServiceAccount: litmus-admin
  experiments:
    - name: pod-network-latency
      spec:
        components:
          env:
            - name: TOTAL_CHAOS_DURATION
              value: '60'
            - name: NETWORK_LATENCY
              value: '1000'`
        },
        {
          name: 'Product Database Termination',
          description: 'Terminate Product Database pod for 30 seconds',
          components: ['Product Database'],
          expectedResult: 'Product Service serves cached data and automatically reconnects',
          litmusConfig: `apiVersion: litmuschaos.io/v1alpha1
kind: ChaosEngine
metadata:
  name: product-db-termination
spec:
  appinfo:
    appns: 'default'
    applabel: 'app=product-db'
    appkind: 'statefulset'
  chaosServiceAccount: litmus-admin
  experiments:
    - name: pod-delete
      spec:
        components:
          env:
            - name: TOTAL_CHAOS_DURATION
              value: '30'
            - name: FORCE
              value: 'true'`
        },
        {
          name: 'Authentication Service CPU Stress',
          description: 'Stress CPU on Authentication Service to 80% for 2 minutes',
          components: ['Authentication Service'],
          expectedResult: 'Active sessions remain valid with potential latency increase',
          litmusConfig: `apiVersion: litmuschaos.io/v1alpha1
kind: ChaosEngine
metadata:
  name: auth-service-cpu-hog
spec:
  appinfo:
    appns: 'default'
    applabel: 'app=auth-service'
    appkind: 'deployment'
  chaosServiceAccount: litmus-admin
  experiments:
    - name: pod-cpu-hog
      spec:
        components:
          env:
            - name: TOTAL_CHAOS_DURATION
              value: '120'
            - name: CPU_CORES
              value: '1'
            - name: CPU_LOAD
              value: '80'`
        },
        {
          name: 'Network Partition Test',
          description: 'Introduce network partition between frontend and backend services',
          components: ['Frontend Web App', 'API Gateway'],
          expectedResult: 'Frontend shows appropriate error messages and retry options',
          litmusConfig: `apiVersion: litmuschaos.io/v1alpha1
kind: ChaosEngine
metadata:
  name: network-partition
spec:
  appinfo:
    appns: 'default'
    applabel: 'app=api-gateway'
    appkind: 'deployment'
  chaosServiceAccount: litmus-admin
  experiments:
    - name: pod-network-loss
      spec:
        components:
          env:
            - name: TOTAL_CHAOS_DURATION
              value: '60'
            - name: NETWORK_INTERFACE
              value: 'eth0'
            - name: NETWORK_PACKET_LOSS_PERCENTAGE
              value: '100'`
        }
      ]
    },
    rumsfeld: {
      summary: 'Rumsfeld Matrix analysis for known and unknown failure scenarios',
      matrix: {
        knownKnowns: [
          'API Gateway is a single point of failure',
          'Product Database outage affects multiple services',
          'Authentication failures will impact all authenticated operations',
          'Network issues between frontend and backend will disrupt user experience'
        ],
        knownUnknowns: [
          'Behavior under sustained high load over multiple hours',
          'Recovery characteristics after complete region failure',
          'Impact of third-party CDN disruption during peak traffic',
          'Database performance degradation patterns during multi-service high load'
        ],
        unknownUnknowns: [
          'Potential for unforeseen cascading failures across seemingly isolated components',
          'Novel failure modes from combinations of component failures',
          'User behavior changes in response to partial system degradation',
          'Emergent properties under extreme conditions'
        ]
      },
      recommendations: [
        'Implement canary deployments to detect potential failures early',
        'Add distributed tracing to identify cascading failure patterns',
        'Establish automated game days to explore unknown failure modes',
        'Create more granular circuit breakers between components'
      ]
    },
    blastRadius: {
      summary: 'Analysis of the impact scope for each test case',
      analyses: [
        {
          test: 'API Gateway Latency Injection',
          directImpact: ['All API requests experience increased latency'],
          indirectImpact: ['Potential timeout cascades in dependent services', 'User experience degradation'],
          containment: 'Impact limited to active user sessions, no data loss expected'
        },
        {
          test: 'Product Database Termination',
          directImpact: ['Product and Inventory services lose database connectivity'],
          indirectImpact: ['API calls for product data return cached/stale data or errors'],
          containment: 'Impact limited to product-related operations, authentication still functions'
        },
        {
          test: 'Authentication Service CPU Stress',
          directImpact: ['Increased latency for authentication operations'],
          indirectImpact: ['Potential failure of new login attempts'],
          containment: 'Existing sessions should remain valid, impact limited to authentication operations'
        },
        {
          test: 'Network Partition Test',
          directImpact: ['Frontend cannot communicate with backend services'],
          indirectImpact: ['All user operations fail at frontend'],
          containment: 'Backend services continue processing queued operations, no data loss expected'
        }
      ]
    }
  };
};

const DestructiveTestAnalysis = ({ systemAnalysis, metadata, onAnalysisComplete, onBack }) => {
  const [loading, setLoading] = useState(true);
  const [analysis, setAnalysis] = useState(null);
  const [error, setError] = useState(null);
  const [expanded, setExpanded] = useState('panel1');

  const handleChange = (panel) => (event, isExpanded) => {
    setExpanded(isExpanded ? panel : false);
  };

  useEffect(() => {
    const analyzeDestructiveTests = async () => {
      try {
        setLoading(true);
        const result = await mockDestructiveTestAnalysis(systemAnalysis, metadata);
        setAnalysis(result);
        setLoading(false);
      } catch (err) {
        setError('Failed to generate destructive test analysis. Please try again.');
        setLoading(false);
      }
    };

    analyzeDestructiveTests();
  }, [systemAnalysis, metadata]);

  const handleContinue = () => {
    onAnalysisComplete(analysis);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 4 }}>
        <CircularProgress size={60} thickness={4} />
        <Typography variant="h6" sx={{ mt: 2 }}>
          Generating Destructive Testing Plan...
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
      <Typography variant="h6" gutterBottom>
        Destructive Testing Analysis
      </Typography>
      
      <Typography variant="body1" paragraph>
        Project: <strong>{metadata.name}</strong> • Business Impact: <strong>{metadata.businessImpact.charAt(0).toUpperCase() + metadata.businessImpact.slice(1)}</strong>
      </Typography>
      
      <Box sx={{ my: 2 }}>
        <Stepper orientation="horizontal" activeStep={5} sx={{ mb: 3 }}>
          <Step key="dependency">
            <StepLabel>Dependency Analysis</StepLabel>
          </Step>
          <Step key="steady">
            <StepLabel>Steady State Definition</StepLabel>
          </Step>
          <Step key="hypothesis">
            <StepLabel>Hypothesis Generation</StepLabel>
          </Step>
          <Step key="experiments">
            <StepLabel>Experiment Design</StepLabel>
          </Step>
          <Step key="rumsfeld">
            <StepLabel>Rumsfeld Matrix</StepLabel>
          </Step>
        </Stepper>
      </Box>
      
      <Box sx={{ mb: 3 }}>
        <Accordion expanded={expanded === 'panel1'} onChange={handleChange('panel1')}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <BugReportIcon sx={{ mr: 1, color: 'primary.main' }} />
              <Typography variant="subtitle1" fontWeight="bold">
                Dependency Analysis
              </Typography>
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <Typography variant="body2" sx={{ mb: 2 }}>
              {analysis.dependencyAnalysis.summary}
            </Typography>
            
            <List dense>
              {analysis.dependencyAnalysis.dependencies.map((dep, index) => (
                <ListItem key={index} sx={{ py: 1 }}>
                  <ListItemText 
                    primary={dep.name} 
                    secondary={
                      <>
                        <Typography variant="body2">{dep.description}</Typography>
                        <Typography variant="body2" color="error.main" sx={{ mt: 0.5 }}>
                          Impact: {dep.impact}
                        </Typography>
                      </>
                    } 
                  />
                </ListItem>
              ))}
            </List>
          </AccordionDetails>
        </Accordion>
        
        <Accordion expanded={expanded === 'panel2'} onChange={handleChange('panel2')}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <AssessmentIcon sx={{ mr: 1, color: 'primary.main' }} />
              <Typography variant="subtitle1" fontWeight="bold">
                Steady State Definitions
              </Typography>
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <Typography variant="body2" sx={{ mb: 2 }}>
              {analysis.steadyStateDefinitions.summary}
            </Typography>
            
            <Grid container spacing={2}>
              {analysis.steadyStateDefinitions.states.map((state, index) => (
                <Grid item xs={12} sm={6} key={index}>
                  <Paper elevation={1} sx={{ p: 2 }}>
                    <Typography variant="subtitle2" fontWeight="bold">
                      {state.name}
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      {state.description}
                    </Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="body2" color="text.secondary">
                        Metric: {state.metric}
                      </Typography>
                      <Chip 
                        label={`Threshold: ${state.threshold}`} 
                        size="small" 
                        color="primary" 
                        variant="outlined" 
                      />
                    </Box>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </AccordionDetails>
        </Accordion>
        
        <Accordion expanded={expanded === 'panel3'} onChange={handleChange('panel3')}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <PsychologyIcon sx={{ mr: 1, color: 'primary.main' }} />
              <Typography variant="subtitle1" fontWeight="bold">
                Test Hypotheses
              </Typography>
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <Typography variant="body2" sx={{ mb: 2 }}>
              {analysis.hypotheses.summary}
            </Typography>
            
            <List dense>
              {analysis.hypotheses.items.map((item, index) => (
                <ListItem key={index} sx={{ py: 1 }}>
                  <ListItemText 
                    primary={item.description} 
                    secondary={`Test approach: ${item.testApproach}`} 
                  />
                </ListItem>
              ))}
            </List>
          </AccordionDetails>
        </Accordion>
        
        <Accordion expanded={expanded === 'panel4'} onChange={handleChange('panel4')}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <ScienceIcon sx={{ mr: 1, color: 'primary.main' }} />
              <Typography variant="subtitle1" fontWeight="bold">
                Chaos Experiments
              </Typography>
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <Typography variant="body2" sx={{ mb: 2 }}>
              {analysis.experiments.summary}
            </Typography>
            
            {analysis.experiments.items.map((exp, index) => (
              <Paper elevation={1} sx={{ p: 2, mb: 2 }} key={index}>
                <Typography variant="subtitle2" fontWeight="bold">
                  {exp.name}
                </Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  {exp.description}
                </Typography>
                
                <Box sx={{ mb: 1 }}>
                  <Typography variant="body2" color="text.secondary" component="span">
                    Components: 
                  </Typography>
                  {exp.components.map((comp, i) => (
                    <Chip 
                      key={i} 
                      label={comp} 
                      size="small" 
                      sx={{ ml: 1, mb: 0.5 }} 
                    />
                  ))}
                </Box>
                
                <Typography variant="body2" sx={{ mb: 2 }}>
                  <strong>Expected Result:</strong> {exp.expectedResult}
                </Typography>
                
                <Typography variant="caption" gutterBottom>
                  Litmus Chaos Configuration:
                </Typography>
                <Paper 
                  elevation={0} 
                  sx={{ 
                    p: 1, 
                    backgroundColor: 'grey.100', 
                    maxHeight: 200, 
                    overflow: 'auto',
                    fontFamily: 'monospace',
                    fontSize: '0.75rem',
                    whiteSpace: 'pre-wrap'
                  }}
                >
                  {exp.litmusConfig}
                </Paper>
              </Paper>
            ))}
          </AccordionDetails>
        </Accordion>
        
        <Accordion expanded={expanded === 'panel5'} onChange={handleChange('panel5')}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <GppBadIcon sx={{ mr: 1, color: 'primary.main' }} />
              <Typography variant="subtitle1" fontWeight="bold">
                Rumsfeld Matrix & Blast Radius
              </Typography>
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
              Rumsfeld Matrix
            </Typography>
            <Typography variant="body2" sx={{ mb: 2 }}>
              {analysis.rumsfeld.summary}
            </Typography>
            
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={12} md={4}>
                <Paper elevation={1} sx={{ p: 2, height: '100%' }}>
                  <Typography variant="subtitle2" color="success.main" gutterBottom>
                    Known Knowns
                  </Typography>
                  <List dense>
                    {analysis.rumsfeld.matrix.knownKnowns.map((item, index) => (
                      <ListItem key={index}>
                        <ListItemText primary={item} />
                      </ListItem>
                    ))}
                  </List>
                </Paper>
              </Grid>
              
              <Grid item xs={12} md={4}>
                <Paper elevation={1} sx={{ p: 2, height: '100%' }}>
                  <Typography variant="subtitle2" color="warning.main" gutterBottom>
                    Known Unknowns
                  </Typography>
                  <List dense>
                    {analysis.rumsfeld.matrix.knownUnknowns.map((item, index) => (
                      <ListItem key={index}>
                        <ListItemText primary={item} />
                      </ListItem>
                    ))}
                  </List>
                </Paper>
              </Grid>
              
              <Grid item xs={12} md={4}>
                <Paper elevation={1} sx={{ p: 2, height: '100%' }}>
                  <Typography variant="subtitle2" color="error.main" gutterBottom>
                    Unknown Unknowns
                  </Typography>
                  <List dense>
                    {analysis.rumsfeld.matrix.unknownUnknowns.map((item, index) => (
                      <ListItem key={index}>
                        <ListItemText primary={item} />
                      </ListItem>
                    ))}
                  </List>
                </Paper>
              </Grid>
            </Grid>
            
            <Divider sx={{ my: 2 }} />
            
            <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
              Blast Radius Analysis
            </Typography>
            <Typography variant="body2" sx={{ mb: 2 }}>
              {analysis.blastRadius.summary}
            </Typography>
            
            {analysis.blastRadius.analyses.map((blast, index) => (
              <Paper elevation={1} sx={{ p: 2, mb: 2 }} key={index}>
                <Typography variant="subtitle2" fontWeight="bold">
                  {blast.test}
                </Typography>
                
                <Box sx={{ mt: 1 }}>
                  <Typography variant="body2" color="error.main">
                    <strong>Direct Impact:</strong>
                  </Typography>
                  <List dense>
                    {blast.directImpact.map((impact, i) => (
                      <ListItem key={i}>
                        <ListItemText primary={impact} />
                      </ListItem>
                    ))}
                  </List>
                </Box>
                
                <Box sx={{ mt: 1 }}>
                  <Typography variant="body2" color="warning.main">
                    <strong>Indirect Impact:</strong>
                  </Typography>
                  <List dense>
                    {blast.indirectImpact.map((impact, i) => (
                      <ListItem key={i}>
                        <ListItemText primary={impact} />
                      </ListItem>
                    ))}
                  </List>
                </Box>
                
                <Typography variant="body2" sx={{ mt: 1 }}>
                  <strong>Containment Strategy:</strong> {blast.containment}
                </Typography>
              </Paper>
            ))}
          </AccordionDetails>
        </Accordion>
      </Box>
      
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
          Continue to PRR Summary
        </Button>
      </Box>
    </Box>
  );
};

export default DestructiveTestAnalysis;