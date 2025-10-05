import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import google.generativeai as genai

# Configure the AI with your API key from environment variables
genai.configure(api_key=os.environ["GOOGLE_API_KEY"])

# Initialize the FastAPI app
app = FastAPI()

# CORS Middleware to allow the extension to communicate with the server
origins = ["*"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic model for the request body
class ExplainRequest(BaseModel):
    text: str
    difficulty: str = "like i'm 5"

# The main API endpoint
@app.post("/explain")
async def explain_text(request: ExplainRequest):
    print(f"Received text: '{request.text}' with difficulty: '{request.difficulty}'")

    # --- NEW: Dynamic Prompt Engineering ---
    prompt = "" # Start with an empty prompt
    
    if request.difficulty == "high school":
        prompt = f"""
        Explain the following concept assuming the reader is a high school student. 
        Define any key terms and provide context. Keep it concise.
        Concept: '{request.text}'
        """
    elif request.difficulty == "expert":
        prompt = f"""
        Explain the following concept to an expert in another technical field. 
        Use a powerful technical analogy to bridge the understanding. Be very brief and precise.
        Concept: '{request.text}'
        """
    else: # Default to "like i'm 5"
        prompt = f"Explain the following concept like I'm 5 years old: '{request.text}'"
    
    try:
        # Initialize the generative model
        model = genai.GenerativeModel('gemini-2.5-flash')
        
        # Call the AI with the chosen prompt
        response = model.generate_content(prompt)
        ai_explanation = response.text
        
        return {"explanation": ai_explanation}

    except Exception as e:
        print(f"An error occurred: {e}")
        return {"explanation": "Sorry, there was an error contacting the AI."}

# Root endpoint to check server status
@app.get("/")
def read_root():
    return {"status": "ELI5 Backend is running"}