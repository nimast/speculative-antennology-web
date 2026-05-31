import puppeteer from 'puppeteer-core';
import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { Buffer } from 'node:buffer';

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
const CHROME = process.env.CHROME_BIN || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const PORT = process.env.PORT || '8765';
const BASE = `http://localhost:${PORT}/.claude/rc-build/render/render.html`;
const FFMPEG = process.env.FFMPEG || '/opt/homebrew/bin/ffmpeg';
const OUT = process.env.OUT || `${REPO_ROOT}/assets/models/turntable`;
const TMP = '/tmp/sa-turntable-frames';
const MODELS = (process.env.MODELS || 'model-0a,model-0b,model-1a,model-1b,model-2a,model-2b').split(',');
const N = Number(process.env.N || 300);   // frames per full rotation (300 -> 12s loop, 2x slower than original 150)
const FPS = Number(process.env.FPS || 25);

mkdirSync(OUT, { recursive: true });

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  args: ['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--disable-dev-shm-usage']
});

for (const m of MODELS){
  const page = await browser.newPage();
  await page.setViewport({ width: 640, height: 640 });
  const url = `${BASE}?model=${encodeURIComponent('/assets/models/'+m+'.glb')}`;
  await page.goto(url, { waitUntil: 'networkidle0', timeout: 60000 });
  try {
    await page.waitForFunction('window.__ready === true || window.__error', { timeout: 60000 });
  } catch(e){
    console.log(`[${m}] TIMEOUT waiting for ready; error=`, await page.evaluate('window.__error||null'));
    await page.close(); continue;
  }
  const err = await page.evaluate('window.__error||null');
  if (err){ console.log(`[${m}] LOAD ERROR: ${err}`); await page.close(); continue; }

  const dir = `${TMP}/${m}`;
  rmSync(dir, { recursive:true, force:true });
  mkdirSync(dir, { recursive:true });
  for (let i=0;i<N;i++){
    const theta = (i/N) * Math.PI * 2;
    const dataUrl = await page.evaluate((t)=>window.__frame(t), theta);
    const b64 = dataUrl.split(',')[1];
    writeFileSync(`${dir}/f${String(i).padStart(4,'0')}.png`, Buffer.from(b64,'base64'));
  }
  await page.close();

  const outFile = `${OUT}/${m}.mp4`;
  execFileSync(FFMPEG, ['-y','-framerate',String(FPS),'-i',`${dir}/f%04d.png`,
    '-c:v','libx264','-pix_fmt','yuv420p','-vf','scale=600:600','-movflags','+faststart',
    '-crf','23', outFile], { stdio:'inherit' });
  rmSync(dir, { recursive:true, force:true });
  console.log(`[${m}] OK -> ${outFile}`);
}

await browser.close();
console.log('DONE');
