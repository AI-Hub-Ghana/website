const fs = require('fs');
const path = require('path');

fs.mkdirSync(path.join(__dirname, '..', 'src', 'styles'), { recursive: true });

let css = fs.readFileSync(path.join(__dirname, '..', 'styles.src.css'), 'utf-8');
css = css.replace(/@source\s+["']\.\/index\.html["'];\s*@source\s+["']\.\/get-involved\.html["'];/, '@source "../**/*.{astro,html,js,jsx,md,mdx,ts,tsx}";');
fs.writeFileSync(path.join(__dirname, '..', 'src', 'styles', 'global.css'), css, 'utf-8');

let printCss = fs.readFileSync(path.join(__dirname, '..', 'styles.print.src.css'), 'utf-8');
printCss = printCss.replace('@import "./styles.src.css";', '@import "./global.css";');
fs.writeFileSync(path.join(__dirname, '..', 'src', 'styles', 'print.css'), printCss, 'utf-8');

console.log('Styles created successfully');
