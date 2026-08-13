import os
import json
import re
from flask import Flask, render_template, jsonify, request
from dotenv import load_dotenv
from config import PROFILE_CONFIG
from services.github_service import get_github_activity, get_github_profile, get_github_repos_and_languages
from services.leetcode_service import get_leetcode_profile
import datetime

app = Flask(__name__)
app.config['TEMPLATES_AUTO_RELOAD'] = True
app.config['SEND_FILE_MAX_AGE_DEFAULT'] = 31536000 # Cache static files for 1 year

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

load_dotenv()

def load_portfolio_data():
    try:
        with open("portfolio_data.json", "r") as f:
            return json.load(f)
    except Exception as e:
        print("Error loading portfolio data:", str(e))
        return {}

PORTFOLIO_DATA = load_portfolio_data()

class LocalNLPEngine:
    def __init__(self, data):
        self.data = data
        self.intents = {
            r"summary|recruiter|about|who|background": self.get_summary,
            r"project|work|portfolio|built|creation": self.get_projects,
            r"skill|tech|stack|language|framework|tool": self.get_skills,
            r"contact|email|hire|reach|linkedin|github": self.get_contact,
            r"interview|question|experience|intern": self.get_interview,
            r"hi|hello|hey|greeting": self.get_greeting
        }
        
    def process(self, text):
        text = text.lower()
        
        # Match intents
        for pattern, handler in self.intents.items():
            if re.search(pattern, text):
                return handler()
                
        # Default response
        return "I am Raj's Custom Offline AI. I don't rely on external API keys—my brain is an intent-matching engine built directly into this server! Try asking me about Raj's **skills**, **projects**, for a **recruiter summary**, or how to **contact** him."

    def get_greeting(self):
        return "Hello! I am Raj's custom-built offline Copilot. How can I assist you with exploring his portfolio today?"

    def get_summary(self):
        p = self.data.get("profile", {})
        return f"👨‍💼 **{p.get('title')} | {p.get('degree')}**\n\n{p.get('summary')}\n\n<button class=\"copilot-action\" data-action=\"navigate\" data-target=\"#about\">View About Section</button>"

    def get_projects(self):
        projects = self.data.get("projects", [])
        if not projects: return "I don't have project info right now."
        res = "🚀 **Here are some of Raj's top projects:**\n\n"
        for proj in projects[:3]:
            res += f"- **[{proj.get('name')}]({proj.get('url')})**: {proj.get('overview')}\n"
        res += "\n<button class=\"copilot-action\" data-action=\"navigate\" data-target=\"#projects\">Explore All Projects</button>"
        return res
        
    def get_skills(self):
        skills = self.data.get("skills", {})
        res = "💻 **Raj's technical stack includes:**\n\n"
        for category, items in skills.items():
            res += f"- **{category.replace('_', ' ').title()}**: {', '.join(items)}\n"
        res += "\n<button class=\"copilot-action\" data-action=\"navigate\" data-target=\"#skills\">View Skills Matrix</button>"
        return res
        
    def get_contact(self):
        c = self.data.get("profile", {}).get("contact", {})
        return f"📩 **You can reach out to Raj via:**\n\n- **Email**: [{c.get('email')}](mailto:{c.get('email')})\n- **LinkedIn**: [Profile]({c.get('linkedin')})\n- **GitHub**: [Profile]({c.get('github')})\n\n<button class=\"copilot-action\" data-action=\"navigate\" data-target=\"#contact\">Go to Contact Form</button>"
        
    def get_interview(self):
        return "🎤 **Let's pretend I'm Raj in an interview!**\n\nI am currently pursuing my B.Tech in AI & ML at GLA University. I specialize in deep learning architectures, Python backend systems, and high-performance full-stack engineering. You can review my **skills** or ask about my **projects**."

nlp_engine = LocalNLPEngine(PORTFOLIO_DATA)

@app.route('/api/chat', methods=['POST'])
def chat_api():
    data = request.json
    messages = data.get("messages", [])
    if not messages:
        return jsonify({"success": False, "error": "No messages provided"})
    
    try:
        last_message = messages[-1]["content"]
        response_text = nlp_engine.process(last_message)
        return jsonify({"success": True, "response": response_text})
    except Exception as e:
        print("Chat API Error:", str(e))
        return jsonify({"success": False, "error": "AI service unavailable. Please try again later."})

if __name__ == '__main__':
    app.run(debug=True, port=5000)
