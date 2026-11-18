---
aliases: ["巴黎凯旋门"]
tags: [建筑参数, Web3D]
---
# 巴黎凯旋门

法国 · 巴黎 · 1806–1836 年

巴黎星形广场的四向凯旋门。法国国家古迹中心公布高 49.54 米、长 44.82 米、宽 22.21 米。两条正交筒拱中，横向的拱更矮。

## 尺寸与口径

长边沿主立面 X 轴，短边沿 Z 轴。主次拱开间、拱顶高度、檐带和浮雕包络为游戏模型比例估算。

下列参数块由模型直接读取。长度单位为米，角度单位为度。 `documented` 记录文献值，`design` 记录场景复原取值，数组从下至上排列。

```json
{
  "id": "arc-paris",
  "name": "巴黎凯旋门",
  "unit": "m",
  "documented": {
    "height": 49.54,
    "width": 44.82,
    "depth": 22.21
  },
  "design": {
    "mainSpan": 14.6,
    "mainCrown": 29.2,
    "sideSpan": 8.4,
    "sideCrown": 18.7,
    "corniceY": 40.4,
    "atticHeight": 7.8
  }
}
```

### 文献尺寸速查

| 项目 | 文献值 | 参数名 |
| --- | ---: | --- |
| 总高 | 49.54 米 | `height` |
| 主立面总宽 | 44.82 米 | `width` |
| 建筑总深 | 22.21 米 | `depth` |

## 放样顺序

1. 四墩按主、次拱净跨留出十字通道。在主次立面分别挤出半圆拱券，使通道贯穿。
2. 上部以连续檐口与矩形阁楼收束。浮雕位置用低浮起的体块标出。
3. 预览可以从门洞底部借光判断前后和左右是否真正贯通。人物浮雕、题铭与阶梯未采样。

## 文献

- [法国国家古迹中心 · 凱旋门教学资料，第 5 页](https://www.paris-arc-de-triomphe.fr/en/content/download/9819261/file/EN%20Learning%20Resource%20-%20The%20Arc%20de%20Triomphe.pdf?inLanguage=eng-GB&version=14)

[[00-工作台|返回工作台]] · [旋转查看此模型](https://aevumworks.github.io/webGameLab/architecture/?model=arc-paris)
