import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const scene = new URL("../scenes/fog-harbor/", import.meta.url);
const output = process.argv[2] ? resolve(process.argv[2]) : resolve(root, "dist", "fog-harbor.html");
let html = await readFile(new URL("index.html", scene), "utf8");
const css = await readFile(new URL("scene.css", scene), "utf8");
html = html.replace('<link rel="stylesheet" href="./scene.css">', () => "<style>" + css + "</style>");
const scripts = [];
for (const tag of html.matchAll(/<script defer src="([^"]+)"><\/script>/g)) {
  scripts.push(await readFile(new URL(tag[1], scene), "utf8"));
  html = html.replace(tag[0], "");
}
// Inline scripts run immediately. Insert them after the scene elements exist.
html = html.replace("</body>", () => "<script>\n" + scripts.join("\n") + "\n</script>\n</body>");
await mkdir(dirname(output), { recursive: true });
await writeFile(output, html);
console.log(output);
