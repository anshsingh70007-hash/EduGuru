const fs = require('fs');
const path = require('path');

const editIndexPath = path.join(__dirname, '..', 'edit', 'index.html');
const editRootPath = path.join(__dirname, '..', 'edit.html');

let html = fs.readFileSync(editIndexPath, 'utf8');

// 1. Add FontAwesome to head if missing
if (!html.includes('font-awesome')) {
    html = html.replace('<link rel="stylesheet" href="/edit/css/edit.css', '<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css">\n    <link rel="stylesheet" href="/edit/css/edit.css');
    console.log('✅ Added FontAwesome CDN link to head');
}

// 2. Enhance toolbar buttons with clean text labels + icons
const oldToolbarButtons = `<div class="toolbar-group" style="gap:4px;">
                                    <button type="button" class="btn-visual-tool" onclick="window.execEditorCmd('courseVisualEditor', 'bold')" title="Bold"><i class="fa fa-bold"></i></button>
                                    <button type="button" class="btn-visual-tool" onclick="window.execEditorCmd('courseVisualEditor', 'italic')" title="Italic"><i class="fa fa-italic"></i></button>
                                    <button type="button" class="btn-visual-tool" onclick="window.execEditorCmd('courseVisualEditor', 'underline')" title="Underline"><i class="fa fa-underline"></i></button>
                                    <button type="button" class="btn-visual-tool" onclick="window.execEditorCmd('courseVisualEditor', 'insertUnorderedList')" title="Bullet List"><i class="fa fa-list-ul"></i></button>
                                    <button type="button" class="btn-visual-tool" onclick="window.execEditorCmd('courseVisualEditor', 'insertOrderedList')" title="Numbered List"><i class="fa fa-list-ol"></i></button>
                                </div>`;

const newCourseToolbarButtons = `<div class="toolbar-group" style="gap:4px;">
                                    <button type="button" class="btn-visual-tool" onclick="window.execEditorCmd('courseVisualEditor', 'bold')" title="Bold" style="font-weight:900;"><b>B</b></button>
                                    <button type="button" class="btn-visual-tool" onclick="window.execEditorCmd('courseVisualEditor', 'italic')" title="Italic" style="font-style:italic; font-family:serif;"><i>I</i></button>
                                    <button type="button" class="btn-visual-tool" onclick="window.execEditorCmd('courseVisualEditor', 'underline')" title="Underline"><u>U</u></button>
                                    <button type="button" class="btn-visual-tool" onclick="window.execEditorCmd('courseVisualEditor', 'insertUnorderedList')" title="Bullet List">• Bullet</button>
                                    <button type="button" class="btn-visual-tool" onclick="window.execEditorCmd('courseVisualEditor', 'insertOrderedList')" title="Numbered List">1. List</button>
                                </div>`;

html = html.replace(oldToolbarButtons, newCourseToolbarButtons);

const oldBlogToolbarButtons = `<div class="toolbar-group" style="gap:4px;">
                                    <button type="button" class="btn-visual-tool" onclick="window.execEditorCmd('blogVisualEditor', 'bold')" title="Bold"><i class="fa fa-bold"></i></button>
                                    <button type="button" class="btn-visual-tool" onclick="window.execEditorCmd('blogVisualEditor', 'italic')" title="Italic"><i class="fa fa-italic"></i></button>
                                    <button type="button" class="btn-visual-tool" onclick="window.execEditorCmd('blogVisualEditor', 'underline')" title="Underline"><i class="fa fa-underline"></i></button>
                                    <button type="button" class="btn-visual-tool" onclick="window.execEditorCmd('blogVisualEditor', 'insertUnorderedList')" title="Bullet List"><i class="fa fa-list-ul"></i></button>
                                    <button type="button" class="btn-visual-tool" onclick="window.execEditorCmd('blogVisualEditor', 'insertOrderedList')" title="Numbered List"><i class="fa fa-list-ol"></i></button>
                                </div>`;

const newBlogToolbarButtons = `<div class="toolbar-group" style="gap:4px;">
                                    <button type="button" class="btn-visual-tool" onclick="window.execEditorCmd('blogVisualEditor', 'bold')" title="Bold" style="font-weight:900;"><b>B</b></button>
                                    <button type="button" class="btn-visual-tool" onclick="window.execEditorCmd('blogVisualEditor', 'italic')" title="Italic" style="font-style:italic; font-family:serif;"><i>I</i></button>
                                    <button type="button" class="btn-visual-tool" onclick="window.execEditorCmd('blogVisualEditor', 'underline')" title="Underline"><u>U</u></button>
                                    <button type="button" class="btn-visual-tool" onclick="window.execEditorCmd('blogVisualEditor', 'insertUnorderedList')" title="Bullet List">• Bullet</button>
                                    <button type="button" class="btn-visual-tool" onclick="window.execEditorCmd('blogVisualEditor', 'insertOrderedList')" title="Numbered List">1. List</button>
                                </div>`;

html = html.replace(oldBlogToolbarButtons, newBlogToolbarButtons);

fs.writeFileSync(editIndexPath, html, 'utf8');
fs.writeFileSync(editRootPath, html, 'utf8');

console.log('✅ Updated edit/index.html & edit.html with FontAwesome & visible typography buttons!');
