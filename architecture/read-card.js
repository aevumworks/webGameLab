export async function readBuildingCard(id) {
  const url = new URL("../knowledge/建筑/" + id + ".md", import.meta.url);
  const response = await fetch(url);
  if (!response.ok) throw new Error("建筑参数读取失败，HTTP " + response.status);
  const note = await response.text();
  const block = note.match(/^`{3}json\s*\n([\s\S]*?)\n`{3}/m);
  if (!block) throw new Error("建筑卡缺少 JSON 参数 " + id);
  return JSON.parse(block[1]);
}
