import re
import os

pages_active = {
    'index.html': 'Home',
    'about.html': 'About Us',
    'courses.html': 'Courses',
    'courses-details.html': 'Courses',
    'courses-details2.html': 'Courses',
    'colleges.html': 'Colleges',
    'universities.html': 'Universities',
    'youtube.html': 'Videos',
    'blog.html': 'Blog',
    'blog-details.html': 'Blog',
    'contact.html': 'Contact'
}

all_html_files = [f for f in os.listdir('.') if f.endswith('.html')]

def build_nav_menu(active_name):
    items = [
        ('/', 'Home'),
        ('/about', 'About Us'),
        ('/courses', 'Courses'),
        ('/colleges', 'Colleges'),
        ('/universities', 'Universities'),
        ('/youtube', '<i class="fa fa-youtube-play text-danger" style="margin-right:4px;"></i>Videos'),
        ('/blog', 'Blog'),
        ('/contact', 'Contact')
    ]
    html = '<nav class="rs-menu">\n                                    <ul class="nav-menu">\n'
    for url, label in items:
        clean_lbl = 'Videos' if 'Videos' in label else label
        is_act = (clean_lbl == active_name)
        act_class = ' class="current-menu-item"' if is_act else ''
        html += f'                                        <li{act_class}><a href="{url}">{label}</a></li>\n'
    html += '                                    </ul>\n                                </nav>'
    return html

clean_canvas_menu = '''<ul class="sidebarnav_menu list-unstyled main-menu">
            <li><a href="/">Home</a></li>
            <li><a href="/about">About Us</a></li>
            <li><a href="/courses">Courses</a></li>
            <li><a href="/colleges">Colleges</a></li>
            <li><a href="/universities">Universities</a></li>
            <li><a href="/youtube"><i class="fa fa-youtube-play text-danger" style="margin-right:4px;"></i>Videos</a></li>
            <li><a href="/blog">Blog</a></li>
            <li><a href="/contact">Contact</a></li>
        </ul>'''

for fname in all_html_files:
    with open(fname, 'r', encoding='utf-8') as f:
        content = f.read()

    active_name = pages_active.get(fname, '')

    # 1. Clean desktop <nav class="rs-menu">...</nav>
    # Notice: there can be arbitrary junk inside rs-menu due to previous replace
    new_desktop_nav = build_nav_menu(active_name)
    content = re.sub(r'<nav class="rs-menu">[\s\S]*?<\/nav>', new_desktop_nav, content)

    # 2. Clean mobile <ul class="sidebarnav_menu...</ul>
    content = re.sub(r'<ul class="sidebarnav_menu[\s\S]*?<\/ul>\s*(?=<div class="canvas-contact">)', clean_canvas_menu + '\n        ', content)

    # 3. Clean legacy .html in hrefs
    content = re.sub(r'href="index\.html"', 'href="/"', content)
    content = re.sub(r'href="about\.html"', 'href="/about"', content)
    content = re.sub(r'href="courses\.html"', 'href="/courses"', content)
    content = re.sub(r'href="colleges\.html"', 'href="/colleges"', content)
    content = re.sub(r'href="universities\.html"', 'href="/universities"', content)
    content = re.sub(r'href="youtube\.html"', 'href="/youtube"', content)
    content = re.sub(r'href="blog\.html"', 'href="/blog"', content)
    content = re.sub(r'href="contact\.html"', 'href="/contact"', content)
    content = re.sub(r'href="edit\.html"', 'href="/edit"', content)

    with open(fname, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"Cleaned navigation in {fname}")

print("Navigation cleaning finished for all HTML files.")
