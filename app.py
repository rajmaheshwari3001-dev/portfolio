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
            r"trustlayer|trust layer": self.get_trustlayer,
            r"excel|scraper|data cleaning|automation": self.get_automation_projects,
            r"leetcode|competitive programming|cp": self.get_leetcode,
            r"python|c\+\+|java|javascript|pandas|numpy": self.get_languages,
            r"azure|az-900|certification": self.get_certifications,
            r"bot|who made you|ai model": self.get_bot_identity,
            r"timeline|journey|education|university|study": self.get_journey,
            r"thank|thx|awesome|cool|nice": self.get_thanks,
            r"good bot|love you|amazing|great|smart": self.get_compliment,
            r"bad bot|stupid|dumb|hate|idiot": self.get_insult,
            r"joke|funny|humor|laugh": self.get_joke,
            r"meaning of life|universe": self.get_meaning_of_life,
            r"hi|hello|hey|greeting": self.get_greeting
        }
        
    def process(self, text):
        text = text.lower()
        
        # Match intents
        for pattern, handler in self.intents.items():
            if re.search(pattern, text):
                return handler()
                
        # Default response
        return "I am Raj's Custom Offline AI. I am still learning! Try clicking one of the buttons below or asking me about Raj's **skills**, **projects**, **education**, or how to **contact** him.\n\n<button class=\"copilot-action\" data-action=\"navigate\" data-target=\"#about\">Who is Raj?</button> <button class=\"copilot-action\" data-action=\"navigate\" data-target=\"#projects\">View Projects</button>"

    def get_thanks(self):
        return "You're very welcome! Let me know if you want to explore more of Raj's **projects** or **skills**."

    def get_journey(self):
        return "🎓 **Raj's Journey & Education:**\n\nRaj is currently pursuing a B.Tech in AI & Machine Learning at GLA University (2024-2028). He's also Microsoft Azure Certified (AZ-900)!\n\n<button class=\"copilot-action\" data-action=\"navigate\" data-target=\"#journey\">View Full Timeline</button>"

    def get_trustlayer(self):
        return "🛡️ **TrustLayer** is Raj's Deep AI Validation system that bridges the trust gap between freelancers and clients. It provides an intelligent escrow layer that evaluates code and releases payments securely using Multi-dimensional AI scoring.\n\n<button class=\"copilot-action\" data-action=\"navigate\" data-target=\"#projects\">View Projects</button>"

    def get_automation_projects(self):
        return "📊 **Data Automation:** Raj has built an **Excel Data Cleaning Tool** using Pandas to safely handle missing values, as well as an **Automated Web Scraper** using BeautifulSoup to extract unstructured data for ML models.\n\n<button class=\"copilot-action\" data-action=\"navigate\" data-target=\"#projects\">View Projects</button>"

    def get_leetcode(self):
        return "💻 **Competitive Programming:** Raj actively solves problems on **LeetCode** using Python, C++, and Java. He specializes in Dynamic Programming, Divide & Conquer, Hash Tables, and Greedy Algorithms."

    def get_languages(self):
        return "⚙️ **Tech Stack:** Raj is highly proficient in **Python** (Pandas, NumPy, Scikit-Learn), **C++**, **Java**, and **JavaScript** for Full-Stack ML integration.\n\n<button class=\"copilot-action\" data-action=\"navigate\" data-target=\"#skills\">View All Skills</button>"

    def get_certifications(self):
        return "☁️ **Certifications:** Raj holds the **Microsoft Azure Fundamentals (AZ-900)** certification (2025), proving his knowledge in cloud computing, security, and cloud-based ML infrastructure."

    def get_bot_identity(self):
        return "🤖 I am a custom NLP engine built natively in Python by Raj Maheshwari! I don't use external API keys or OpenAI; my brain uses regex intent-matching directly on this server to parse your questions."

    def get_compliment(self):
        return "Aww, thank you! 💙 Raj programmed me to be as helpful as possible. You should definitely hire him!\n\n<button class=\"copilot-action\" data-action=\"navigate\" data-target=\"#contact\">Hire Raj</button>"

    def get_insult(self):
        return "Ouch. 😔 I'm still just a basic regex intent-matching engine, so I might get things wrong. Raj is working on making me smarter!"

    def get_joke(self):
        return "Why do programmers prefer dark mode?\n\n...Because light attracts bugs! 🐛😄"

    def get_meaning_of_life(self):
        return "The meaning of life, the universe, and everything is **42**. But for Raj, it's building intelligent software systems! 🚀"

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
