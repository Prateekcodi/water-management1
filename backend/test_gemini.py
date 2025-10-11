#!/usr/bin/env python3
"""
Test Gemini AI models to find the correct model name
"""

import os
from dotenv import load_dotenv
import google.generativeai as genai

# Load environment variables
load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")

if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)
    
    print("Available Gemini models:")
    try:
        models = genai.list_models()
        for model in models:
            if 'generateContent' in model.supported_generation_methods:
                print(f"- {model.name}")
    except Exception as e:
        print(f"Error listing models: {e}")
        
    # Try some common model names
    model_names = [
        'gemini-pro',
        'gemini-1.5-pro',
        'gemini-1.5-flash',
        'models/gemini-pro',
        'models/gemini-1.5-pro',
        'models/gemini-1.5-flash'
    ]
    
    print("\nTesting model names:")
    for model_name in model_names:
        try:
            model = genai.GenerativeModel(model_name)
            response = model.generate_content("Hello, test message")
            print(f"✅ {model_name} - WORKS")
            print(f"   Response: {response.text[:50]}...")
            break
        except Exception as e:
            print(f"❌ {model_name} - Error: {str(e)[:100]}...")
else:
    print("No Gemini API key found in .env file")