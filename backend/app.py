# app.py
from fastapi import FastAPI, File, UploadFile, Form, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel
from typing import Dict, List, Any, Optional
from pathlib import Path
import os
import json
import base64
import io
import uuid
import time
from datetime import datetime
import asyncio
import google.generativeai as genai
from google.cloud import aiplatform
import logging
import traceback
import sys
from dotenv import load_dotenv

# Import Google ADK with the correct import structure
from google.adk.agents import Agent, LlmAgent
# Note: If you need to use other Google ADK modules, import them as needed
# For example:
# from google.adk.tools import BaseTool
# from google.adk.runners import Runner

app = FastAPI()
load_dotenv()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Store for analysis results
analysis_results = {}
prr_documents = {}
processing_files = {}

logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("api_debug.log"),
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger("sre_agent")
logger.setLevel(logging.DEBUG)

class ProjectMetadata(BaseModel):
    name: str
    description: str
    businessImpact: str

class AnalysisRequest(BaseModel):
    fileId: str
    metadata: ProjectMetadata

class SREAgent:
    """SRE Agent using Google ADK"""
    
    def __init__(self):
        self.api_key = os.getenv("GOOGLE_API_KEY")
        self.project_id = os.getenv("GOOGLE_CLOUD_PROJECT_ID")
        self.location = os.getenv("GOOGLE_CLOUD_LOCATION", "us-central1")

        logger.debug("Initializing SREAgent")
        logger.debug(f"API Key loaded: {'Yes' if self.api_key else 'No'}")
        
        try:
            # Import here to ensure errors are caught
            import google.generativeai as genai
            logger.debug("Successfully imported google.generativeai")
            
            # Configure the API
            genai.configure(api_key=self.api_key)
            logger.debug("Configured genai with API key")
            
            # Initialize model
            self.model = genai.GenerativeModel('gemini-1.5-flash')
            logger.debug("Successfully initialized gemini-pro-vision model")
        
        except Exception as e:
            logger.error(f"Error initializing Gemini: {str(e)}")
            logger.error(traceback.format_exc())
            logger.warning("Will use mock data due to initialization failure")
        
    async def analyze_system_architecture(self, diagram_data, metadata):
        """Analyze system architecture diagram using Gemini vision"""
        print(f"Using API Key: {self.api_key[:5]}...{self.api_key[-5:] if self.api_key and len(self.api_key) > 10 else 'Invalid'}")
        logger.info(f"Starting analysis for project: {metadata.name}")
        
        # Check the image data
        if not diagram_data:
            logger.error("No diagram data provided")
            return self._create_mock_system_analysis()
        
        logger.info(f"Image data type: {type(diagram_data)}")
        logger.info(f"Image data size: {len(diagram_data)} bytes")
        
        # Format the metadata for the LLM prompt
        metadata_text = f"""
        Project Name: {metadata.name}
        Description: {metadata.description}
        Business Impact: {metadata.businessImpact}
        """
        
        # Prepare the prompt for system analysis
        prompt = f"""
        You are an SRE expert analyzing a system architecture diagram. Your task is to extract key information 
        and provide a comprehensive analysis of the system.
        
        Please analyze the provided architecture diagram with this context:
        {metadata_text}
        
        Provide a structured analysis that includes:
        
        1. System Components
        - Identify all components and their purposes
        - Classify components by type (UI, service, database, etc.)
        - Identify technologies used
        
        2. Dependencies
        - Map all connections between components
        - Identify the nature of each dependency
        
        3. Critical Paths
        - Identify the main user/data flows
        - Highlight critical paths for business functionality
        
        4. Single Points of Failure
        - Identify potential SPOFs and their impact
        
        5. Recommendations
        - Suggest improvements to the architecture for reliability
        
        6. Availability Tier Classification
        - Classify the system as tier1 (99.99%), tier2 (99.9%), or tier3 (99.5%)
        - Provide justification for the classification
        
        Format your response as structured JSON with these sections.
        """
        
        try:
            # Convert image data to base64
            import base64
            base64_image = base64.b64encode(diagram_data).decode('utf-8')
            logger.info(f"Converted image to base64, length: {len(base64_image)}")
            
            # Determine MIME type
            import mimetypes
            mime_type = mimetypes.guess_type('image.png')[0] or 'image/png'
            logger.info(f"Using MIME type: {mime_type}")
            
            logger.info("Preparing to call Gemini API")
            
            try:
                # Send request to Gemini
                response = self.model.generate_content(
                    [
                        prompt,
                        {
                            "mime_type": mime_type,
                            "data": base64_image
                        }
                    ]
                )
                
                logger.info("Received response from Gemini API")
                analysis_text = response.text
                logger.info(f"Response text preview: {analysis_text[:100]}...")
                
                # Extract JSON from the response text
                try:
                    import re
                    logger.info("Attempting to extract JSON from response")
                    
                    # Look for JSON in code blocks
                    json_match = re.search(r'```json\n([\s\S]*?)\n```', analysis_text)
                    if json_match:
                        json_text = json_match.group(1)
                        logger.info("JSON found in code block")
                    else:
                        # Try to find JSON-like content
                        if analysis_text.strip().startswith('{') and analysis_text.strip().endswith('}'):
                            json_text = analysis_text
                            logger.info("Response appears to be JSON formatted")
                        else:
                            # Fall back to using the whole text
                            json_text = analysis_text
                            logger.info("No JSON code block found, using full response")
                    
                    logger.debug(f"JSON text to parse: {json_text[:200]}...")
                    structured_analysis = json.loads(json_text)
                    logger.info("Successfully parsed JSON response")
                    return structured_analysis
                    
                except json.JSONDecodeError as e:
                    logger.error(f"JSON decode error: {str(e)}")
                    logger.info("Falling back to text extraction")
                    return self._extract_structured_analysis(analysis_text)
                    
            except Exception as e:
                logger.error(f"Error generating content with Gemini: {str(e)}")
                logger.error(traceback.format_exc())
                logger.info("Falling back to mock data due to API error")
                return self._create_mock_system_analysis()
                
        except Exception as e:
            logger.error(f"Error in analyze_system_architecture: {str(e)}")
            logger.error(traceback.format_exc())
            logger.info("Falling back to mock data due to general error")
            return self._create_mock_system_analysis()
    
    def _extract_structured_analysis(self, text):
        """Attempt to extract structured information from non-JSON text"""
        # Basic extraction logic - in a real implementation this would be more robust
        result = {
            "components": [],
            "dependencies": [],
            "criticalPaths": [],
            "singlePointsOfFailure": [],
            "recommendations": [],
            "availabilityTier": "tier2",
            "tierJustification": "Default justification based on text analysis"
        }
        
        # Very basic component extraction
        component_section = text.split("Components") if "Components" in text else ["", ""]
        if len(component_section) > 1:
            component_lines = component_section[1].split("\n")
            for line in component_lines[:10]:  # Get first 10 lines
                if ":" in line and len(line.strip()) > 5:
                    name = line.split(":")[0].strip()
                    desc = line.split(":", 1)[1].strip() if len(line.split(":", 1)) > 1 else ""
                    if name and desc:
                        result["components"].append({
                            "name": name,
                            "type": "service",  # Default type
                            "description": desc,
                            "technologies": []
                        })
        
        return result
    
    async def generate_chaos_testing_plan(self, system_analysis, metadata):
        """Generate chaos testing plan based on system analysis"""
        
        # Format the system analysis for the prompt
        components = "\n".join([f"- {c['name']}: {c['description']}" for c in system_analysis["components"]])
        dependencies = "\n".join([f"- {d['source']} → {d['target']} ({d['type']})" for d in system_analysis["dependencies"]])
        spofs = "\n".join([f"- {s['name']}: {s['impact']}" for s in system_analysis["singlePointsOfFailure"]])
        
        system_summary = f"""
        Components:
        {components}
        
        Dependencies:
        {dependencies}
        
        Single Points of Failure:
        {spofs}
        
        Availability Tier: {system_analysis["availabilityTier"]}
        """
        
        # In a real implementation, you would use the Agent to generate the chaos testing plan
        # For example:
        # result = await self.agent.run(
        #     message={"text": f"Create a comprehensive chaos testing plan for this system:\n{system_summary}\n\nProject metadata: {metadata.name} - {metadata.description} - Impact: {metadata.businessImpact}"}
        # )
        
        # For this example, we'll use a mock structured response
        destructive_test_plan = self._create_mock_chaos_testing_plan()
        return destructive_test_plan
    
    async def generate_prr_document(self, system_analysis, chaos_testing_plan, metadata):
        """Generate final PRR document based on all analyses"""
        
        # Combine analyses for the PRR document generation
        combined_analysis = {
            "system_analysis": system_analysis,
            "chaos_testing_plan": chaos_testing_plan,
            "metadata": {
                "name": metadata.name,
                "description": metadata.description,
                "businessImpact": metadata.businessImpact
            }
        }
        
        # In a real implementation, you would use the Agent to generate the PRR document
        # For example:
        # result = await self.agent.run(
        #     message={"text": f"Create a comprehensive PRR document based on these analyses:\n{json.dumps(combined_analysis, indent=2)}"}
        # )
        
        # For this example, we'll use a mock structured response
        structured_response = self._create_mock_prr_document(metadata)
        return structured_response
    
    def _create_mock_system_analysis(self):
        """Create mock system analysis data for demo purposes"""
        return {
            "components": [
                { "name": "Frontend Web App", "type": "ui", "description": "React-based user interface", "technologies": ["React", "Material UI"] },
                { "name": "API Gateway", "type": "api", "description": "RESTful API gateway", "technologies": ["Express.js", "Node.js"] },
                { "name": "Authentication Service", "type": "service", "description": "User authentication and authorization", "technologies": ["OAuth 2.0", "JWT"] },
                { "name": "Product Service", "type": "service", "description": "Core product management", "technologies": ["Java", "Spring Boot"] },
                { "name": "Inventory Service", "type": "service", "description": "Inventory tracking and management", "technologies": ["Java", "Spring Boot"] },
                { "name": "User Database", "type": "database", "description": "User data storage", "technologies": ["PostgreSQL"] },
                { "name": "Product Database", "type": "database", "description": "Product catalog storage", "technologies": ["MongoDB"] },
                { "name": "CDN", "type": "external", "description": "Content delivery network", "technologies": ["Cloudflare"] },
            ],
            "dependencies": [
                { "source": "Frontend Web App", "target": "API Gateway", "type": "REST" },
                { "source": "API Gateway", "target": "Authentication Service", "type": "REST" },
                { "source": "API Gateway", "target": "Product Service", "type": "REST" },
                { "source": "API Gateway", "target": "Inventory Service", "type": "REST" },
                { "source": "Authentication Service", "target": "User Database", "type": "Database" },
                { "source": "Product Service", "target": "Product Database", "type": "Database" },
                { "source": "Inventory Service", "target": "Product Database", "type": "Database" },
                { "source": "Frontend Web App", "target": "CDN", "type": "External" },
            ],
            "criticalPaths": [
                ["Frontend Web App", "API Gateway", "Authentication Service", "User Database"],
                ["Frontend Web App", "API Gateway", "Product Service", "Product Database"],
            ],
            "singlePointsOfFailure": [
                { "name": "API Gateway", "impact": "All services become inaccessible" },
                { "name": "Product Database", "impact": "Product and inventory data unavailable" }
            ],
            "recommendations": [
                "Implement API Gateway redundancy across multiple availability zones",
                "Set up database replication for Product Database",
                "Add circuit breakers between API Gateway and backend services",
                "Implement frontend caching strategy for product data"
            ],
            "availabilityTier": "tier2",
            "tierJustification": "The system has indirect revenue impact with customer-facing components. Backend service redundancy is limited, and there are identified single points of failure. Recommended availability target: 99.9%."
        }
    
    def _create_mock_chaos_testing_plan(self):
        """Create mock chaos testing plan data for demo purposes"""
        return {
            "dependencyAnalysis": {
                "summary": "The system has several critical dependencies that warrant chaos testing",
                "dependencies": [
                    { 
                        "name": "API Gateway Dependency", 
                        "description": "All services are accessed through the API Gateway, making it a critical SPOF",
                        "impact": "Failure would render all backend services inaccessible to end users"
                    },
                    { 
                        "name": "Product Database Dependency", 
                        "description": "Both Product and Inventory services rely on the same database",
                        "impact": "Failure affects multiple services and core functionality"
                    },
                    { 
                        "name": "Authentication Service Dependency", 
                        "description": "Required for user authentication across all protected endpoints",
                        "impact": "Failure would prevent authenticated operations system-wide"
                    },
                    { 
                        "name": "External CDN Dependency", 
                        "description": "Frontend static assets delivery depends on external CDN",
                        "impact": "Failure would degrade UI experience but not break core functionality"
                    }
                ]
            },
            "steadyStateDefinitions": {
                "summary": "The following steady states define normal system operation for validating chaos experiments",
                "states": [
                    {
                        "name": "API Gateway Response Time",
                        "description": "API Gateway responds to health checks within 300ms",
                        "metric": "p95 latency < 300ms",
                        "threshold": "300ms"
                    },
                    {
                        "name": "Authentication Service Availability",
                        "description": "Authentication service correctly validates tokens",
                        "metric": "Success rate > 99.9%",
                        "threshold": "99.9%"
                    },
                    {
                        "name": "Product Service Functionality",
                        "description": "Product service returns valid product data",
                        "metric": "Error rate < 0.1%",
                        "threshold": "0.1%"
                    },
                    {
                        "name": "Database Query Performance",
                        "description": "Database queries complete within acceptable timeframe",
                        "metric": "p95 query time < 100ms",
                        "threshold": "100ms"
                    },
                    {
                        "name": "End-to-End Transaction",
                        "description": "Complete product search to checkout flow succeeds",
                        "metric": "Success rate > 99.5%",
                        "threshold": "99.5%"
                    }
                ]
            },
            # Rest of the mock data (same as before)...
            "hypotheses": {
                "summary": "Test hypotheses for chaos testing scenarios",
                "items": [
                    {
                        "description": "When the API Gateway experiences high latency, the frontend will degrade gracefully with proper timeouts",
                        "testApproach": "Inject latency at the API Gateway level and observe frontend behavior"
                    },
                    {
                        "description": "When the Product Database becomes unavailable, the Product Service will serve cached data",
                        "testApproach": "Terminate Product Database connections and validate Product Service response"
                    },
                    {
                        "description": "When the Authentication Service is under high load, legitimate user sessions remain valid",
                        "testApproach": "Generate high CPU load on Authentication Service while monitoring active sessions"
                    },
                    {
                        "description": "When network connectivity between services is degraded, retry mechanisms will maintain functionality",
                        "testApproach": "Introduce packet loss between services and monitor recovery behavior"
                    }
                ]
            },
            "experiments": {
                "summary": "Prioritized chaos experiments to validate system resilience",
                "items": [
                    {
                        "name": "API Gateway Latency Injection",
                        "description": "Inject 1000ms latency to API Gateway responses",
                        "components": ["API Gateway"],
                        "expectedResult": "Frontend shows loading states and retries failed requests",
                        "litmusConfig": "apiVersion: litmuschaos.io/v1alpha1\nkind: ChaosEngine\nmetadata:\n  name: api-gateway-latency\nspec:\n  appinfo:\n    appns: 'default'\n    applabel: 'app=api-gateway'\n    appkind: 'deployment'\n  chaosServiceAccount: litmus-admin\n  experiments:\n    - name: pod-network-latency\n      spec:\n        components:\n          env:\n            - name: TOTAL_CHAOS_DURATION\n              value: '60'\n            - name: NETWORK_LATENCY\n              value: '1000'"
                    },
                    {
                        "name": "Product Database Termination",
                        "description": "Terminate Product Database pod for 30 seconds",
                        "components": ["Product Database"],
                        "expectedResult": "Product Service serves cached data and automatically reconnects",
                        "litmusConfig": "apiVersion: litmuschaos.io/v1alpha1\nkind: ChaosEngine\nmetadata:\n  name: product-db-termination\nspec:\n  appinfo:\n    appns: 'default'\n    applabel: 'app=product-db'\n    appkind: 'statefulset'\n  chaosServiceAccount: litmus-admin\n  experiments:\n    - name: pod-delete\n      spec:\n        components:\n          env:\n            - name: TOTAL_CHAOS_DURATION\n              value: '30'\n            - name: FORCE\n              value: 'true'"
                    },
                    {
                        "name": "Authentication Service CPU Stress",
                        "description": "Stress CPU on Authentication Service to 80% for 2 minutes",
                        "components": ["Authentication Service"],
                        "expectedResult": "Active sessions remain valid with potential latency increase",
                        "litmusConfig": "apiVersion: litmuschaos.io/v1alpha1\nkind: ChaosEngine\nmetadata:\n  name: auth-service-cpu-hog\nspec:\n  appinfo:\n    appns: 'default'\n    applabel: 'app=auth-service'\n    appkind: 'deployment'\n  chaosServiceAccount: litmus-admin\n  experiments:\n    - name: pod-cpu-hog\n      spec:\n        components:\n          env:\n            - name: TOTAL_CHAOS_DURATION\n              value: '120'\n            - name: CPU_CORES\n              value: '1'\n            - name: CPU_LOAD\n              value: '80'"
                    },
                    {
                        "name": "Network Partition Test",
                        "description": "Introduce network partition between frontend and backend services",
                        "components": ["Frontend Web App", "API Gateway"],
                        "expectedResult": "Frontend shows appropriate error messages and retry options",
                        "litmusConfig": "apiVersion: litmuschaos.io/v1alpha1\nkind: ChaosEngine\nmetadata:\n  name: network-partition\nspec:\n  appinfo:\n    appns: 'default'\n    applabel: 'app=api-gateway'\n    appkind: 'deployment'\n  chaosServiceAccount: litmus-admin\n  experiments:\n    - name: pod-network-loss\n      spec:\n        components:\n          env:\n            - name: TOTAL_CHAOS_DURATION\n              value: '60'\n            - name: NETWORK_INTERFACE\n              value: 'eth0'\n            - name: NETWORK_PACKET_LOSS_PERCENTAGE\n              value: '100'"
                    }
                ]
            },
            "rumsfeld": {
                "summary": "Rumsfeld Matrix analysis for known and unknown failure scenarios",
                "matrix": {
                    "knownKnowns": [
                        "API Gateway is a single point of failure",
                        "Product Database outage affects multiple services",
                        "Authentication failures will impact all authenticated operations",
                        "Network issues between frontend and backend will disrupt user experience"
                    ],
                    "knownUnknowns": [
                        "Behavior under sustained high load over multiple hours",
                        "Recovery characteristics after complete region failure",
                        "Impact of third-party CDN disruption during peak traffic",
                        "Database performance degradation patterns during multi-service high load"
                    ],
                    "unknownUnknowns": [
                        "Potential for unforeseen cascading failures across seemingly isolated components",
                        "Novel failure modes from combinations of component failures",
                        "User behavior changes in response to partial system degradation",
                        "Emergent properties under extreme conditions"
                    ]
                },
                "recommendations": [
                    "Implement canary deployments to detect potential failures early",
                    "Add distributed tracing to identify cascading failure patterns",
                    "Establish automated game days to explore unknown failure modes",
                    "Create more granular circuit breakers between components"
                ]
            },
            "blastRadius": {
                "summary": "Analysis of the impact scope for each test case",
                "analyses": [
                    {
                        "test": "API Gateway Latency Injection",
                        "directImpact": ["All API requests experience increased latency"],
                        "indirectImpact": ["Potential timeout cascades in dependent services", "User experience degradation"],
                        "containment": "Impact limited to active user sessions, no data loss expected"
                    },
                    {
                        "test": "Product Database Termination",
                        "directImpact": ["Product and Inventory services lose database connectivity"],
                        "indirectImpact": ["API calls for product data return cached/stale data or errors"],
                        "containment": "Impact limited to product-related operations, authentication still functions"
                    },
                    {
                        "test": "Authentication Service CPU Stress",
                        "directImpact": ["Increased latency for authentication operations"],
                        "indirectImpact": ["Potential failure of new login attempts"],
                        "containment": "Existing sessions should remain valid, impact limited to authentication operations"
                    },
                    {
                        "test": "Network Partition Test",
                        "directImpact": ["Frontend cannot communicate with backend services"],
                        "indirectImpact": ["All user operations fail at frontend"],
                        "containment": "Backend services continue processing queued operations, no data loss expected"
                    }
                ]
            }
        }
    
    def _create_mock_prr_document(self, metadata):
        """Create mock PRR document data for demo purposes"""
        return {
            "title": metadata.name + " - Production Readiness Review",
            "version": "1.0",
            "date": datetime.now().strftime("%Y-%m-%d"),
            "sections": [
                {
                    "title": "Service Overview",
                    "content": f"{metadata.name} is a {metadata.businessImpact} impact service that provides product and inventory management capabilities. The service is designed for a retail environment and handles core e-commerce functionality including product catalog management, inventory tracking, and user authentication.\n\nBased on the business requirements and technical analysis, this service has been classified as a Tier 2 system with a target availability of 99.9%."
                },
                {
                    "title": "Architecture Analysis",
                    "content": "The system consists of the following key components:\n\n- Frontend Web App: React-based user interface\n- API Gateway: Central entry point for all service requests\n- Authentication Service: Handles user authentication and authorization\n- Product Service: Core product management functionality\n- Inventory Service: Tracks and manages inventory levels\n- User Database: PostgreSQL database for user data\n- Product Database: MongoDB database for product catalog\n\nCritical paths have been identified between the Frontend and backend services, with all traffic routing through the API Gateway. Single points of failure have been identified in the API Gateway and Product Database."
                },
                {
                    "title": "Resilience Testing Strategy",
                    "content": "A comprehensive destructive testing plan has been developed to validate system resilience. Key test scenarios include:\n\n1. API Gateway Latency Injection: Testing frontend resilience to backend latency\n2. Product Database Termination: Validating cache effectiveness and recovery\n3. Authentication Service CPU Stress: Ensuring session stability under load\n4. Network Partition Testing: Verifying graceful degradation under connectivity issues\n\nEach test has been defined with Litmus Chaos configurations, expected outcomes, and detailed blast radius analysis. The testing approach covers both direct dependencies and potential cascading failures."
                },
                {
                    "title": "Availability Design",
                    "content": "The system has been classified as Tier 2 (High) with a target availability of 99.9%, allowing for approximately 8.76 hours of downtime per year.\n\nKey factors in this classification:\n- Indirect revenue impact through customer-facing components\n- Critical dependency on shared Product Database\n- API Gateway as a single point of failure\n- Limited redundancy in certain components\n\nAvailability improvement recommendations:\n- Implement redundant API Gateway instances across availability zones\n- Configure database replication for the Product Database\n- Add circuit breakers between API Gateway and backend services\n- Implement frontend caching for product data"
                },
                {
                    "title": "Observability Strategy",
                    "content": "The following observability implementation is recommended:\n\n- Implement OpenTelemetry instrumentation for all services with the agent and SDK approach\n- Deploy collectors in a hub and spoke model\n- Define SLOs based on the identified steady-state metrics:\n  * API Gateway Response Time: p95 < 300ms\n  * Authentication Service Success Rate: > 99.9%\n  * Product Service Error Rate: < 0.1%\n  * End-to-End Transaction Success: > 99.5%\n\nDashboards should be created to track these metrics with appropriate alerting thresholds."
                },
                {
                    "title": "Identified Risks & Mitigations",
                    "content": "Key risks identified through system analysis and destructive testing:\n\n1. API Gateway as SPOF\n   - Mitigation: Deploy redundant instances across zones\n   - Mitigation: Implement circuit breakers to prevent cascading failures\n\n2. Product Database shared dependency\n   - Mitigation: Implement read replicas for high availability\n   - Mitigation: Develop caching strategy at service level\n\n3. Limited resilience testing for \"Known Unknowns\"\n   - Mitigation: Schedule regular game days to explore edge cases\n   - Mitigation: Implement canary deployments for early detection\n\n4. Potential cascading failures\n   - Mitigation: Add bulkheads between components\n   - Mitigation: Implement retry mechanisms with exponential backoff"
                },
                {
                    "title": "Recommendations & Next Steps",
                    "content": "Based on the complete analysis, the following recommendations are prioritized:\n\n1. Address single points of failure in API Gateway and Product Database\n2. Implement the defined Chaos Testing plan to validate resilience\n3. Deploy comprehensive OpenTelemetry instrumentation for observability\n4. Establish SLOs and configure appropriate alerting\n5. Develop runbooks for identified failure scenarios\n6. Schedule quarterly resilience testing and game days\n\nThe system should undergo a follow-up review after implementing these recommendations to validate improvements."
                }
            ]
        }

