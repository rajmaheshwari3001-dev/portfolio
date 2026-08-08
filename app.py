from flask import Flask, render_template, jsonify
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

if __name__ == '__main__':
    app.run(debug=True, port=5000)
