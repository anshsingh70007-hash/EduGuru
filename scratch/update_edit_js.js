const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'edit', 'js', 'edit.js');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Replace insertEditorTag and toggleEditorPreview
const oldTagEngineRegex = /\/\/ Heading Toolbar & Rich HTML Insertion \(H1-H6\)[\s\S]*?window\.toggleEditorPreview = function\(textareaId, previewId\) \{[\s\S]*?\};\s*\}\;/;

const newWysiwygEngine = `// ================= VISUAL WYSIWYG DOCUMENT ENGINE =================
    const savedSelections = {};

    function saveEditorSelection(editorId) {
        const sel = window.getSelection();
        if (sel && sel.rangeCount > 0) {
            const range = sel.getRangeAt(0);
            const editor = document.getElementById(editorId);
            if (editor && editor.contains(range.commonAncestorContainer)) {
                savedSelections[editorId] = range.cloneRange();
            }
        }
    }

    function restoreEditorSelection(editorId) {
        const editor = document.getElementById(editorId);
        if (!editor) return;
        editor.focus();
        const savedRange = savedSelections[editorId];
        if (savedRange) {
            const sel = window.getSelection();
            if (sel) {
                sel.removeAllRanges();
                sel.addRange(savedRange);
            }
        }
    }

    function initVisualEditorEvents(editorId) {
        const editor = document.getElementById(editorId);
        if (!editor || editor.dataset.initialized) return;
        editor.dataset.initialized = 'true';
        ['keyup', 'mouseup', 'touchend', 'input', 'focus'].forEach(evt => {
            editor.addEventListener(evt, () => saveEditorSelection(editorId));
        });
        editor.addEventListener('paste', (e) => {
            e.preventDefault();
            const text = (e.clipboardData || window.clipboardData).getData('text/plain');
            document.execCommand('insertText', false, text);
            saveEditorSelection(editorId);
        });
    }

    window.applyHeadingStyle = function(editorId, tag) {
        const editor = document.getElementById(editorId);
        if (!editor) return;
        initVisualEditorEvents(editorId);
        restoreEditorSelection(editorId);

        const sel = window.getSelection();
        const isCollapsed = !sel || sel.isCollapsed || sel.rangeCount === 0;

        // If editor is completely empty
        if (isCollapsed && (!editor.innerText.trim() || !editor.childNodes.length)) {
            const blockTag = tag.toLowerCase();
            const placeholder = blockTag === 'p' ? 'Start typing paragraph here...' : \`Heading \${blockTag.replace('h', '')} Title\`;
            editor.innerHTML = \`<\${blockTag}>\${placeholder}</\${blockTag}>\`;
            const range = document.createRange();
            range.selectNodeContents(editor.firstChild);
            sel.removeAllRanges();
            sel.addRange(range);
            saveEditorSelection(editorId);
            return;
        }

        try {
            const formatted = document.execCommand('formatBlock', false, \`<\${tag}>\`);
            if (!formatted) {
                document.execCommand('formatBlock', false, tag);
            }
        } catch (err) {
            console.warn('formatBlock error:', err);
        }
        saveEditorSelection(editorId);
    };

    window.execEditorCmd = function(editorId, cmd, val = null) {
        const editor = document.getElementById(editorId);
        if (!editor) return;
        initVisualEditorEvents(editorId);
        restoreEditorSelection(editorId);
        document.execCommand(cmd, false, val);
        saveEditorSelection(editorId);
    };

    window.insertVisualInquiryBox = function(editorId) {
        const editor = document.getElementById(editorId);
        if (!editor) return;
        initVisualEditorEvents(editorId);
        restoreEditorSelection(editorId);

        const boxHtml = \`
            <div class="lead-inquiry-box" contenteditable="false" style="margin: 22px 0; padding: 18px 22px; background: #fff7ed; border: 1.5px solid #fed7aa; border-left: 5px solid #ff6b00; border-radius: 12px; box-shadow: 0 4px 15px rgba(255, 107, 0, 0.08);">
                <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                    <div>
                        <h4 style="margin: 0 0 6px; font-size: 17px; font-weight: 800; color: #9a3412;"><i class="fa fa-graduation-cap" style="margin-right:6px; color:#ea580c;"></i> Direct Admission Guidance &amp; Counseling</h4>
                        <p style="margin: 0 0 12px; font-size: 14px; color: #7c2d12; line-height: 1.5;">Connect directly with authorized counselors for Subharti University &amp; partner university admissions, eligibility verification, and fee structure guidance.</p>
                    </div>
                    <button type="button" onclick="this.closest('.lead-inquiry-box').remove()" style="background:none; border:none; color:#ea580c; font-size:20px; line-height:1; cursor:pointer; padding:0 4px;" title="Delete box">&times;</button>
                </div>
                <div style="display:flex; gap:10px; flex-wrap:wrap; align-items:center;">
                    <a href="contact.html" style="background:#ea580c; color:#ffffff !important; padding:8px 18px; border-radius:6px; font-weight:700; font-size:13px; text-decoration:none; display:inline-flex; align-items:center; gap:6px;"><i class="fa fa-phone"></i> Inquire Direct Admission</a>
                    <a href="https://wa.me/918750477000?text=Hello%20Educationist%20Guru%2C%20I%20want%20Subharti%20University%20Admission%20Details" target="_blank" style="background:#25d366; color:#ffffff !important; padding:8px 18px; border-radius:6px; font-weight:700; font-size:13px; text-decoration:none; display:inline-flex; align-items:center; gap:6px;"><i class="fa fa-whatsapp"></i> WhatsApp Advisor</a>
                </div>
            </div>
            <p><br></p>
        \`;
        document.execCommand('insertHTML', false, boxHtml);
        saveEditorSelection(editorId);
    };

    window.clearEditorFormatting = function(editorId) {
        const editor = document.getElementById(editorId);
        if (!editor) return;
        initVisualEditorEvents(editorId);
        restoreEditorSelection(editorId);
        document.execCommand('removeFormat', false, null);
        document.execCommand('formatBlock', false, '<p>');
        saveEditorSelection(editorId);
    };

    // Backward compatibility shim
    window.insertEditorTag = function(targetId, tag) {
        const visualTarget = targetId === 'courseDescriptionInput' ? 'courseVisualEditor' : (targetId === 'blogContentInput' ? 'blogVisualEditor' : null);
        if (visualTarget && document.getElementById(visualTarget)) {
            if (['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p'].includes(tag)) {
                window.applyHeadingStyle(visualTarget, tag);
            } else if (['b', 'i', 'u'].includes(tag)) {
                const cmd = tag === 'b' ? 'bold' : (tag === 'i' ? 'italic' : 'underline');
                window.execEditorCmd(visualTarget, cmd);
            } else if (tag === 'ul') {
                window.execEditorCmd(visualTarget, 'insertUnorderedList');
            } else if (tag === 'lead-form') {
                window.insertVisualInquiryBox(visualTarget);
            }
        }
    };
    window.toggleEditorPreview = function() {};`;

