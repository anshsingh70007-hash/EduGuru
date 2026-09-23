import urllib.request

crm_paths = [
    ('/CRM', 'CRM Login | EducationistGuru'),
    ('/CRM/', 'CRM Login | EducationistGuru'),
    ('/crm', 'CRM Login | EducationistGuru'),
    ('/crm/', 'CRM Login | EducationistGuru'),
    ('/CRM/index', 'CRM Login | EducationistGuru'),
    ('/CRM/index.html', 'CRM Login | EducationistGuru'),
    ('/CRM/dashboard', 'Dashboard | EducationistGuru CRM'),
    ('/CRM/dashboard.html', 'Dashboard | EducationistGuru CRM'),
    ('/crm/dashboard', 'Dashboard | EducationistGuru CRM'),
    ('/crm/dashboard.html', 'Dashboard | EducationistGuru CRM'),
    ('/CRM/leads', 'Leads | EducationistGuru CRM'),
    ('/CRM/leads.html', 'Leads | EducationistGuru CRM'),
    ('/CRM/fees', 'Fee Management | EducationistGuru CRM'),
    ('/CRM/fees.html', 'Fee Management | EducationistGuru CRM'),
    ('/CRM/settings', 'Settings | EducationistGuru CRM'),
    ('/CRM/settings.html', 'Settings | EducationistGuru CRM'),
    ('/CRM/users', 'Users & Roles | EducationistGuru CRM'),
    ('/CRM/users.html', 'Users & Roles | EducationistGuru CRM'),
    ('/CRM/applications', 'Applications | EducationistGuru CRM'),
    ('/CRM/enrollments', 'Enrollments | EducationistGuru CRM'),
    ('/CRM/inquiries', 'Inquiries | EducationistGuru CRM'),
    ('/CRM/subscribers', 'Subscribers | EducationistGuru CRM'),
]

for p, expected_title in crm_paths:
    url = f'http://localhost:3000{p}'
    req = urllib.request.urlopen(url)
    assert req.status == 200, f'Route {p} failed: status {req.status}'
    body = req.read().decode('utf-8')
    assert expected_title in body, f'Route {p} did not return expected title "{expected_title}"!'
    print(f'PASS [200]: {p:22} -> Correctly served "{expected_title}"')

# Test Static Assets
css_req = urllib.request.urlopen('http://localhost:3000/CRM/css/admin.css')
assert css_req.status == 200
assert 'text/css' in css_req.headers.get('Content-Type', '')
print('PASS [200]: /CRM/css/admin.css served as text/css')

js_req = urllib.request.urlopen('http://localhost:3000/CRM/js/data.js')
assert js_req.status == 200
assert 'application/javascript' in js_req.headers.get('Content-Type', '')
print('PASS [200]: /CRM/js/data.js served as application/javascript')

print('\n>>> ALL 24 CRM ROUTING & ASSET CHECKS PASSED FLAWLESSLY! <<<')
