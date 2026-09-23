import re
import urllib.request
import json

path = r'C:\Users\Harmeet Singh\.gemini\antigravity-ide\brain\84895c8e-1671-446a-8892-a698aa80aa0a\.system_generated\steps\442\content.md'
with open(path, encoding='utf-8') as f:
    text = f.read()

channel_ids = re.findall(r'channel/(UC[\w-]+)', text) + re.findall(r'"browseId":"(UC[\w-]+)"', text)
print("Channel IDs:", list(set(channel_ids)))

# Try to find videoRenderer or video IDs
videos = []
for m in re.finditer(r'"videoId":"([\w-]{11})"', text):
    vid = m.group(1)
    # look forward up to 500 chars for title
    sub = text[m.start():m.start()+600]
    title_match = re.search(r'"title":\{"runs":\[\{"text":"([^"]+)"\}', sub)
    if not title_match:
        title_match = re.search(r'"title":\{"simpleText":"([^"]+)"\}', sub)
    title = title_match.group(1) if title_match else "EducationistGuru Academic Video"
    if not any(v['id'] == vid for v in videos):
        videos.append({'id': vid, 'title': title})

print(f"Extracted {len(videos)} videos:")
for v in videos[:15]:
    print(v)