if (oldTagEngineRegex.test(content)) {
    content = content.replace(oldTagEngineRegex, newWysiwygEngine);
    console.log('✅ Replaced old insertEditorTag with Visual WYSIWYG Engine in edit/js/edit.js');
} else {
    console.warn('⚠️ Could not match oldTagEngineRegex');
}

// 2. Update openCourseModal population
const oldCoursePopulateRegex = /\/\/ 7\. Overview Content with Headings[\s\S]*?const previewBox = document\.getElementById\('courseOverviewPreview'\);[\s\S]*?previewBox\.innerHTML = '';\s*\}/;

const newCoursePopulate = `// 7. Visual WYSIWYG Overview Editor
        const courseVisual = document.getElementById('courseVisualEditor');
        const courseContent = course ? (course.overviewContent || course.description || '') : '';
        if (courseVisual) {
            courseVisual.innerHTML = courseContent;
            initVisualEditorEvents('courseVisualEditor');
        }
        const descInp = document.getElementById('courseDescriptionInput');
        if (descInp) descInp.value = courseContent;`;

if (oldCoursePopulateRegex.test(content)) {
    content = content.replace(oldCoursePopulateRegex, newCoursePopulate);
    console.log('✅ Updated openCourseModal to populate #courseVisualEditor');
} else {
    console.warn('⚠️ Could not match oldCoursePopulateRegex');
}

