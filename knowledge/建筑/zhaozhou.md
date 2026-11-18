---
aliases: ["赵州桥"]
tags: [建筑参数, Web3D]
---
# 赵州桥

中国 · 河北赵县 · 隋代

敞肩单孔石拱桥。赵县政府公布了主孔净跨、矢高、桥面宽度、两级腹拱净跨及并列拱券数量。

## 尺寸与口径

桥长沿局部 X 轴。净跨取两拱脚内缘间水平距离，矢高从拱脚连线量到拱腹最高点。腹拱位置、桥面线形及栏杆尺度按轮廓拟合。

下列参数块由模型直接读取。长度单位为米，角度单位为度。 `documented` 记录文献值，`design` 记录场景复原取值，数组从下至上排列。

```json
{
  "id": "zhaozhou",
  "name": "赵州桥",
  "unit": "m",
  "documented": {
    "length": 64.4,
    "span": 37.02,
    "rise": 7.23,
    "widthCenter": 9,
    "widthAtSpring": 9.6,
    "outerSpandrel": 3.81,
    "innerSpandrel": 2.85,
    "ribs": 28
  },
  "design": {
    "deckLift": 1.65,
    "smallArchHeight": 1.38,
    "railHeight": 0.92,
    "parapetSpacing": 2.2
  }
}
```

### 文献尺寸速查

| 项目 | 文献值 | 参数名 |
| --- | ---: | --- |
| 桥梁全长 | 64.4 米 | `length` |
| 主拱净跨 | 37.02 米 | `span` |
| 主拱矢高 | 7.23 米 | `rise` |
| 桥面中央宽度 | 9 米 | `widthCenter` |
| 拱脚处宽度 | 9.6 米 | `widthAtSpring` |
| 外侧腹拱净跨 | 3.81 米 | `outerSpandrel` |
| 内侧腹拱净跨 | 2.85 米 | `innerSpandrel` |
| 并列拱券数 | 28 | `ribs` |

## 放样顺序

1. 由 R = L²/(8f) + f/2 计算主拱圆半径，在跨中左右镜像采样拱腹。
2. 主拱两肩各留下两个贯通小拱。桥面自中央向两端缓降，沿宽度方向在拱腹表达并列石券。
3. 结构预览以桥面、扶栏、完整贯穿的五个孔洞为辨识特征。桥墩埋深、石材损伤不在记录中。

## 文献

- [赵县人民政府 · 赵州桥](https://www.zhaoxian.gov.cn/columns/7558c04f-250e-4c72-a91c-425e1b5a8a17/202306/26/9c718990-9c93-471a-9e27-20c31de59149.html)

[[00-工作台|返回工作台]] · [旋转查看此模型](https://aevumworks.github.io/webGameLab/architecture/?model=zhaozhou)
