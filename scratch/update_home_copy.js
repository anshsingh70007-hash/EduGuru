const fs = require('fs');

let html = fs.readFileSync('index.html', 'utf8');

// Card 1
html = html.replace(
    'Trending Programs</h4>\r\n                            <p>Guiding students to make informed education decisions with expert counseling and support.</p>',
    'Trending Programs</h4>\r\n                            <p>Industry-aligned degrees &amp; executive diplomas selected for modern career growth.</p>'
);
html = html.replace(
    'Trending Programs</h4>\n                            <p>Guiding students to make informed education decisions with expert counseling and support.</p>',
    'Trending Programs</h4>\n                            <p>Industry-aligned degrees &amp; executive diplomas selected for modern career growth.</p>'
);

// Card 2
html = html.replace('fa-book', 'fa-university');
html = html.replace('Books &amp; Library', 'Top Universities');
html = html.replace(
    'Top Universities</h4>\r\n                            <p>Guiding students to make informed education decisions with expert counseling and support.</p>',
    'Top Universities</h4>\r\n                            <p>Verified admissions support across top UGC-DEB and NAAC accredited institutions.</p>'
);
html = html.replace(
    'Top Universities</h4>\n                            <p>Guiding students to make informed education decisions with expert counseling and support.</p>',
    'Top Universities</h4>\n                            <p>Verified admissions support across top UGC-DEB and NAAC accredited institutions.</p>'
);

// Card 3
html = html.replace('fa-user rs-animation-scale-up', 'fa-user-circle-o rs-animation-scale-up');
html = html.replace('Certified Teachers', '1-on-1 Mentorship');
html = html.replace(
    '1-on-1 Mentorship</h4>\r\n                            <p>Guiding students to make informed education decisions with expert counseling and support.</p>',
    '1-on-1 Mentorship</h4>\r\n                            <p>Unbiased guidance from experienced mentors to map your ideal academic trajectory.</p>'
);
html = html.replace(
    '1-on-1 Mentorship</h4>\n                            <p>Guiding students to make informed education decisions with expert counseling and support.</p>',
    '1-on-1 Mentorship</h4>\n                            <p>Unbiased guidance from experienced mentors to map your ideal academic trajectory.</p>'
);

// Card 4
html = html.replace('Certification</h4>', 'Valid Degrees</h4>');
html = html.replace(
    'Valid Degrees</h4>\r\n                            <p>Guiding students to make informed education decisions with expert counseling and support.</p>',
    'Valid Degrees</h4>\r\n                            <p>Recognized academic credentials meeting all government and corporate employment norms.</p>'
);
html = html.replace(
    'Valid Degrees</h4>\n                            <p>Guiding students to make informed education decisions with expert counseling and support.</p>',
    'Valid Degrees</h4>\n                            <p>Recognized academic credentials meeting all government and corporate employment norms.</p>'
);

// Counter generic text fix:
// Problem 31: Generic placeholder text "A wonderful serenity has taken possession..." in counter section
html = html.replace(
    'A wonderful serenity has taken possession of my entire soul, like these sweet mornings of spring which I enjoy with my whole heart like mine.',
    'Guiding thousands of aspirants every academic season toward accredited universities and career-defining programs.'
);

fs.writeFileSync('index.html', html, 'utf8');
console.log('Homepage copy updated successfully!');
