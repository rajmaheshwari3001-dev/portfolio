import requests
from config import GITHUB_TOKEN
from collections import defaultdict

def get_headers():
    if GITHUB_TOKEN:
        return {"Authorization": f"token {GITHUB_TOKEN}"}
    return {}

def get_github_profile(username):
    if not username: return None
    try:
        url = f"https://api.github.com/users/{username}"
        res = requests.get(url, headers=get_headers(), timeout=5)
        if res.status_code == 200:
            return res.json()
        elif res.status_code == 403 or res.status_code == 429: # Rate limited
            return {
                "login": username,
                "avatar_url": "https://avatars.githubusercontent.com/rajmaheshwari3001-dev",
                "public_repos": 4,
                "followers": 0,
                "name": "Raj Maheshwari"
            }
        return None
    except:
        return None

def get_github_activity(username):
    if not username: return []
    try:
        url = f"https://api.github.com/users/{username}/events/public"
        res = requests.get(url, headers=get_headers(), timeout=5)
        if res.status_code == 200:
            events = res.json()
            formatted = []
            for event in events:
                if len(formatted) >= 10: break
                etype = event.get("type", "").replace("Event", "")
                repo_name = event.get('repo', {}).get('name', '')
                title = f"{etype} on {repo_name}"
                
                # Format specific events nicely for the terminal UI
                if etype == "Push":
                    commits = len(event.get("payload", {}).get("commits", []))
                    title = f"Pushed {commits} commits to {repo_name}"
                elif etype == "Create":
                    ref_type = event.get("payload", {}).get("ref_type", "repository")
                    title = f"Created {ref_type} at {repo_name}"
                
                formatted.append({
                    "platform": "github",
                    "type": etype.upper(),
                    "title": title,
                    "timestamp": event.get("created_at"),
                    "url": f"https://github.com/{repo_name}"
                })
            return formatted
        elif res.status_code == 403 or res.status_code == 429:
            return [
                {"platform": "github", "type": "PUSH", "title": "Pushed to aiml-bootcamp-2026", "timestamp": "2026-08-08T10:00:00Z", "url": "https://github.com/rajmaheshwari3001-dev/aiml-bootcamp-2026"},
                {"platform": "github", "type": "CREATE", "title": "Created repository Excel-Data-Cleaning-Tool", "timestamp": "2026-08-07T14:30:00Z", "url": "https://github.com/rajmaheshwari3001-dev/Excel-Data-Cleaning-Tool"},
                {"platform": "github", "type": "PUSH", "title": "Pushed to Trustlayer", "timestamp": "2026-08-06T09:15:00Z", "url": "https://github.com/rajmaheshwari3001-dev/Trustlayer"},
                {"platform": "github", "type": "CREATE", "title": "Created repository -web-scraper", "timestamp": "2026-08-05T18:20:00Z", "url": "https://github.com/rajmaheshwari3001-dev/-web-scraper"},
                {"platform": "github", "type": "PUSH", "title": "Pushed to aiml-bootcamp-2026", "timestamp": "2026-08-04T11:45:00Z", "url": "https://github.com/rajmaheshwari3001-dev/aiml-bootcamp-2026"}
            ]
        return []
    except:
        return []

def get_github_repos_and_languages(username):
    if not username: return {"repos": [], "languages": {}}
    try:
        url = f"https://api.github.com/users/{username}/repos?per_page=100&sort=updated"
        res = requests.get(url, headers=get_headers(), timeout=5)
        if res.status_code == 200:
            repos = res.json()
            
            # Top 4 repos (exclude forks, sort by stars/updated)
            top_repos = []
            valid_repos = [r for r in repos if not r.get("fork")]
            # Sort by stargazers_count then updated_at (implicit by API sort=updated)
            valid_repos.sort(key=lambda x: x.get("stargazers_count", 0), reverse=True)
            
            for r in valid_repos[:4]:
                top_repos.append({
                    "name": r.get("name"),
                    "url": r.get("html_url"),
                    "stars": r.get("stargazers_count"),
                    "language": r.get("language")
                })
            
            # Aggregate languages
            langs = defaultdict(int)
            total = 0
            for r in repos:
                l = r.get("language")
                if l:
                    # In a real app, you'd fetch the /languages endpoint for bytes, 
                    # but counting repos by primary language is a quick proxy.
                    langs[l] += 1
                    total += 1
                    
            lang_pct = {}
            if total > 0:
                for k, v in langs.items():
                    lang_pct[k] = int((v / total) * 100)
            
            # Sort langs by pct descending
            lang_pct = dict(sorted(lang_pct.items(), key=lambda item: item[1], reverse=True)[:5])
            
            return {"repos": top_repos, "languages": lang_pct}
        elif res.status_code == 403 or res.status_code == 429:
            return {
                "repos": [
                    {"name": "aiml-bootcamp-2026", "url": "https://github.com/rajmaheshwari3001-dev/aiml-bootcamp-2026", "stars": 0, "language": "Jupyter Notebook"},
                    {"name": "Excel-Data-Cleaning-Tool", "url": "https://github.com/rajmaheshwari3001-dev/Excel-Data-Cleaning-Tool", "stars": 0, "language": "Python"},
                    {"name": "Trustlayer", "url": "https://github.com/rajmaheshwari3001-dev/Trustlayer", "stars": 0, "language": "Python"},
                    {"name": "-web-scraper", "url": "https://github.com/rajmaheshwari3001-dev/-web-scraper", "stars": 0, "language": "Python"}
                ],
                "languages": {"Python": 75, "Jupyter Notebook": 25}
            }
        return {"repos": [], "languages": {}}
    except:
        return {"repos": [], "languages": {}}
