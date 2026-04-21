// Push current workspace state to github.com/<owner>/<repo>:<branch> via REST API.
// Skips files in .gitignore-ish set. Excludes: .git, node_modules, build, .local, .cache, .agents, .replit
import fs from 'node:fs';
import path from 'node:path';

const TOKEN  = process.env.GITHUB_PERSONAL_ACCESS_TOKEN;
const OWNER  = process.env.GH_OWNER  || 'pepitogumball-lang';
const REPO   = process.env.GH_REPO   || 'Mano-royale';
const BRANCH = process.env.GH_BRANCH || 'main';
const MSG    = process.env.GH_MSG    || 'feat: rebuild Mano Royale v1.2.0 (universal offhand, fixed build)';
if (!TOKEN) { console.error('NO TOKEN'); process.exit(2); }

const API = 'https://api.github.com';
async function gh(method, url, body, raw=false) {
  const r = await fetch(API + url, {
    method,
    headers: {
      'Authorization': `Bearer ${TOKEN}`,
      'Accept': 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'mano-royale-replit-bot',
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const txt = await r.text();
  if (!r.ok) throw new Error(`${method} ${url} -> ${r.status}: ${txt.slice(0,500)}`);
  return raw ? txt : (txt ? JSON.parse(txt) : null);
}

const ROOT = process.cwd();
const EXCLUDE_DIRS = new Set(['.git','node_modules','build','.local','.cache','.agents','.config','.upm','.pythonlibs','.npm','attached_assets']);
const EXCLUDE_FILES = new Set(['.replit','replit.nix','.replit.local']);

function walk(dir, out=[]) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    if (EXCLUDE_DIRS.has(ent.name)) continue;
    const abs = path.join(dir, ent.name);
    const rel = path.relative(ROOT, abs).split(path.sep).join('/');
    if (ent.isDirectory()) walk(abs, out);
    else if (ent.isFile()) {
      if (EXCLUDE_FILES.has(ent.name)) continue;
      if (rel.startsWith('build/')) continue;
      out.push(rel);
    }
  }
  return out;
}

const files = walk(ROOT).sort();
console.log(`Files to push: ${files.length}`);

// Get branch ref
let baseSha;
try {
  const ref = await gh('GET', `/repos/${OWNER}/${REPO}/git/refs/heads/${BRANCH}`);
  baseSha = ref.object.sha;
  console.log('Base ref sha:', baseSha);
} catch (e) {
  console.error('Failed to get branch ref:', e.message);
  process.exit(3);
}

const baseCommit = await gh('GET', `/repos/${OWNER}/${REPO}/git/commits/${baseSha}`);
const baseTreeSha = baseCommit.tree.sha;
console.log('Base tree sha:', baseTreeSha);

// Create blobs for each file (parallel, capped concurrency)
async function createBlob(rel) {
  const buf = fs.readFileSync(rel);
  const r = await gh('POST', `/repos/${OWNER}/${REPO}/git/blobs`, {
    content: buf.toString('base64'),
    encoding: 'base64',
  });
  return { path: rel, mode: '100644', type: 'blob', sha: r.sha };
}

const treeEntries = [];
const CONC = 8;
let i = 0;
async function worker() {
  while (i < files.length) {
    const my = i++;
    const rel = files[my];
    try {
      const e = await createBlob(rel);
      treeEntries.push(e);
      if ((my+1) % 10 === 0) console.log(`  blob ${my+1}/${files.length}`);
    } catch (err) {
      console.error('Blob failed for', rel, err.message);
      throw err;
    }
  }
}
await Promise.all(Array.from({length: CONC}, worker));
console.log('Created blobs:', treeEntries.length);

// New tree (replace whole tree to mirror local state)
const tree = await gh('POST', `/repos/${OWNER}/${REPO}/git/trees`, {
  tree: treeEntries,
  // No base_tree: we want the remote tree to exactly match local (so deletions also apply)
});
console.log('New tree sha:', tree.sha);

const commit = await gh('POST', `/repos/${OWNER}/${REPO}/git/commits`, {
  message: MSG,
  tree: tree.sha,
  parents: [baseSha],
});
console.log('New commit sha:', commit.sha);

await gh('PATCH', `/repos/${OWNER}/${REPO}/git/refs/heads/${BRANCH}`, {
  sha: commit.sha,
  force: false,
});
console.log(`Pushed to ${OWNER}/${REPO}@${BRANCH} -> ${commit.sha}`);
console.log(`https://github.com/${OWNER}/${REPO}/commit/${commit.sha}`);
