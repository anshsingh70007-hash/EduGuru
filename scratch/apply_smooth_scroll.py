import glob, re, os

pages = [
    'index.html', 'courses.html', 'about.html', 'colleges.html', 'universities.html',
    'blog.html', 'contact.html', 'courses-details.html', 'blog-details.html',
    'youtube.html', 'gallery.html', 'events.html', 'error-404.html',
    'about2.html', 'about3.html', 'courses2.html', 'courses-details2.html',
    'events-details.html', 'gallery2.html', 'gallery3.html',
    'teachers.html', 'teachers-single.html', 'teachers-without-filter.html'
]

for p in pages:
    if not os.path.exists(p):
        continue
    with open(p, 'r', encoding='utf-8', errors='ignore') as f:
        html = f.read()

    orig_html = html

    # Clean colleges / universities from motion-welcome
    if p in ['colleges.html', 'universities.html']:
        html = html.replace('<link rel="stylesheet" href="css/motion-welcome.css">', '')
        html = html.replace('<script src="js/motion-welcome.js"></script>', '')
        html = html.replace('<script src="https://cdn.jsdelivr.net/npm/lenis@1.1.18/dist/lenis.min.js"></script>', '')

    # 1. Ensure smooth-ui.css is in <head>
    if 'smooth-ui.css' not in html:
        css_tag = '    <link rel="stylesheet" href="css/smooth-ui.css">\n</head>'
        html = html.replace('</head>', css_tag)

    # 2. Ensure smooth-scroll.js is before </body>
    if 'smooth-scroll.js' not in html:
        js_tag = '    <script src="js/smooth-scroll.js"></script>\n</body>'
        html = html.replace('</body>', js_tag)

    if html != orig_html:
        with open(p, 'w', encoding='utf-8') as f:
            f.write(html)
        print(f'Updated {p}')
    else:
        print(f'Unchanged {p}')