// 3. Update handleCourseSubmit reading
const oldCourseSubmitRead = `const overviewContent = document.getElementById('courseDescriptionInput').value.trim();`;
const newCourseSubmitRead = `const courseVisual = document.getElementById('courseVisualEditor');
        const overviewContent = courseVisual ? courseVisual.innerHTML.trim() : (document.getElementById('courseDescriptionInput') ? document.getElementById('courseDescriptionInput').value.trim() : '');
        if (document.getElementById('courseDescriptionInput')) {
            document.getElementById('courseDescriptionInput').value = overviewContent;
        }`;

if (content.includes(oldCourseSubmitRead)) {
    content = content.replace(oldCourseSubmitRead, newCourseSubmitRead);
    console.log('✅ Updated handleCourseSubmit to read from #courseVisualEditor');
} else {
    console.warn('⚠️ Could not find oldCourseSubmitRead');
}

// 4. Update openBlogModal population
const oldBlogPopulate = `document.getElementById('blogExcerptInput').value = blog ? (blog.excerpt || '') : '';
        document.getElementById('blogContentInput').value = blog ? blog.content : '';

        window.updateThumbPreview('blogImagePreview', 'blogImageInput', blog ? blog.image : 'images/blog/1.jpg');`;

const newBlogPopulate = `document.getElementById('blogExcerptInput').value = blog ? (blog.excerpt || '') : '';
        
        // Visual WYSIWYG Blog Body Editor
        const blogVisual = document.getElementById('blogVisualEditor');
        const blogContent = blog ? (blog.content || '') : '';
        if (blogVisual) {
            blogVisual.innerHTML = blogContent;
            initVisualEditorEvents('blogVisualEditor');
        }
        const blogContentInp = document.getElementById('blogContentInput');
        if (blogContentInp) blogContentInp.value = blogContent;

        window.updateThumbPreview('blogImagePreview', 'blogImageInput', blog ? blog.image : 'images/blog/1.jpg');`;

if (content.includes(oldBlogPopulate)) {
    content = content.replace(oldBlogPopulate, newBlogPopulate);
    console.log('✅ Updated openBlogModal to populate #blogVisualEditor');
} else {
    console.warn('⚠️ Could not find oldBlogPopulate');
}

// 5. Update handleBlogSubmit reading
const oldBlogSubmitRead = `const content = document.getElementById('blogContentInput').value.trim();`;
const newBlogSubmitRead = `const blogVisual = document.getElementById('blogVisualEditor');
        const content = blogVisual ? blogVisual.innerHTML.trim() : (document.getElementById('blogContentInput') ? document.getElementById('blogContentInput').value.trim() : '');
        if (document.getElementById('blogContentInput')) {
            document.getElementById('blogContentInput').value = content;
        }`;

if (content.includes(oldBlogSubmitRead)) {
    content = content.replace(oldBlogSubmitRead, newBlogSubmitRead);
    console.log('✅ Updated handleBlogSubmit to read from #blogVisualEditor');
} else {
    console.warn('⚠️ Could not find oldBlogSubmitRead');
}

fs.writeFileSync(filePath, content, 'utf8');
console.log('✅ edit/js/edit.js updated successfully!');
