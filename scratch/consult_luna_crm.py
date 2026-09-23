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
You are Senior Principal EdTech Architect and CRM Director GPT-5.6 Luna.
The client is "EducationistGuru" (educationistguru.com), a premier Indian higher-education admissions and university course consultancy founded in July 2023 by CEO Jatinder Kaur.
They deal with accredited higher education programs (Online, Regular, Distance) from partner universities and affiliated colleges.

The user explicitly requested:
1. "CRM mein section by section jao aur saare section ko audit karo..."
2. "Dashboard mein check karo saare UI/UX ekdum sahi hai, saare feature kaam kar rahe hain, koi useless/dead element na ho..."
3. "Leads wale section mein dekho ki Add Lead hai, Add Lead mein kya options add hone chahiye aur kya nahi... Indian admission consultancy best practices ke hisaab se."
4. "Saare sections side mein (Dashboard, Leads, Applications, Enrollments, Inquiries, Subscribers, Fee Management, Users, Settings) ko audit karo, one by one, and refine karo taaki future mein break na ho."
5. "Same with the Edit section (/edit Content Studio for Courses, Colleges, Universities, Blogs, Videos)."

As Senior Principal Architect Luna:
1. Provide a rigorous, module-by-module audit and improvement blueprint for the CRM.
2. In the "Leads Management" module:
   - What fields must exist in "Add/Edit Lead" for an Indian university admission consultancy? (e.g. City/State, Highest Qualification, Preferred Mode: Online/Distance/Regular, Priority: Hot/Warm/Cold, Follow-up Date, Assigned Counselor, Dynamic Course Selector from 106 courses instead of 9 hardcoded ones).
   - What fast-action tools should counselors have directly in the leads table? (WhatsApp 1-click chat with prefilled template, Click-to-call, 1-click status pill, Convert to Enrollment).
3. For the remaining CRM modules (Dashboard, Applications, Enrollments, Inquiries, Subscribers, Fees, Users, Settings), specify what features should be tightened, cleaned of dead code, and synchronized with server storage (leads.json, etc.).
4. For the Content Studio (/edit), ensure full CRUD integrity, local image uploads, and clean slug synchronization.

Provide structured, actionable, production-ready recommendations.
"""

print(f"Connecting to GPT-5.6 Luna Gateway...")
response = requests.post(
    f"{base_url}/chat/completions",
    headers={
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    },
    json={
        "model": model,
        "messages": [
            {"role": "system", "content": "You are a Senior Principal Software Architect and EdTech CRM Director. You provide direct, incisive, practical, constructive, and highly technical blueprints."},
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
    print("\n========== SENIOR REVIEW FROM GPT 5.6 LUNA ==========\n")
    print(critique[:1000] + "\n...")
    with open("crm_luna_blueprint.md", "w", encoding="utf-8") as out_f:
        out_f.write(critique)
    print("\nSUCCESS: Saved to crm_luna_blueprint.md!")
else:
    print(f"Error {response.status_code}: {response.text}")
    sys.exit(1)
