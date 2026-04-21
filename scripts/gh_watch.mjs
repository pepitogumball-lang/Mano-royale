// Watch the latest workflow run for a sha; print logs of failed jobs/steps.
const TOKEN = process.env.GITHUB_PERSONAL_ACCESS_TOKEN;
const OWNER = 'pepitogumball-lang';
const REPO  = 'Mano-royale';
const SHA   = process.argv[2]; // optional, else latest
const TIMEOUT_MS = 8 * 60 * 1000;
const POLL_MS = 6000;

async function gh(method, url, raw=false) {
  const r = await fetch('https://api.github.com' + url, {
    method,
    headers: {
      'Authorization': `Bearer ${TOKEN}`,
      'Accept': 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'mr-bot',
    },
  });
  if (!r.ok) throw new Error(`${method} ${url} -> ${r.status}: ${(await r.text()).slice(0,300)}`);
  return raw ? r : r.json();
}

const start = Date.now();
let runId;

while (!runId) {
  const list = await gh('GET', `/repos/${OWNER}/${REPO}/actions/runs?per_page=10`);
  const runs = list.workflow_runs || [];
  const match = SHA ? runs.find(r => r.head_sha === SHA) : runs[0];
  if (match) { runId = match.id; console.log(`Found run #${match.run_number} (${match.name}) id=${match.id} status=${match.status} on sha=${match.head_sha.slice(0,7)}`); break; }
  if (Date.now() - start > 60000) { console.log('No run found in 60s'); process.exit(1); }
  await new Promise(r => setTimeout(r, 3000));
}

let prevStatus = '';
while (true) {
  const run = await gh('GET', `/repos/${OWNER}/${REPO}/actions/runs/${runId}`);
  const tag = `[${run.status}/${run.conclusion ?? '...'}]`;
  if (tag !== prevStatus) { console.log(tag, run.html_url); prevStatus = tag; }
  if (run.status === 'completed') {
    console.log('=== FINAL CONCLUSION:', run.conclusion, '===');
    if (run.conclusion !== 'success') {
      const jobs = await gh('GET', `/repos/${OWNER}/${REPO}/actions/runs/${runId}/jobs`);
      for (const j of jobs.jobs) {
        if (j.conclusion === 'success') continue;
        console.log(`\n--- JOB: ${j.name} (${j.conclusion}) ---`);
        for (const s of j.steps || []) {
          console.log(`  step: ${s.number}. ${s.name}  -> ${s.conclusion}`);
        }
        try {
          const r = await gh('GET', `/repos/${OWNER}/${REPO}/actions/jobs/${j.id}/logs`, true);
          const txt = await r.text();
          console.log('\n--- LOGS (last 6000 chars) ---\n' + txt.slice(-6000));
        } catch (e) { console.log('Logs fetch failed:', e.message); }
      }
    }
    process.exit(run.conclusion === 'success' ? 0 : 2);
  }
  if (Date.now() - start > TIMEOUT_MS) { console.log('Timeout'); process.exit(3); }
  await new Promise(r => setTimeout(r, POLL_MS));
}
