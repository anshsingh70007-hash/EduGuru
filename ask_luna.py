import json
import requests
import sys

# Load config from Experiential-CLI
config_path = '../Experiential-CLI/Experiential-CLI/config.json'
with open(config_path, 'r', encoding='utf-8') as f:
    config = json.load(f)

api_key = config['api_key']
base_url = config['base_url']
model = "gpt-5.6-luna"

# Read summary of what was built
with open('app/index.html', 'r', encoding='utf-8') as f:
    index_html = f.read()

with open('app/js/courses-data.js', 'r', encoding='utf-8') as f:
    courses_js = f.read()

with open('app/css/app.css', 'r', encoding='utf-8') as f:
    app_css = f.read()

prompt = f"""
You are the Senior Principal EdTech Architect and Lead Designer reviewing a junior engineer's work.
The client is "EducationistGuru" (educationistguru.com), a university admissions and course-selling consultancy founded in July 2023 by CEO Jatinder Kaur.
They deal with accredited higher education programs (Online, Regular, Distance).

The user's requirements:
1. Build a high-converting, mobile-first education app to sell courses, inspired by PhysicsWallah (PW).
2. Curate and arrange the Top 50 courses from the official AIU Fee Structure 2025.
3. Explicitly define inside each course what is available (e.g. "B.Tech in what?" -> B.Tech in AI & Data Science, CSE, Cyber Security, Robotics, ME, Civil, etc.), duration, eligibility, fees, semester-wise curriculum, and available specializations.
4. Stunning opening splash animation with the official EducationistGuru logo.
5. Official leadership showcase of Founder & CEO Jatinder Kaur with photo, bio, quote.
6. Skip Mega and Events pages as instructed. Do NOT add CRM or edit pages in the student-facing app.
7. Seamless lead capture connecting to /api/crm/lead.

Here is an excerpt of our top courses data:
```javascript
{courses_js[:3000]}
... (50 courses total)
```

Here is the HTML app shell and design:
```html
{index_html[:2500]}
...
```

Here is the CSS design system excerpt:
```css
{app_css[:2500]}
...
```

As my Senior:
1. Provide your rigorous architectural and UX review.
2. Give your critique: What are the strongest points? Where can we improve conversion, clarity, micro-interactions, or student trust?
3. Provide 2-3 specific, high-impact refinements or additions that we can implement right now in the app to make it even more polished and bulletproof.
"""

print(f"Connecting to Experiential API Gateway with model: {model}...")
response = requests.post(
    f"{base_url}/chat/completions",
    headers={
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    },
    json={
        "model": model,
        "messages": [
            {"role": "system", "content": "You are a Senior Principal Software Architect and EdTech UX Director. You provide direct, incisive, practical, constructive, and highly technical critiques to pair-programmers."},
            {"role": "user", "content": prompt}
        ],
        "temperature": 0.3,
        "max_tokens": 2000
    },
    timeout=60
)

if response.status_code == 200:
    data = response.json()
    critique = data['choices'][0]['message']['content']
    print("\n========== SENIOR REVIEW FROM GPT 5.6 LUNA ==========\n")
    with open("luna_critique.md", "w", encoding="utf-8") as out_f:
        out_f.write(critique)
    print("SUCCESS: Critique successfully saved to luna_critique.md!")
else:
    print(f"Error {response.status_code}: {response.text}")
    sys.exit(1)

