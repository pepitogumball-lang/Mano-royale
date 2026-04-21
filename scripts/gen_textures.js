// Generate all PNG assets (pack_icons + item textures) using pure pngjs.
// Outputs to behavior_pack and resource_pack at the expected paths.
const fs   = require("fs");
const path = require("path");
const { PNG } = require("pngjs");

const ROOT = path.resolve(__dirname, "..");

function ensureDir(p) { fs.mkdirSync(p, { recursive: true }); }

function newPng(w, h) {
    const img = new PNG({ width: w, height: h });
    img.data.fill(0);
    return img;
}
function setPx(img, x, y, [r, g, b, a]) {
    if (x < 0 || y < 0 || x >= img.width || y >= img.height) return;
    const i = (img.width * y + x) << 2;
    img.data[i] = r; img.data[i + 1] = g; img.data[i + 2] = b; img.data[i + 3] = a;
}
function fillRect(img, x, y, w, h, c) {
    for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) setPx(img, xx, yy, c);
}
function save(img, file) {
    ensureDir(path.dirname(file));
    fs.writeFileSync(file, PNG.sync.write(img));
    console.log("  +", path.relative(ROOT, file));
}

// ---------- Pack icons (128x128) ----------
function packIcon(filePath, accent, label) {
    const W = 128, H = 128;
    const img = newPng(W, H);
    // background gradient
    for (let y = 0; y < H; y++) {
        const t = y / H;
        const r = Math.round(20 * (1 - t) + 50 * t);
        const g = Math.round(20 * (1 - t) + 30 * t);
        const b = Math.round(30 * (1 - t) + 50 * t);
        for (let x = 0; x < W; x++) setPx(img, x, y, [r, g, b, 255]);
    }
    // border
    fillRect(img, 0, 0, W, 4, accent);
    fillRect(img, 0, H - 4, W, 4, accent);
    fillRect(img, 0, 0, 4, H, accent);
    fillRect(img, W - 4, 0, 4, H, accent);
    // central diamond ("M")
    const cx = W / 2, cy = H / 2;
    for (let dy = -32; dy <= 32; dy++) {
        const span = 32 - Math.abs(dy);
        for (let dx = -span; dx <= span; dx++) {
            setPx(img, Math.round(cx + dx), Math.round(cy + dy), accent);
        }
    }
    // "MR" inner block
    fillRect(img, 50, 56, 8, 16, [255, 255, 255, 255]);
    fillRect(img, 70, 56, 8, 16, [255, 255, 255, 255]);
    fillRect(img, 58, 56, 12, 4, [255, 255, 255, 255]);
    save(img, filePath);
}

// ---------- 16x16 item textures ----------
// Offhand torch — vertical stick with glowing top
function texOffhandTorch(filePath) {
    const img = newPng(16, 16);
    // wood stick
    const wood = [120, 70, 25, 255];
    const woodDark = [80, 45, 15, 255];
    fillRect(img, 7, 7, 2, 8, wood);
    fillRect(img, 7, 14, 2, 1, woodDark);
    // flame
    const flame = [255, 180, 30, 255];
    const flameHot = [255, 240, 120, 255];
    fillRect(img, 6, 4, 4, 3, flame);
    fillRect(img, 7, 2, 2, 3, flame);
    setPx(img, 8, 1, flameHot);
    setPx(img, 7, 5, flameHot);
    setPx(img, 8, 5, flameHot);
    // glow halo (semi-transparent)
    const halo = [255, 220, 100, 70];
    fillRect(img, 4, 3, 8, 5, halo);
    save(img, filePath);
}

// Trigger — golden compass-like icon with hand
function texTrigger(filePath) {
    const img = newPng(16, 16);
    const gold = [240, 195, 35, 255];
    const goldDark = [170, 130, 20, 255];
    const white = [255, 255, 255, 255];
    const skin  = [240, 200, 170, 255];

    // outer ring
    for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
        const dx = x - 7.5, dy = y - 7.5;
        const r = Math.sqrt(dx * dx + dy * dy);
        if (r > 5.5 && r < 7.5) setPx(img, x, y, gold);
        else if (r >= 7.5 && r < 8) setPx(img, x, y, goldDark);
    }
    // center hand silhouette
    fillRect(img, 6, 5, 4, 6, skin);   // palm
    fillRect(img, 6, 4, 1, 2, skin);   // thumb
    fillRect(img, 7, 3, 1, 3, skin);   // finger 1
    fillRect(img, 8, 3, 1, 3, skin);   // finger 2
    fillRect(img, 9, 4, 1, 2, skin);   // finger 3
    setPx(img, 7, 11, white);
    save(img, filePath);
}

console.log("Generating PNG assets...");
packIcon(path.join(ROOT, "behavior_pack/pack_icon.png"), [240, 195, 35, 255]);
packIcon(path.join(ROOT, "resource_pack/pack_icon.png"), [80, 200, 255, 255]);
texOffhandTorch(path.join(ROOT, "resource_pack/textures/items/offhand_torch.png"));
texTrigger(path.join(ROOT, "resource_pack/textures/items/mr_trigger.png"));
console.log("Done.");
