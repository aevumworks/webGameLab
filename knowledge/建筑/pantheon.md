---
aliases: ["罗马万神殿"]
tags: [建筑参数, Web3D]
---
# 罗马万神殿

意大利 · 罗马 · 哈德良时期

圆形内殿可容纳直径约 43.30 米的球体。穹顶中央圆孔直径 8.92 米，内面有五圈、每圈二十八格藻井。前方设柱廊、三角山花。

## 尺寸与口径

圆孔按开口直径。鼓座厚度文献描述超过 6 米，建模值 6.1 米。柱廊细部、开门宽度及厚度按视觉比例恢复。

下列参数块由模型直接读取。长度单位为米，角度单位为度。 `documented` 记录文献值，`design` 记录场景复原取值，数组从下至上排列。

```json
{
  "id": "pantheon",
  "name": "罗马万神殿",
  "unit": "m",
  "documented": {
    "interiorDiameter": 43.3,
    "oculus": 8.92,
    "cofferRings": 5,
    "coffersPerRing": 28
  },
  "design": {
    "drumWall": 6.1,
    "porticoWidth": 33,
    "porticoDepth": 15,
    "columnsAcross": 8,
    "columnHeight": 12.6,
    "columnRadius": 0.72,
    "doorWidth": 6.6
  }
}
```

### 文献尺寸速查

| 项目 | 文献值 | 参数名 |
| --- | ---: | --- |
| 内殿直径 | 43.3 米 | `interiorDiameter` |
| 穹顶圆孔直径 | 8.92 米 | `oculus` |
| 藻井圈数 | 5 | `cofferRings` |
| 每圈藻井格数 | 28 | `coffersPerRing` |

## 放样顺序

1. 令 R = 21.65 米，鼓座顶取 R，半球从鼓座顶上升至 2R。由反三角函数截去圆孔，保留内外曲面。
2. 圆台正面切入口，沿中轴对接矩形柱廊和三角山花。五圈藻井中心按球面纬度、每圈 28 等分放样。
3. 预览表达内腔、透光圆孔、柱廊与藻井位置。古代材料配方、科林斯柱头雕花未细分。

## 文献

- [意大利文化部 · Pantheon](https://direzionemuseiroma.cultura.gov.it/pantheon/)
- [罗马市旅游局 · Pantheon](https://turismoroma.it/en/places/pantheon)

[[00-工作台|返回工作台]] · [旋转查看此模型](https://aevumworks.github.io/webGameLab/architecture/?model=pantheon)
