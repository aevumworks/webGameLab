---
aliases: ["天坛祈年殿"]
tags: [建筑参数, Web3D]
---
# 天坛祈年殿

中国 · 北京 · 清代重建形制

圆殿位于三层坛台之上，三重檐攒尖。天坛公园公布坛殿通高约 38 米、外围柱圈直径 24 米。北京市公园管理中心记载 4 根龙井柱与内外两圈各 12 根柱。

## 尺寸与口径

柱圈直径按柱中线放样。38 米为坛、殿合计高度。三重出檐半径、坛高拆分和柱圈分配为轮廓复原值。

下列参数块由模型直接读取。长度单位为米，角度单位为度。 `documented` 记录文献值，`design` 记录场景复原取值，数组从下至上排列。

```json
{
  "id": "qiniandian",
  "name": "天坛祈年殿",
  "unit": "m",
  "documented": {
    "totalHeight": 38,
    "outerColumnDiameter": 24,
    "centralPosts": 4,
    "innerPosts": 12,
    "outerPosts": 12,
    "centralPostHeight": 19.2,
    "centralPostDiameter": 1.2,
    "eaves": 3,
    "terraces": 3
  },
  "design": {
    "terraceHeight": 5.4,
    "terraceRadii": [
      27,
      24,
      21
    ],
    "roofRadii": [
      15.9,
      12.6,
      9.1
    ],
    "eaveFractions": [
      0.32,
      0.52,
      0.72
    ],
    "innerColumnRadius": 8.2,
    "centralColumnRadius": 4.1
  }
}
```

### 文献尺寸速查

| 项目 | 文献值 | 参数名 |
| --- | ---: | --- |
| 坛殿通高（约数） | 38 米 | `totalHeight` |
| 外圈柱中线直径 | 24 米 | `outerColumnDiameter` |
| 龙井柱根数 | 4 | `centralPosts` |
| 内圈柱根数 | 12 | `innerPosts` |
| 外圈柱根数 | 12 | `outerPosts` |
| 龙井柱高 | 19.2 米 | `centralPostHeight` |
| 龙井柱直径 | 1.2 米 | `centralPostDiameter` |
| 檐层数 | 3 | `eaves` |
| 坛台层数 | 3 | `terraces` |

## 放样顺序

1. 在三段同心台基上按 4、12、12 放样三圈柱。
2. 按三层出檐标高旋转曲线生成蓝瓦屋面，用檐口与金顶强化轮廓。
3. 总高检查应从底层坛台底面量至宝顶。模型简化斗栱、彩画与栏板。

## 文献

- [天坛公园 · 祈年殿](https://tiantanpark.cn/scenic_spot_list/detail/1254.html)
- [北京市公园管理中心 · 祈年殿](https://gygl.beijing.gov.cn/whgy/mlgy/mlgy_gyjg01/201912/t20191211_1048233.html)

[[00-工作台|返回工作台]] · [旋转查看此模型](https://aevumworks.github.io/webGameLab/architecture/?model=qiniandian)
