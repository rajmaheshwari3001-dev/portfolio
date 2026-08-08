import os

PROFILE_CONFIG = {
    "name": "Raj Maheshwari",
    "github_username": "rajmaheshwari3001-dev",  # Updated with actual
    "leetcode_username": "9760497925",  # Actual LeetCode profile
    "linkedin_url": "https://www.linkedin.com/in/raj-maheshwari-6293683a4/",
    "email": "rajmaheshwari3001@gmail.com",
    "resume_url": "#resume"
}

# In production, these should come from os.environ.get()
GITHUB_TOKEN = os.environ.get("GITHUB_TOKEN", None)