# API endpoints
@app.post("/api/upload-diagram")
async def upload_diagram(file: UploadFile = File(...)):
    """Upload architecture diagram and store temporarily"""
    print(f"Received file upload: {file.filename}")
    file_id = str(uuid.uuid4())
    file_content = await file.read()
    
    # Store file content in memory (would use object storage in production)
    processing_files[file_id] = {
        "filename": file.filename,
        "content": file_content,
        "content_type": file.content_type,
        "timestamp": time.time()
    }
    
    return {"fileId": file_id, "filename": file.filename}

@app.get("/api/ping")
async def ping():
    """Simple endpoint to test API connection"""
    print("Ping received from frontend")
    return {"status": "success", "message": "API is working!"}

@app.get("/api/test-gemini")
async def test_gemini():
    """Test the Gemini API connection"""
    logger.info("Testing Gemini API connection")
    
    try:
        # Initialize the agent
        sre_agent = SREAgent()
        
        # Basic test with text-only prompt
        import google.generativeai as genai
        test_model = genai.GenerativeModel('gemini-1.5-flash')
        logger.info("Initialized test model")
        
        # Try a simple prompt
        response = test_model.generate_content("Say 'Hello, the API is working!'")
        logger.info(f"Got response: {response.text}")
        
        return {"status": "success", "message": response.text}
    except Exception as e:
        logger.error(f"Gemini API test failed: {str(e)}")
        logger.error(traceback.format_exc())
        return {"status": "error", "message": str(e)}
    
