const fs = require('fs');

let css = fs.readFileSync('app/globals.css', 'utf-8');

function hexToRgbStr(hex) {
  let r = parseInt(hex.slice(1, 3), 16);
  let g = parseInt(hex.slice(3, 5), 16);
  let b = parseInt(hex.slice(5, 7), 16);
  return `${r} ${g} ${b}`;
}

// Convert only hex colors to RGB channels
css = css.replace(/--([a-zA-Z0-9-]+):\s*(#[a-fA-F0-9]{6});/g, (match, name, hex) => {
  return `--${name}: ${hexToRgbStr(hex)};`;
});
fs.writeFileSync('app/globals.css', css);

let tw = fs.readFileSync('tailwind.config.ts', 'utf-8');

const colorsToUpdate = [
  'background', 'foreground', 'card', 'card-foreground',
  'popover', 'popover-foreground', 'primary', 'primary-foreground',
  'secondary', 'secondary-foreground', 'muted', 'muted-foreground',
  'accent', 'accent-foreground', 'destructive', 'destructive-foreground'
];

colorsToUpdate.forEach(color => {
  // we must match precisely
  const regex = new RegExp(`"var\\(--${color}\\)"`, 'g');
  tw = tw.replace(regex, `"rgb(var(--${color}) / <alpha-value>)"`);
});

fs.writeFileSync('tailwind.config.ts', tw);
console.log('Fixed Tailwind colors successfully');
