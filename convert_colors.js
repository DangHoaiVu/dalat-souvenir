const fs = require('fs');

// 1. Process globals.css
let css = fs.readFileSync('app/globals.css', 'utf-8');

function hexToRgbStr(hex) {
  let r = parseInt(hex.slice(1, 3), 16);
  let g = parseInt(hex.slice(3, 5), 16);
  let b = parseInt(hex.slice(5, 7), 16);
  return `${r} ${g} ${b}`;
}

css = css.replace(/--([a-zA-Z0-9-]+):\s*(#[a-fA-F0-9]{6});/g, (match, name, hex) => {
  return `--${name}: ${hexToRgbStr(hex)};`;
});
fs.writeFileSync('app/globals.css', css);

// 2. Process tailwind.config.ts
let tw = fs.readFileSync('tailwind.config.ts', 'utf-8');

// We want to replace "var(--border)" with "rgb(var(--border) / <alpha-value>)"
tw = tw.replace(/"var\(--([a-zA-Z0-9-]+)\)"/g, (match, name) => {
  return `"rgb(var(--${name}) / <alpha-value>)"`;
});

fs.writeFileSync('tailwind.config.ts', tw);

console.log('Successfully updated globals.css and tailwind.config.ts');