@app.post("/api/analyze-system")
async def analyze_system(request: AnalysisRequest, background_tasks: BackgroundTasks):
    """Analyze system architecture diagram"""
    logger.info(f"Received analysis request for file ID: {request.fileId}")
    
    file_id = request.fileId
    metadata = request.metadata
    
    if file_id not in processing_files:
        logger.error(f"File ID not found: {file_id}")
        return {"error": "File not found. Please upload the file again."}
    
    # Get file content
    file_data = processing_files[file_id]
    logger.info(f"Retrieved file: {file_data['filename']} ({len(file_data['content'])} bytes)")
    
    # Initialize SRE agent
    sre_agent = SREAgent()
    
    # Process system analysis
    logger.info("Starting architecture analysis")
    system_analysis = await sre_agent.analyze_system_architecture(
        file_data["content"],
        metadata
    )
    
    # Log if we got mock data or real data
    if "components" in system_analysis and len(system_analysis["components"]) > 0:
        first_component = system_analysis["components"][0].get("name", "")
        logger.info(f"Analysis complete. First component: {first_component}")
        if first_component == "Frontend Web App":
            logger.warning("Appears to be using mock data (first component matches mock data)")
    
    # Store analysis result
    analysis_id = str(uuid.uuid4())
    analysis_results[analysis_id] = {
        "type": "system_analysis",
        "data": system_analysis,
        "metadata": metadata.dict(),
        "timestamp": time.time()
    }
    
    return {
        "analysisId": analysis_id,
        "result": system_analysis
    }

