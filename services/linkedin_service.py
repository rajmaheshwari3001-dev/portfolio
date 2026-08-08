from config import PROFILE_CONFIG

# LinkedIn does not provide a public API for unauthorized scraping.
# We will return the configured URL and a static profile model to represent the integration.

def get_linkedin_profile():
    return {
        "status": "connected",
        "url": PROFILE_CONFIG.get("linkedin_url"),
        "name": PROFILE_CONFIG.get("name"),
        "headline": "AI/ML Student • Software Builder",
        "message": "View full professional background on LinkedIn."
    }
