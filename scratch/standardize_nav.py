import re
import os

pages = {
    'index.html': 'Home',
    'about.html': 'About Us',
    'courses.html': 'Courses',
    'colleges.html': 'Colleges',
    'universities.html': 'Universities',
    'youtube.html': 'Videos',
    'blog.html': 'Blog',
    'contact.html': 'Contact'
}

nav_items = [
    ('/', 'Home', ''),
    ('/about', 'About Us', ''),
    ('/courses', 'Courses', ''),
    ('/colleges', 'Colleges', ''),
    ('/universities', 'Universities', ''),
    ('/youtube', '<i class="fa fa-youtube-play text-danger" style="margin-right:4px;"></i>Videos', ''),
    ('/blog', 'Blog', ''),
    ('/contact', 'Contact', '')
]

def generate_nav(active_label):
    html = '<ul class="nav-menu">\n'
    for link, label, _ in nav_items:
        clean_label = 'Videos' if 'Videos' in label else label
        is_active = (clean_label == active_label)
        cls = ' class="current-menu-item"' if is_active else ''
        html += f'                                        <li{cls}><a href="{link}">{label}</a></li>\n'
    html += '                                    </ul>'
    return html

def update_file(filename, active_label):
    if not os.path.exists(filename):
        print(f"File not found: {filename}")
        return
    with open(filename, 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Replace nav-menu
    new_nav = generate_nav(active_label)
    # Match <ul class="nav-menu">...</ul> across multiple lines
    content = re.sub(r'<ul class="nav-menu">.*?</ul>', new_nav, content, flags=re.DOTALL)

    # 2. Clean general links in footer and breadcrumbs
    content = re.sub(r'href="index\.html"', 'href="/"', content)
    content = re.sub(r'href="about\.html"', 'href="/about"', content)
    content = re.sub(r'href="courses\.html"', 'href="/courses"', content)
    content = re.sub(r'href="colleges\.html"', 'href="/colleges"', content)
    content = re.sub(r'href="universities\.html"', 'href="/universities"', content)
    content = re.sub(r'href="youtube\.html"', 'href="/youtube"', content)
    content = re.sub(r'href="blog\.html"', 'href="/blog"', content)
    content = re.sub(r'href="contact\.html"', 'href="/contact"', content)
    content = re.sub(r'href="edit\.html"', 'href="/edit"', content)

    with open(filename, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"Updated navigation in {filename}")

for fname, label in pages.items():
    update_file(fname, label)

print("Navigation standardization complete.")