@app.post("/api/analyze-destructive-tests")
async def analyze_destructive_tests(
    system_analysis_id: str = Form(...),
    metadata_json: str = Form(...)
):
    """Generate destructive testing plan based on system analysis"""
    if system_analysis_id not in analysis_results:
        return {"error": "System analysis not found. Please analyze the system first."}
    
    # Get system analysis data
    system_analysis_record = analysis_results[system_analysis_id]
    system_analysis = system_analysis_record["data"]
    
    # Parse metadata
    metadata = ProjectMetadata(**json.loads(metadata_json))
    
    # Initialize SRE agent
    sre_agent = SREAgent()
    
    # Generate destructive testing plan
    destructive_test_plan = await sre_agent.generate_chaos_testing_plan(
        system_analysis,
        metadata
    )
    
    # Store analysis result
    analysis_id = str(uuid.uuid4())
    analysis_results[analysis_id] = {
        "type": "destructive_testing",
        "data": destructive_test_plan,
        "system_analysis_id": system_analysis_id,
        "metadata": metadata.dict(),
        "timestamp": time.time()
    }
    
    return {
        "analysisId": analysis_id,
        "result": destructive_test_plan
    }

@app.post("/api/generate-prr")
async def generate_prr(
    system_analysis_id: str = Form(...),
    destructive_testing_id: str = Form(...),
    metadata_json: str = Form(...)
):
    """Generate PRR document based on all analyses"""
    if system_analysis_id not in analysis_results:
        return {"error": "System analysis not found."}
    
    if destructive_testing_id not in analysis_results:
        return {"error": "Destructive testing analysis not found."}
    
    # Get analysis data
    system_analysis = analysis_results[system_analysis_id]["data"]
    chaos_testing_plan = analysis_results[destructive_testing_id]["data"]
    
    # Parse metadata
    metadata = ProjectMetadata(**json.loads(metadata_json))
    
    # Initialize SRE agent
    sre_agent = SREAgent()
    
    # Generate PRR document
    prr_document = await sre_agent.generate_prr_document(
        system_analysis,
        chaos_testing_plan,
        metadata
    )
    
    # Store PRR document
    document_id = str(uuid.uuid4())
    prr_documents[document_id] = {
        "document": prr_document,
        "system_analysis_id": system_analysis_id,
        "destructive_testing_id": destructive_testing_id,
        "metadata": metadata.dict(),
        "timestamp": time.time()
    }
    
    return {
        "documentId": document_id,
        "document": prr_document
    }

@app.get("/api/check-env")
async def check_env():
    """Check if environment variables are loaded"""
    api_key = os.getenv("GOOGLE_API_KEY")
    masked_key = "Not set" if not api_key else f"{api_key[:5]}...{api_key[-5:]}" if len(api_key) > 10 else "Too short"
    print(f"API Key check: {masked_key}")
    return {"api_key_status": "Set" if api_key else "Not set"}

@app.get("/api/download-prr/{document_id}")
async def download_prr(document_id: str, format: str = "pdf"):
    """Download PRR document in specified format"""
    if document_id not in prr_documents:
        return {"error": "PRR document not found."}
    
    prr_record = prr_documents[document_id]
    prr_document = prr_record["document"]
    
    # In a real implementation, this would generate PDF/Word documents
    # For this example, we'll return a mock response
    
    if format == "pdf":
        return {
            "documentUrl": f"/downloads/{document_id}.pdf",
            "format": "pdf"
        }
    elif format == "docx":
        return {
            "documentUrl": f"/downloads/{document_id}.docx",
            "format": "docx"
        }
    else:
        return {"error": "Unsupported format. Use 'pdf' or 'docx'."}

# Run the server
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)