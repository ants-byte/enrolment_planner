import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const files = ['index.html', 'styles.css', 'script.js', 'semester-config.json',
  'mcp-worker.mjs', 'mcp-information.mjs', 'planner-chat.mjs', 'chat-usage.mjs', 'wrangler.jsonc',
  'tools/update-modified.mjs'];
const git = args => execFileSync('git', args, { cwd: root, encoding: 'utf8' }).trim();
const committed = git(['log', '-1', '--format=%cI', '--', ...files]);
let modified = committed ? Date.parse(committed) : 0;
for (const file of files) {
  if (git(['status', '--porcelain', '--', file])) {
    if (file === 'index.html' && committed) {
      const withoutTimestamp = text => text.replace(/<div id="site-modified">.*?<\/div>/, '<div id="site-modified"></div>');
      if (withoutTimestamp(readFileSync(new URL('../index.html', import.meta.url), 'utf8')) ===
          withoutTimestamp(git(['show', 'HEAD:index.html']) + '\n')) continue;
    }
    modified = Math.max(modified, statSync(new URL(`../${file}`, import.meta.url)).mtimeMs);
  }
}
if (!modified) throw new Error('Cannot determine the site modification time.');
const date = new Date(modified);
const options = { timeZone: 'Australia/Melbourne' };
const time = date.toLocaleTimeString('en-AU', { ...options, hour: 'numeric', minute: '2-digit', hour12: true }).toUpperCase();
const day = date.toLocaleDateString('en-AU', { ...options, day: 'numeric', month: 'numeric', year: 'numeric' });
const path = new URL('../index.html', import.meta.url);
const html = readFileSync(path, 'utf8');
const updated = html.replace(/<div id="site-modified">.*?<\/div>/, `<div id="site-modified">Last modified: <time datetime="${date.toISOString()}">${time}, ${day}</time> (Melbourne time)</div>`);
if (updated === html && !html.includes('id="site-modified"')) throw new Error('Missing footer timestamp element.');
if (updated !== html) writeFileSync(path, updated);
console.log(`Site last modified: ${time}, ${day} (Melbourne time)`);
