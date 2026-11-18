---
aliases: ["应县木塔"]
tags: [建筑参数, Web3D]
---
# 应县木塔

中国 · 山西应县 · 辽清宁二年（1056）

八角形木构楼阁塔，五个明层之间夹四个暗层，底层重檐形成六层檐。结构研究拆分了台基、木构、砖座及塔刹的高度。

## 尺寸与口径

30.27 米的底层直径未在本卡资料中明确端点。预览按外接圆直径放样。各檐收分、伸出长度和单层柱高使用归一化的设计值。

下列参数块由模型直接读取。长度单位为米，角度单位为度。 `documented` 记录文献值，`design` 记录场景复原取值，数组从下至上排列。

```json
{
  "id": "yingxian",
  "name": "应县木塔",
  "unit": "m",
  "documented": {
    "height": 67.31,
    "base": 4.4,
    "timber": 51.14,
    "brickCrown": 1.86,
    "spire": 9.91,
    "diameter": 30.27,
    "sides": 8,
    "visibleFloors": 5,
    "hiddenFloors": 4,
    "eaves": 6
  },
  "design": {
    "roofLevels": [
      0.15,
      0.32,
      0.51,
      0.68,
      0.84,
      0.99
    ],
    "roofScales": [
      1.13,
      1.07,
      0.98,
      0.87,
      0.77,
      0.66
    ],
    "balconyDepth": 1.15
  }
}
```

### 文献尺寸速查

| 项目 | 文献值 | 参数名 |
| --- | ---: | --- |
| 各段通高之和 | 67.31 米 | `height` |
| 台基高 | 4.4 米 | `base` |
| 木构段高 | 51.14 米 | `timber` |
| 砖座高 | 1.86 米 | `brickCrown` |
| 塔刹高 | 9.91 米 | `spire` |
| 底层直径（端点见下文口径） | 30.27 米 | `diameter` |
| 平面边数 | 8 | `sides` |
| 明层数 | 5 | `visibleFloors` |
| 暗层数 | 4 | `hiddenFloors` |
| 檐层数 | 6 | `eaves` |

## 放样顺序

1. 建立八角台基，将木构总高分配到六道檐口。底层为重檐。
2. 逐圈缩小柱网和挑檐，围合红褐色壁板，明层加周廊与栏杆。
3. 将砖座与金属塔刹叠于中心轴。模型表达明层和暗层外观节奏，暗层内部梁架无测绘复原。

## 文献

- [结构研究 · 佛宫寺释迦塔数值分析（PDF）](https://tcct.amss.ac.cn/sc-journal/2023/202302/20230231.pdf)
- [中国钢结构协会 · 应县木塔结构资料（PDF）](https://www.cnass.cn/upload/gjgfenhui/5f715c051189e.pdf)

[[00-工作台|返回工作台]] · [旋转查看此模型](https://aevumworks.github.io/webGameLab/architecture/?model=yingxian)
