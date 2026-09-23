const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'blog-details.html');
let html = fs.readFileSync(filePath, 'utf8');

// Replace the truncated section with the full, proper structure
const target = `                        <div class="blog-share" style="margin-top:30px;padding:15px;background:#f5f5f5;border-radius:5px;">
                            <span style="font-weight:bold;margin-right:15px;">Share This:</span>
        </div>
    </div>`;

const replacement = `                        <div class="blog-share" style="margin-top:30px;padding:15px;background:#f5f5f5;border-radius:5px;">
                            <span style="font-weight:bold;margin-right:15px;">Share This:</span>
                            <a href="https://www.facebook.com/educationistguruEg/" target="_blank" style="margin-right:10px;"><i class="fa fa-facebook"></i></a>
                            <a href="https://www.instagram.com/educationistguru/" target="_blank" style="margin-right:10px;"><i class="fa fa-instagram"></i></a>
                            <a href="https://www.youtube.com/@Educationistguru" target="_blank"><i class="fa fa-youtube-play"></i></a>
                        </div>
                    </div>
                </div>
                <div class="col-lg-4 col-md-12">
                    <div class="sidebar-area">
                        <!-- Direct Admission Helpline & Lead Card (Matches admission-open.com standard) -->
                        <div class="sidebar-inquiry-card">
                            <span class="inquiry-badge"><i class="fa fa-bolt"></i> Free Admission Guidance</span>
                            <h3>Direct University Counseling</h3>
                            <p>Speak to authorized education counselors for Subharti University &amp; 80+ partner universities across India.</p>
                            <form onsubmit="event.preventDefault(); alert('Thank you! An authorized counselor will contact you shortly on your provided phone number.'); this.reset();">
                                <input type="text" class="form-control" placeholder="Student Full Name *" required>
                                <input type="tel" class="form-control" placeholder="10-Digit Mobile Number *" required pattern="[0-9]{10}">
                                <input type="email" class="form-control" placeholder="Email Address (Optional)">
                                <select class="form-control" style="margin-bottom:14px;">
                                    <option value="Subharti University MBA">Subharti University - MBA</option>
                                    <option value="Executive MBA">Executive Management Degree</option>
                                    <option value="B.Tech Engineering">B.Tech / Technical Programs</option>
                                    <option value="UG / PG Degrees">General UG / PG Admissions</option>
                                </select>
                                <button type="submit" class="btn-submit-inquiry"><i class="fa fa-paper-plane"></i> Get Free Counseling Call</button>
                            </form>
                            <div class="counselor-helpline">
                                <div class="helpline-item">
                                    <span><i class="fa fa-phone text-danger" style="margin-right:6px;"></i> Official Helpline:</span>
                                    <a href="tel:8750477000">8750477000</a>
                                </div>
                                <div class="helpline-item">
                                    <span><i class="fa fa-whatsapp text-success" style="margin-right:6px;"></i> WhatsApp Support:</span>
                                    <a href="https://wa.me/918750477000?text=Hello%20Educationist%20Guru%2C%20I%20want%20Subharti%20University%20Admission%20Details" target="_blank" style="color:#25d366;">Chat on WhatsApp</a>
                                </div>
                            </div>
                        </div>

                        <div class="search-widget mb-50"><h3 class="sidebar-title">Search</h3><form><input type="text" placeholder="Search..." class="form-control"><button type="submit" class="search-btn"><i class="fa fa-search"></i></button></form></div>
                        <div class="categories-widget mb-50"><h3 class="sidebar-title">Categories</h3><ul><li><a href="courses.html">Engineering &amp; Technology</a></li><li><a href="courses.html">Commerce &amp; Management</a></li><li><a href="courses.html">Law</a></li><li><a href="courses.html">Paramedical Sciences</a></li><li><a href="courses.html">Yoga &amp; Wellness</a></li><li><a href="courses.html">Fashion &amp; Animation</a></li></ul></div>
                        <div class="recent-post-widget mb-50"><h3 class="sidebar-title">Recent Posts</h3><div class="recent-posts-list"></div></div>
                    </div>
                </div>
            </div>
        </div>
    </div>`;

html = html.replace(/\r\n/g, '\n');
const normalizedTarget = target.replace(/\r\n/g, '\n');

if (html.includes(normalizedTarget)) {
    html = html.replace(normalizedTarget, replacement);
    fs.writeFileSync(filePath, html, 'utf8');
    console.log('✅ blog-details.html repaired and enhanced with sidebar-inquiry-card!');
} else {
    console.warn('⚠️ Target string not found');
}
