const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');

// 1. Update edit/index.html
console.log('Updating edit/index.html...');
const editHtmlPath = path.join(rootDir, 'edit', 'index.html');
let editHtml = fs.readFileSync(editHtmlPath, 'utf8');

// Replace course 7. Overview Content block
const oldCourseOverviewRegex = /<!-- 7\. Overview Content with Heading-1 to Heading-6 Toolbar -->[\s\S]*?<div id="courseOverviewPreview" class="rich-preview-box"><\/div>\s*<\/div>/;

const newCourseOverviewHtml = `<!-- 7. Visual WYSIWYG Course Overview & Content Editor -->
                    <div class="form-group" style="margin-top:14px;">
                        <label style="display:flex; justify-content:space-between; align-items:center;">
                            <span><strong>7. Course Overview &amp; Curriculum Description</strong> <span style="font-weight:400; color:#64748b;">(Visual Editor: Select text and click H1, H2, Bold to format directly)</span></span>
                        </label>
                        <div class="visual-editor-container">
                            <div class="visual-editor-toolbar">
                                <div class="toolbar-group">
                                    <select class="tool-select" onchange="window.applyHeadingStyle('courseVisualEditor', this.value); this.value='';">
                                        <option value="" disabled selected>Formatting / Style</option>
                                        <option value="p">Paragraph (Normal Text)</option>
                                        <option value="h1">Heading 1 (Main Title)</option>
                                        <option value="h2">Heading 2 (Major Section)</option>
                                        <option value="h3">Heading 3 (Sub Section)</option>
                                        <option value="h4">Heading 4 (Topic Header)</option>
                                        <option value="h5">Heading 5 (Small Heading)</option>
                                        <option value="h6">Heading 6 (Minor Title)</option>
                                    </select>
                                </div>
                                <div class="toolbar-divider"></div>
                                <div class="toolbar-group" style="gap:4px;">
                                    <button type="button" class="btn-visual-tool btn-tool-h" onclick="window.applyHeadingStyle('courseVisualEditor', 'h1')" title="Heading 1">H1</button>
                                    <button type="button" class="btn-visual-tool btn-tool-h" onclick="window.applyHeadingStyle('courseVisualEditor', 'h2')" title="Heading 2">H2</button>
                                    <button type="button" class="btn-visual-tool btn-tool-h" onclick="window.applyHeadingStyle('courseVisualEditor', 'h3')" title="Heading 3">H3</button>
                                    <button type="button" class="btn-visual-tool btn-tool-h" onclick="window.applyHeadingStyle('courseVisualEditor', 'h4')" title="Heading 4">H4</button>
                                    <button type="button" class="btn-visual-tool btn-tool-h" onclick="window.applyHeadingStyle('courseVisualEditor', 'h5')" title="Heading 5">H5</button>
                                    <button type="button" class="btn-visual-tool btn-tool-h" onclick="window.applyHeadingStyle('courseVisualEditor', 'h6')" title="Heading 6">H6</button>
                                </div>
                                <div class="toolbar-divider"></div>
                                <div class="toolbar-group" style="gap:4px;">
                                    <button type="button" class="btn-visual-tool" onclick="window.execEditorCmd('courseVisualEditor', 'bold')" title="Bold"><i class="fa fa-bold"></i></button>
                                    <button type="button" class="btn-visual-tool" onclick="window.execEditorCmd('courseVisualEditor', 'italic')" title="Italic"><i class="fa fa-italic"></i></button>
                                    <button type="button" class="btn-visual-tool" onclick="window.execEditorCmd('courseVisualEditor', 'underline')" title="Underline"><i class="fa fa-underline"></i></button>
                                    <button type="button" class="btn-visual-tool" onclick="window.execEditorCmd('courseVisualEditor', 'insertUnorderedList')" title="Bullet List"><i class="fa fa-list-ul"></i></button>
                                    <button type="button" class="btn-visual-tool" onclick="window.execEditorCmd('courseVisualEditor', 'insertOrderedList')" title="Numbered List"><i class="fa fa-list-ol"></i></button>
                                </div>
                                <div class="toolbar-divider"></div>
                                <div class="toolbar-group" style="gap:4px;">
                                    <button type="button" class="btn-visual-tool btn-tool-lead" onclick="window.insertVisualInquiryBox('courseVisualEditor')" title="Insert Admission Inquiry Callout Box"><i class="fa fa-paper-plane"></i> + Inquiry Box</button>
                                    <button type="button" class="btn-visual-tool btn-tool-clear" onclick="window.clearEditorFormatting('courseVisualEditor')" title="Clear Formatting"><i class="fa fa-eraser"></i> Clear</button>
                                </div>
                            </div>
                            <!-- Visual WYSIWYG Canvas: Formats visually in real-time -->
                            <div id="courseVisualEditor" class="visual-editor-canvas" contenteditable="true" spellcheck="true" placeholder="Write comprehensive course details here... Highlight text and click H1, H2, or Bold to format directly!"></div>
                            <input type="hidden" id="courseDescriptionInput">
                        </div>
                    </div>`;

if (oldCourseOverviewRegex.test(editHtml)) {
    editHtml = editHtml.replace(oldCourseOverviewRegex, newCourseOverviewHtml);
    console.log('✅ Replaced course overview block with Visual WYSIWYG Editor in edit/index.html');
} else {
    console.warn('⚠️ Could not match oldCourseOverviewRegex in edit/index.html');
}

