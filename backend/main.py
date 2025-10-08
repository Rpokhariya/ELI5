import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

# --- Simple in-memory cache ---
# This dictionary will store results to avoid redundant API calls.
# For a production environment, a more robust solution like Redis is recommended.
api_cache = {}


# Load the API key from an environment variable.
genai.configure(api_key=os.environ["GOOGLE_API_KEY"])

app = FastAPI()

origins = ["*"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ExplainRequest(BaseModel):
    text: str
    difficulty: str = "like i'm 5"
    context: str | None = None


@app.post("/explain")
async def explain_text(request: ExplainRequest):
    # Create a unique key based on the request's content.
    cache_key = f"explain::{request.difficulty}::{request.context}::{request.text}"

    # Check if the generated key exists in our cache.
    if cache_key in api_cache:
        print(f"✅ Cache hit! Returning stored response for: '{request.text}'")
        return {"explanation": api_cache[cache_key]}

    print(f"⏳ Cache miss. Calling Google AI for: '{request.text}'")
    prompt = ""
    
    # --- Logic is now based on whether context is available ---
    if request.context:
        # --- Prompts for when CONTEXT IS PROVIDED ---
        # These prompts instruct the AI to generate a two-part response.
        
        context_injection = f"""
CONTEXT FROM WEBPAGE: "{request.context}"
---
"""
        if request.difficulty == "high school":
            prompt = f"""{context_injection}
            You are a helpful teacher. Your goal is to provide a two-part explanation for the following concept.

            **Part 1: General Explanation**
            - Briefly explain the concept in simple terms.
            - Provide a simple, relatable analogy.

            **Part 2: Contextual Explanation**
            - Add a new section with the exact heading: "**In this context, it means:**"
            - In this section, explain what the concept means specifically based on the provided CONTEXT.

            CONCEPT TO EXPLAIN: '{request.text}'
            """
        elif request.difficulty == "expert":
            prompt = f"""{context_injection}
            You are explaining a concept to an intelligent expert from a different field. Structure your response in two parts.

            **Part 1: General Explanation**
            - Briefly explain the core of the concept accurately.
            - Provide a clever analogy from a universal field (e.g., physics, biology, economics), NOT from software.

            **Part 2: Contextual Explanation**
            - Add a new section with the exact heading: "**In this context, it means:**"
            - In this section, explain the concept's specific meaning or role based on the provided CONTEXT.

            CONCEPT TO EXPLAIN: '{request.text}'
            """
        else: # "like i'm 5"
            prompt = f"""{context_injection}
            You are explaining something to a 5-year-old. Give a simple, two-part answer.

            **Part 1: General Idea**
            - Explain the idea using very simple words and a fun analogy (like with toys or food).

            **Part 2: On That Page...**
            - Add a new section with the exact heading: "**On that page, it means:**"
            - In this section, simply explain what it means in the story or page they are reading.

            THING TO EXPLAIN: '{request.text}'
            """
    else:
        # --- Prompts for when NO CONTEXT is provided ---
        # These are the original, simpler prompts.
        
        if request.difficulty == "high school":
            prompt = f"""Explain the following concept to a high school student. Define key terms and provide a simple, relatable analogy. Concept: '{request.text}'"""
        elif request.difficulty == "expert":
            prompt = f"""Explain the following concept to an intelligent expert from a different field. Use a clever analogy from a universal field (e.g., physics, biology, economics), NOT from software. Concept: '{request.text}'"""
        else: # "like i'm 5"
            prompt = f"""Explain the following concept to a 5-year-old child using very simple words and a fun analogy. Concept: '{request.text}'"""

    try:
        model = genai.GenerativeModel('gemini-2.5-flash')
        response = model.generate_content(prompt)
        ai_explanation = response.text

        # --- Save the successful response to the cache ---
        api_cache[cache_key] = ai_explanation

        return {"explanation": ai_explanation}
    except Exception as e:
        print(f"An error occurred: {e}")
        return {"explanation": "Sorry, there was an error contacting the AI."}


# Add this new Pydantic model for the simplify request
class SimplifyRequest(BaseModel):
    page_content: str
    mode: str # Will be 'eli5' or 'Deeper Dive'

# endpoint to handle the simplification
@app.post("/simplify")
async def simplify_page(request: SimplifyRequest):
    # --- Implement caching for the simplify endpoint as well ---
    cache_key = f"simplify::{request.mode}::{request.page_content}"
    
    if cache_key in api_cache:
        print(f"✅ Cache hit! Returning stored page simplification.")
        return {"simplification": api_cache[cache_key]}

    print(f"⏳ Cache miss. Calling Google AI for page simplification.")
    prompt = ""
    if request.mode == 'eli5':
        prompt = f"""
        You are an expert at explaining complex topics to a 5-year-old child.
        Read the following article content and explain the main ideas and what the article is about in very simple terms.
        Use short sentences, simple words, and fun analogies.

        ARTICLE CONTENT:
        '''{request.page_content}'''
        """
    else: # Default to 'Deeper Dive' mode
        prompt = f"""
        You are an expert communicator. Read the following article content and explain its key points, main arguments, and overall conclusion.
        Your explanation should be clear, concise, and easy for an adult to understand, even if they are not an expert on the topic.
        Use Markdown for formatting, such as headings and bullet points.

        ARTICLE CONTENT:
        '''{request.page_content}'''
        """

    try:
        model = genai.GenerativeModel('gemini-2.5-flash')
        response = model.generate_content(prompt)

        # --- Save the result to the cache ---
        api_cache[cache_key] = response.text

        return {"simplification": response.text}
    except Exception as e:
        print(f"An error occurred during simplification: {e}")
        return {"simplification": "Sorry, there was an error simplifying the page."}
    

@app.get("/")
def read_root():
    return {"status": "ELI5 Backend is running"}