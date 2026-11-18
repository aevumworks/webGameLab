---
aliases: ["瓦尔登小屋"]
tags: [建筑参数, Web3D]
---
# 瓦尔登小屋

美国 · 康科德 · 1845 年

梭罗在《瓦尔登湖》〈经济篇〉中亲述的小屋。入口开在山墙一端，两侧各有一扇大窗，对面是砖砌壁炉。用英尺换算为米，一英尺等于 0.3048 米。

## 尺寸与口径

宽度与长度按外轮廓处理，8 英尺按立柱高度处理。门窗洞口、地板离地、坡度和材料厚度均为本项目取值。坡顶下保留阁楼空间。

下列参数块由模型直接读取。长度单位为米，角度单位为度。 `documented` 记录文献值，`design` 记录场景复原取值，数组从下至上排列。

```json
{
  "id": "walden",
  "name": "瓦尔登小屋",
  "unit": "m",
  "documented": {
    "width": 3.048,
    "length": 4.572,
    "postHeight": 2.4384,
    "sideWindows": 2,
    "endDoors": 1
  },
  "design": {
    "wallThickness": 0.14,
    "roofPitchDeg": 40,
    "overhang": 0.24,
    "doorWidth": 0.94,
    "doorHeight": 1.93,
    "windowWidth": 0.93,
    "windowHeight": 0.89,
    "sill": 0.95,
    "plinth": 0.16
  }
}
```

### 文献尺寸速查

| 项目 | 文献值 | 参数名 |
| --- | ---: | --- |
| 山墙宽度 | 3.048 米 | `width` |
| 长边长度 | 4.572 米 | `length` |
| 立柱高度 | 2.4384 米 | `postHeight` |
| 两侧大窗总数 | 2 | `sideWindows` |
| 山墙门数量 | 1 | `endDoors` |

## 放样顺序

1. 沿局部 Z 轴展开长边，正 Z 山墙设门。在地面上铺高起的地板，沿四周竖墙，按门窗开槽。
2. 两侧从檐口向中脊起坡。砖砌烟囱与后端壁炉同轴，铰链放在门洞左缘。
3. 场景建模含可转动的独立门扇、内侧桌凳、窗框、壁炉。原著提及的两处活板门与壁橱只做文字记录。

## 文献

- [梭罗原著，Economy](https://en.wikisource.org/wiki/Walden_(1854)_Thoreau/Economy)

[[00-工作台|返回工作台]] · [旋转查看此模型](https://aevumworks.github.io/webGameLab/architecture/?model=walden)
