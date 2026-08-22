import os
import json
import re
from flask import Flask, render_template, jsonify, request
from dotenv import load_dotenv
import google.generativeai as genai
from config import PROFILE_CONFIG, GITHUB_TOKEN, GEMINI_API_KEY
from services.github_service import get_github_activity, get_github_profile, get_github_repos_and_languages
from services.leetcode_service import get_leetcode_profile
import datetime

app = Flask(__name__)
app.config['TEMPLATES_AUTO_RELOAD'] = True
app.config['SEND_FILE_MAX_AGE_DEFAULT'] = 31536000 # Cache static files for 1 year

# API Validation
from config import GITHUB_TOKEN
if not GITHUB_TOKEN:
    print("WARNING: GITHUB_TOKEN is not set in environment. App will use fallback data for GitHub API.")

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

@app.errorhandler(404)
def page_not_found(e):
    return render_template('404.html', config=PROFILE_CONFIG), 404

@app.errorhandler(500)
def internal_server_error(e):
    return render_template('500.html', config=PROFILE_CONFIG), 500

@app.route('/')
def index():
    return render_template('index.html', config=PROFILE_CONFIG)

@app.route('/projects')
def projects():
    return render_template('projects.html', config=PROFILE_CONFIG)

@app.route('/skills')
def skills():
    return render_template('skills.html', config=PROFILE_CONFIG)

@app.route('/activity')
def activity():
    return render_template('activity.html', config=PROFILE_CONFIG)

@app.route('/dashboard')
def dashboard():
    return render_template('dashboard.html', config=PROFILE_CONFIG)

@app.route('/journey')
def journey():
    return render_template('journey.html', config=PROFILE_CONFIG)

@app.route('/contact')
def contact():
    return render_template('contact.html', config=PROFILE_CONFIG)

@app.route('/resume')
def resume():
    return render_template('resume.html', config=PROFILE_CONFIG)

@app.route('/cv_raw')
def cv_raw():
    return render_template('cv_raw.html', config=PROFILE_CONFIG)

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
        data_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "portfolio_data.json")
        with open(data_path, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        print("Error loading portfolio data:", str(e))
        return {}

PORTFOLIO_DATA = load_portfolio_data()

class LocalNLPEngine:
    def __init__(self, data):
        self.data = data
        self.static_intents = {}
        self._load_intents()
        
    def _load_intents(self):
        try:
            intents_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'intents.json')
            with open(intents_path, 'r', encoding='utf-8') as f:
                intents_data = json.load(f)
                self.static_intents = intents_data.get('static_intents', {})
        except Exception as e:
            print(f"Error loading intents.json: {e}")
        
    def process(self, text):
        text = text.lower()
        
        # 1. Check static intents
        for intent_name, intent_data in self.static_intents.items():
            patterns = intent_data.get('patterns', [])
            for pattern in patterns:
                if re.search(pattern, text):
                    return intent_data.get('response', '')
                    
        # 2. Check dynamic/data-driven intents
        if re.search(r"summary|about|who", text): return self.get_summary()
        if re.search(r"project|work|portfolio", text): return self.get_projects()
        if re.search(r"skill|tech|stack", text): return self.get_skills()
        if re.search(r"contact|email|reach|hire", text): return self.get_contact()
                
        # 3. Default response
        return "I am Raj's Custom Offline AI. I am still learning! Try clicking one of the buttons below or asking me about Raj's **skills**, **projects**, **education**, or how to **contact** him.\n\n<button class=\"copilot-action\" data-action=\"navigate\" data-target=\"#about\">Who is Raj?</button> <button class=\"copilot-action\" data-action=\"navigate\" data-target=\"#projects\">View Projects</button>"



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
        


nlp_engine = LocalNLPEngine(PORTFOLIO_DATA)

# Configure Gemini if available
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)
    gemini_model = genai.GenerativeModel('gemini-1.5-flash')
else:
    gemini_model = None

@app.route('/api/chat', methods=['POST'])
def chat_api():
    data = request.json
    messages = data.get("messages", [])
    if not messages:
        return jsonify({"success": False, "error": "No messages provided"})
    
    try:
        last_message = messages[-1]["content"]
        
        # Use Gemini if configured, otherwise fallback to local regex engine
        if gemini_model:
            system_prompt = f"You are Raj Maheshwari's portfolio AI assistant. Be professional, concise, and helpful. Use markdown. Here is Raj's data: {json.dumps(PORTFOLIO_DATA)}"
            # Construct a prompt for Gemini
            prompt = system_prompt + "\n\nUser asked: " + last_message
            response = gemini_model.generate_content(prompt)
            response_text = response.text
        else:
            response_text = nlp_engine.process(last_message)
            
        return jsonify({"success": True, "response": response_text})
    except Exception as e:
        print("Chat API Error:", str(e))
        # Fallback to local engine if Gemini fails (e.g. rate limit, network error)
        try:
            fallback_text = nlp_engine.process(last_message)
            return jsonify({"success": True, "response": fallback_text})
        except:
            return jsonify({"success": False, "error": "AI service unavailable. Please try again later."})

if __name__ == '__main__':
    app.run(debug=True, port=5000)
