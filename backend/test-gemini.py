# test_gemini.py
import os
from dotenv import load_dotenv
import google.generativeai as genai
import base64
from PIL import Image
import io

# Load environment variables
load_dotenv()
api_key = os.getenv("GOOGLE_API_KEY")
print(f"API Key loaded: {'Yes' if api_key else 'No'}")
print(f"API Key preview: {api_key[:5]}...{api_key[-5:] if api_key and len(api_key) > 10 else 'Invalid or too short'}")

# Configure Gemini
try:
    genai.configure(api_key=api_key)
    print("Configured Gemini with API key")
    
    # Create model
    model = genai.GenerativeModel('gemini-1.5-flash')
    print("Successfully initialized Gemini Pro Vision model")
    
    # Load a test image
    image_path = "/Users/ashi/Documents/PRR Agent/sample-architecture-diagram.png"  # Update with your image path
    img = Image.open(image_path)
    print(f"Loaded image: {image_path}, size: {img.size}")
    
    # Convert image to bytes
    img_byte_arr = io.BytesIO()
    img.save(img_byte_arr, format=img.format)
    img_bytes = img_byte_arr.getvalue()
    
    # Prepare content parts
    prompt = "Analyze this architecture diagram. Identify components, dependencies, and potential issues."
    
    # Generate response
    response = model.generate_content([
        prompt,
        {"mime_type": f"image/{img.format.lower()}", "data": img_bytes}
    ])
    
    print("\nGemini Response:")
    print(response.text[:500] + "..." if len(response.text) > 500 else response.text)
    
except Exception as e:
    print(f"Error: {str(e)}")
    import traceback
    print(traceback.format_exc())