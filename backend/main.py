import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import google.generativeai as genai

# --- Configure the AI ---
# IMPORTANT: We will set the API key as an environment variable
# instead of writing it directly in the code for security.
genai.configure(api_key=os.environ["GOOGLE_API_KEY"])

# Initialize the FastAPI app
app = FastAPI()

# --- CORS Middleware ---
origins = ["*"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Pydantic Model ---
class ExplainRequest(BaseModel):
    text: str
    difficulty: str = "like i'm 5"

# --- API Endpoint ---
@app.post("/explain")
async def explain_text(request: ExplainRequest):
    print(f"Received text for AI: {request.text}")

    # Create a prompt for the AI model
    prompt = f"Explain the following concept like I'm 5 years old: '{request.text}'"
    
    try:
        # Initialize the generative model
        model = genai.GenerativeModel('gemini-2.5-flash')
        
        # Call the AI and get the response
        response = model.generate_content(prompt)
        
        # Extract the text from the response
        ai_explanation = response.text
        
        return {"explanation": ai_explanation}

    except Exception as e:
        # Handle potential errors from the AI API
        print(f"An error occurred: {e}")
        return {"explanation": "Sorry, there was an error contacting the AI."}

# A simple root endpoint to check if the server is running
@app.get("/")
def read_root():
    return {"status": "ELI5 Backend is running"}