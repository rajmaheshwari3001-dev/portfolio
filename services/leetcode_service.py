import requests
import time
import logging

log = logging.getLogger(__name__)

def get_leetcode_profile(username):
    if not username:
        return None
        
    query = """
    query getUserProfile($username: String!) {
        matchedUser(username: $username) {
            profile {
                ranking
                realName
            }
            submitStats {
                acSubmissionNum { difficulty count }
                totalSubmissionNum { difficulty count }
            }
            languageProblemCount {
                languageName
                problemsSolved
            }
            tagProblemCounts {
                advanced { tagName tagSlug problemsSolved }
                intermediate { tagName tagSlug problemsSolved }
            }
        }
        userContestRanking(username: $username) {
            rating globalRanking
        }
        recentAcSubmissionList(username: $username, limit: 5) {
            title
            timestamp
        }
    }
    """
    
    variables = {"username": username}
    
    try:
        response = requests.post(
            "https://leetcode.com/graphql",
            json={"query": query, "variables": variables},
            headers={"Content-Type": "application/json", "Referer": "https://leetcode.com"},
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json().get("data", {})
            user_data = data.get("matchedUser")
            
            if not user_data:
                return {"status": "unavailable", "message": "User not found or private"}
                
            stats = user_data.get("submitStats", {}).get("acSubmissionNum", [])
            total_subs = user_data.get("submitStats", {}).get("totalSubmissionNum", [])
            contest = data.get("userContestRanking") or {}
            profile = user_data.get("profile", {})
            
            formatted_stats = {
                "All": 0, "Easy": 0, "Medium": 0, "Hard": 0
            }
            for item in stats:
                difficulty = item.get("difficulty")
                if difficulty in formatted_stats:
                    formatted_stats[difficulty] = item.get("count", 0)
            
            # Total submissions for acceptance rate
            total_submitted = 0
            total_accepted = formatted_stats["All"]
            for item in total_subs:
                if item.get("difficulty") == "All":
                    total_submitted = item.get("count", 0)
            
            acceptance_rate = round((total_accepted / total_submitted * 100), 1) if total_submitted > 0 else 0
            
            # Languages
            languages = []
            lang_data = user_data.get("languageProblemCount", [])
            for lang in sorted(lang_data, key=lambda x: x.get("problemsSolved", 0), reverse=True)[:5]:
                languages.append({
                    "name": lang.get("languageName"),
                    "solved": lang.get("problemsSolved")
                })
            
            # Skills/Tags
            skills = []
            for level in ["advanced", "intermediate"]:
                tags = user_data.get("tagProblemCounts", {}).get(level, [])
                for tag in tags[:4]:
                    skills.append({
                        "name": tag.get("tagName"),
                        "count": tag.get("problemsSolved"),
                        "level": level
                    })
            
            # Recent submissions
            recent = []
            for sub in (data.get("recentAcSubmissionList") or []):
                recent.append({
                    "title": sub.get("title"),
                    "timestamp": sub.get("timestamp")
                })
            
            # LeetCode does not expose a public submission calendar through
            # GraphQL. Returning random noise here would render as real
            # activity, so the frontend gets an honest "unavailable" signal.
            calendar = []
                    
            return {
                "status": "connected",
                "stats": formatted_stats,
                "ranking": profile.get("ranking", "N/A"),
                "contest_ranking": contest.get("globalRanking", "N/A"),
                "contest_rating": round(contest.get("rating", 0)) if contest.get("rating") else "N/A",
                "acceptance_rate": acceptance_rate,
                "total_submissions": total_submitted,
                "languages": languages,
                "skills": skills,
                "recent": recent,
                "calendar": calendar,
                "calendar_available": False,
                "url": f"https://leetcode.com/u/{username}/",
                "last_updated": time.time()
            }
            
        log.warning("LeetCode profile fetch returned HTTP %s", response.status_code)
        return {"status": "unavailable", "reason": "upstream_http_error"}
    except Exception:
        # The real detail belongs in the server log, never on the wire.
        log.exception("LeetCode profile fetch failed")
        return {"status": "unavailable", "reason": "upstream_unreachable"}

