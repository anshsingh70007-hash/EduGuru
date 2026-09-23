import glob, os

crm_htmls = glob.glob('CRM/*.html')
for ch in crm_htmls:
    with open(ch, 'r', encoding='utf-8', errors='ignore') as f:
        content = f.read()

    orig = content
    if '<base href="/CRM/">' not in content:
        content = content.replace('<head>', '<head>\n    <base href="/CRM/">')

    if content != orig:
        with open(ch, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f'Added <base href="/CRM/"> to {ch}')
    else:
        print(f'Already has base href: {ch}')