// Replace blog modal textarea with Visual WYSIWYG Editor
const oldBlogContentRegex = /<div class="form-group">\s*<label>Full Blog Content \(Article Body\)<\/label>\s*<textarea id="blogContentInput" class="form-control" rows="6" placeholder="Write full article here\. Supports paragraphs, headings, and bullet points\.\.\."><\/textarea>\s*<\/div>/;

const newBlogContentHtml = `<!-- Visual WYSIWYG Blog Article Body Editor -->
                    <div class="form-group" style="margin-top:14px;">
                        <label style="display:flex; justify-content:space-between; align-items:center;">
                            <span><strong>Full Blog Article Content</strong> <span style="font-weight:400; color:#64748b;">(Visual Editor: Select text and click H1, H2, Bold to format directly)</span></span>
                        </label>
                        <div class="visual-editor-container">
                            <div class="visual-editor-toolbar">
                                <div class="toolbar-group">
                                    <select class="tool-select" onchange="window.applyHeadingStyle('blogVisualEditor', this.value); this.value='';">
                                        <option value="" disabled selected>Formatting / Style</option>
                                        <option value="p">Paragraph (Normal Text)</option>
                                        <option value="h1">Heading 1 (Main Title)</option>
                                        <option value="h2">Heading 2 (Major Section)</option>
                                        <option value="h3">Heading 3 (Sub Section)</option>
                                        <option value="h4">Heading 4 (Topic Header)</option>
                                        <option value="h5">Heading 5 (Small Heading)</option>
                                        <option value="h6">Heading 6 (Minor Title)</option>
                                    </select>
                                </div>
                                <div class="toolbar-divider"></div>
                                <div class="toolbar-group" style="gap:4px;">
                                    <button type="button" class="btn-visual-tool btn-tool-h" onclick="window.applyHeadingStyle('blogVisualEditor', 'h1')" title="Heading 1">H1</button>
                                    <button type="button" class="btn-visual-tool btn-tool-h" onclick="window.applyHeadingStyle('blogVisualEditor', 'h2')" title="Heading 2">H2</button>
                                    <button type="button" class="btn-visual-tool btn-tool-h" onclick="window.applyHeadingStyle('blogVisualEditor', 'h3')" title="Heading 3">H3</button>
                                    <button type="button" class="btn-visual-tool btn-tool-h" onclick="window.applyHeadingStyle('blogVisualEditor', 'h4')" title="Heading 4">H4</button>
                                    <button type="button" class="btn-visual-tool btn-tool-h" onclick="window.applyHeadingStyle('blogVisualEditor', 'h5')" title="Heading 5">H5</button>
                                    <button type="button" class="btn-visual-tool btn-tool-h" onclick="window.applyHeadingStyle('blogVisualEditor', 'h6')" title="Heading 6">H6</button>
                                </div>
                                <div class="toolbar-divider"></div>
                                <div class="toolbar-group" style="gap:4px;">
                                    <button type="button" class="btn-visual-tool" onclick="window.execEditorCmd('blogVisualEditor', 'bold')" title="Bold"><i class="fa fa-bold"></i></button>
                                    <button type="button" class="btn-visual-tool" onclick="window.execEditorCmd('blogVisualEditor', 'italic')" title="Italic"><i class="fa fa-italic"></i></button>
                                    <button type="button" class="btn-visual-tool" onclick="window.execEditorCmd('blogVisualEditor', 'underline')" title="Underline"><i class="fa fa-underline"></i></button>
                                    <button type="button" class="btn-visual-tool" onclick="window.execEditorCmd('blogVisualEditor', 'insertUnorderedList')" title="Bullet List"><i class="fa fa-list-ul"></i></button>
                                    <button type="button" class="btn-visual-tool" onclick="window.execEditorCmd('blogVisualEditor', 'insertOrderedList')" title="Numbered List"><i class="fa fa-list-ol"></i></button>
                                </div>
                                <div class="toolbar-divider"></div>
                                <div class="toolbar-group" style="gap:4px;">
                                    <button type="button" class="btn-visual-tool btn-tool-lead" onclick="window.insertVisualInquiryBox('blogVisualEditor')" title="Insert Admission Inquiry Callout Box"><i class="fa fa-paper-plane"></i> + Inquiry Box</button>
                                    <button type="button" class="btn-visual-tool btn-tool-clear" onclick="window.clearEditorFormatting('blogVisualEditor')" title="Clear Formatting"><i class="fa fa-eraser"></i> Clear</button>
                                </div>
                            </div>
                            <!-- Visual WYSIWYG Canvas for Blog Body -->
                            <div id="blogVisualEditor" class="visual-editor-canvas" contenteditable="true" spellcheck="true" placeholder="Write full article here... Highlight any sentence and click H1, H2, or Bold to format directly!"></div>
                            <input type="hidden" id="blogContentInput">
                        </div>
                    </div>`;

if (oldBlogContentRegex.test(editHtml)) {
    editHtml = editHtml.replace(oldBlogContentRegex, newBlogContentHtml);
    console.log('✅ Replaced blog content block with Visual WYSIWYG Editor in edit/index.html');
} else {
    console.warn('⚠️ Could not match oldBlogContentRegex in edit/index.html');
}

fs.writeFileSync(editHtmlPath, editHtml, 'utf8');

// Synchronize to root edit.html immediately
require('./sync_root_edit.js');
console.log('✅ Synced to root edit.html');
