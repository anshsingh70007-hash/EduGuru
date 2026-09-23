import urllib.request
import urllib.parse
import json
import sys

BASE_URL = 'http://localhost:3000'

class NoRedirectHandler(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        return None

opener = urllib.request.build_opener(NoRedirectHandler)

def test_url(url_path, expected_status=200, check_redirect_location=None):
    full_url = BASE_URL + url_path
    req = urllib.request.Request(full_url, headers={'User-Agent': 'Mozilla/5.0'})
    try:
        resp = opener.open(req)
        status = resp.getcode()
        body = resp.read().decode('utf-8', errors='ignore')
        location = resp.headers.get('Location')
    except urllib.error.HTTPError as e:
        status = e.code
        body = e.read().decode('utf-8', errors='ignore')
        location = e.headers.get('Location')
    except Exception as ex:
        print(f"FAILED {url_path}: {ex}")
        return False

    success = (status == expected_status)
    if check_redirect_location:
        if location != check_redirect_location:
            success = False

    status_str = f"PASS [{status}]" if success else f"FAIL [{status} expected {expected_status}]"
    loc_str = f" -> Location: {location}" if location else ""
    print(f"{status_str} {url_path}{loc_str}")
    return success

print("Starting route verification...")
tests = [
    # Clean Root and Static pages
    ('/', 200, None),
    ('/about', 200, None),
    ('/courses', 200, None),
    ('/colleges', 200, None),
    ('/universities', 200, None),
    ('/blog', 200, None),
    ('/contact', 200, None),
    ('/edit', 200, None),

    # 301 Redirects for .html URLs
    ('/index.html', 301, '/'),
    ('/about.html', 301, '/about'),
    ('/courses.html', 301, '/courses'),
    ('/colleges.html', 301, '/colleges'),
    ('/universities.html', 301, '/universities'),
    ('/blog.html', 301, '/blog'),
    ('/contact.html', 301, '/contact'),

    # Dynamic Course Slug Resolution
    ('/courses/b-tech-in-artificial-intelligence-and-data-science', 200, None),
    ('/courses-details.html?id=106', 301, '/courses/b-tech-in-artificial-intelligence-and-data-science'),

    # APIs
    ('/api/content/courses', 200, None),
    ('/api/content/courses/b-tech-in-artificial-intelligence-and-data-science', 200, None),
    ('/api/content/colleges', 200, None),
    ('/api/content/universities', 200, None),
    ('/api/youtube/videos', 200, None),
]

all_passed = True
for path, exp_code, exp_loc in tests:
    if not test_url(path, exp_code, exp_loc):
        all_passed = False

if all_passed:
    print("\nALL 20 CRITICAL ROUTE & API TESTS PASSED PERFECTLY!")
else:
    print("\nSOME TESTS FAILED! Check outputs above.")
    sys.exit(1)
