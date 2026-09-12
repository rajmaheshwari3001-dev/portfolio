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
        # 403/429 = rate limited. Inventing a profile here would be shown to
        # visitors as live data, so the caller degrades to cache or an honest
        # error state instead.
        return None
    except Exception:
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
        # Rate limited or unreachable: no invented events. The UI shows an
        # honest state rather than a fabricated commit history.
        return []
    except Exception:
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
        # Rate limited: no invented repos or language shares.
        return {"repos": [], "languages": {}}
    except Exception:
        return {"repos": [], "languages": {}}
