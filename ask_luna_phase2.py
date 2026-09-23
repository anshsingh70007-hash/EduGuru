import json
import requests
import sys

config_path = '../Experiential-CLI/Experiential-CLI/config.json'
with open(config_path, 'r', encoding='utf-8') as f:
    config = json.load(f)

api_key = config['api_key']
base_url = config['base_url']
model = "gpt-5.6-luna"

prompt = """
You are my Senior Principal EdTech Architect and Mobile UX Director.
The client just tested the EducationistGuru APK on their real Android mobile phone and provided crucial feedback via voice note and screenshot:

1. ISSUE 1: Header / Top Bar truncation on real mobile screens
   - In their screenshot, the header right button is clipped: "📞 Couns..." because of fixed padding and lack of auto-adjustment for varying mobile screen widths (360px - 412px).
   - The user requested: "Kahin bhi app agar download hoti hai, to wo apne aap ko auto adjust kar le us app ke ratio ke hisaab se, auto adjust puri screen ho jaye taki sara element wagera dhang se dikhe."

2. ISSUE 2: Courses Tab appears completely blank
   - In the bottom navigation, when they tap "Courses", the catalog section shows the header, but the course cards are blank!
   - Root cause identified: The course cards grid was only placed in the Home view DOM container (#coursesGrid). When switching views, the catalog section had no grid element.

3. ISSUE 3: Redundancy between Home Tab and Courses Tab
   - User observation: "Home page pe bhi same stream ka option laga hua hai, matlab ki jo home page hai wahan pe bhi course dikh rahe hain, courses pe bhi click karenge to wahan pe bhi course hi dikhenge. So ye dono cheezein same ho jayengi."
   - What is the ideal EdTech Information Architecture (like PhysicsWallah / Unacademy) to differentiate Home vs Courses?
     - Should Home be the Admissions & Discovery Hub (Hero, Stats, Trust Strip, Eligibility Matcher, Stream Category Pills, Top 6 Featured/Trending Programs with a "View All 50 Courses" CTA, CEO Jatinder Kaur Spotlight, University Partners)?
     - Should Courses Tab be the dedicated Search & Catalog Powerhouse (Search, Faceted Filters, Stream Pills, All 50 Courses with full sorting and pagination/infinite scroll)?

4. ISSUE 4: Videos Tab Integration with official YouTube Channel
   - Client provided official YouTube channel: https://www.youtube.com/@Educationistguru (Channel ID: UCwhcl8yThBOnfZjrEwkkqIA).
   - Requirement: "Videos wala section hai, yahan pe jitni bhi is channel pe videos upload hui hain wo yahan list ho jaye, aur in future koi bhi cheez upload hoti hai, video upload hoti hai, so yahan wo dikh jaye."
   - How should we architect this video feed in the mobile app & APK, supporting both live dynamic fetching and seamless offline fallback, with playable modals and YouTube links?

5. ISSUE 5: Final Production APK Delivery
   - Client wants the refined, bug-free standalone Android APK.

As my Senior:
1. Give your structural architecture guidance on resolving each of these 4 issues.
2. Provide concrete CSS and JavaScript recommendations for the fluid header and the Home vs Courses tab separation.
3. Advise on the best practice for integrating the YouTube feed cleanly and reliably.
"""

print(f"Connecting to Senior GPT 5.6 Luna with model: {model}...")
response = requests.post(
    f"{base_url}/chat/completions",
    headers={
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    },
    json={
        "model": model,
        "messages": [
            {"role": "system", "content": "You are a Senior Principal Software Architect and Mobile EdTech Product Director. You provide direct, expert, actionable technical solutions to your team."},
            {"role": "user", "content": prompt}
        ],
        "temperature": 0.3,
        "max_tokens": 2500
    },
    timeout=60
)

if response.status_code == 200:
    data = response.json()
    critique = data['choices'][0]['message']['content']
    print("\n========== SENIOR GPT 5.6 LUNA GUIDANCE ==========\n")
    print(critique[:1000] + "\n...")
    with open("luna_phase2_critique.md", "w", encoding="utf-8") as out_f:
        out_f.write(critique)
    print("\nSUCCESS: Senior Luna guidance saved to luna_phase2_critique.md!")
else:
    print(f"Error {response.status_code}: {response.text}")
    sys.exit(1)
