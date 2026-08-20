import os
import json
import requests
import re
from flask import Flask, render_template, jsonify, request
from dotenv import load_dotenv
from config import PROFILE_CONFIG
from services.github_service import get_github_activity, get_github_profile, get_github_repos_and_languages
from services.leetcode_service import get_leetcode_profile
import datetime

load_dotenv()

GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")

# Load portfolio data globally
with open('portfolio_data.json', 'r') as f:
    PORTFOLIO_DATA = json.load(f)

app = Flask(__name__)
app.config['TEMPLATES_AUTO_RELOAD'] = True
app.config['SEND_FILE_MAX_AGE_DEFAULT'] = 0 # Disabled caching for development

# Basic caching dictionary (In production, use Redis or Flask-Caching)
cache = {
    "github": {"data": None, "timestamp": None},
    "leetcode": {"data": None, "timestamp": None},
}
CACHE_TTL = 1800 # 30 minutes

def is_cache_valid(key):
    if cache[key]["data"] is None or cache[key]["timestamp"] is None:
        return False
    return (datetime.datetime.now() - cache[key]["timestamp"]).total_seconds() < CACHE_TTL

@app.route('/')
def index():
    return render_template('index.html', config=PROFILE_CONFIG)

@app.route('/api/activity/github')
def github_api():
    if is_cache_valid("github"):
        return jsonify({"success": True, "data": cache["github"]["data"]})
        
    try:
        profile = get_github_profile(PROFILE_CONFIG['github_username'])
        activity = get_github_activity(PROFILE_CONFIG['github_username'])
        repos_langs = get_github_repos_and_languages(PROFILE_CONFIG['github_username'])
        
        data = {
            "profile": profile,
            "activity": activity,
            "repos": repos_langs["repos"],
            "languages": repos_langs["languages"],
            "status": "connected" if profile else "unavailable"
        }
        
        cache["github"] = {
            "data": data,
            "timestamp": datetime.datetime.now()
        }
        return jsonify({"success": True, "data": data})
    except Exception as e:
        return jsonify({"success": False, "error": str(e), "status": "unavailable"})

@app.route('/api/activity/leetcode')
def leetcode_api():
    if is_cache_valid("leetcode"):
        return jsonify({"success": True, "data": cache["leetcode"]["data"]})
        
    try:
        data = get_leetcode_profile(PROFILE_CONFIG['leetcode_username'])
        cache["leetcode"] = {
            "data": data,
            "timestamp": datetime.datetime.now()
        }
        return jsonify({"success": True, "data": data})
    except Exception as e:
        return jsonify({"success": False, "error": str(e), "status": "unavailable"})

def get_gemini_response(messages, portfolio_data):
    if not GEMINI_API_KEY:
        return "Gemini API Key is not configured."
    
    # Create context based on portfolio data
    context = f"""
    You are Raj Maheshwari's AI portfolio assistant.
    CRITICAL INSTRUCTIONS:
    1. UNDERSTAND THE INTENT: First, analyze what the user is saying. Are they asking a question, greeting you, or making a casual remark? Frame your response naturally and conversationally based on their intent.
    2. AVOID REPETITION: Vary your phrasing. Do not sound like a predefined robotic chatbot.
    3. BE CONCISE: Keep your answers brief and directly to the point to ensure fast reading and low latency. Use emojis sparingly.
    4. CONTEXT ONLY: Answer strictly based on the Portfolio Data below. If asked something not in the data, politely say you don't know and suggest they contact Raj.
    
    Portfolio Data Context:
    {json.dumps(portfolio_data, indent=2)}
    """
    
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key={GEMINI_API_KEY}"
    
    contents = []
    
    # Add system context as the first user message
    contents.append({
        "role": "user",
        "parts": [{"text": context}]
    })
    # Gemini requires strictly alternating roles (user/model). To simulate system instruction,
    # we add an immediate "model" acknowledgment.
    contents.append({
        "role": "model",
        "parts": [{"text": "Understood. I will act as Raj Maheshwari's portfolio AI assistant and only use the provided context to answer questions."}]
    })
    
    for msg in messages:
        # Fix: Map frontend 'ai' role to 'model' for Gemini API strict alternation
        role = "model" if msg.get("role") in ["assistant", "ai", "model"] else "user"
        contents.append({
            "role": role,
            "parts": [{"text": msg.get("content", "")}]
        })
        
    payload = {
        "contents": contents,
        "generationConfig": {
            "temperature": 0.9,
            "maxOutputTokens": 300
        }
    }
    
    try:
        response = requests.post(url, json=payload, headers={'Content-Type': 'application/json'})
        data = response.json()
        
        if response.status_code == 200:
            return data["candidates"][0]["content"]["parts"][0]["text"]
        else:
            print("Gemini API Error details:", data)
            return "Sorry, I am currently unable to process your request."
            
    except Exception as e:
        print("Gemini API Error:", str(e))
        return "Sorry, I am currently unable to process your request."

@app.route('/api/chat', methods=['POST'])
def chat_api():
    data = request.json
    messages = data.get("messages", [])
    if not messages:
        return jsonify({"success": False, "error": "No messages provided"})
    
    try:
        response_text = get_gemini_response(messages, PORTFOLIO_DATA)
        return jsonify({"success": True, "response": response_text})
    except Exception as e:
        print("Chat API Error:", str(e))
        return jsonify({"success": False, "error": "AI service unavailable. Please try again later."})


if __name__ == '__main__':
    app.run(debug=True, port=5000)
