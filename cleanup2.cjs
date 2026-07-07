const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, '.github', 'workflows', 'docs.yml');
if (fs.existsSync(targetFile)) {
    fs.unlinkSync(targetFile);
    console.log('Deleted ' + targetFile);
}

const docsDir = path.join(__dirname, 'docs');
if (fs.existsSync(docsDir)) {
    fs.rmSync(docsDir, { recursive: true, force: true });
    console.log('Deleted ' + docsDir);
}

fs.unlinkSync(__filename);
