# webGameLab · 开源建筑

[Aevum](https://github.com/aevumworks) 用 Web 3D 程序建模制作的可游览场景，共三期。

| 期数 | 作品与源码 | 游览路线 | 在线体验 |
| --- | --- | --- | --- |
| 第一期 | [科隆大教堂](scenes/001-cologne-cathedral/) | 从西门广场进入中殿，沿柱廊走向三王圣龛。 | [进入场景](https://aevumworks.github.io/webGameLab/scenes/001-cologne-cathedral/) |
| 第二期 | [埃及金字塔](scenes/002-egyptian-pyramids/) | 从吉萨高原的阿努比斯展庭出发，沿石路走向金字塔北入口。 | [进入场景](https://aevumworks.github.io/webGameLab/scenes/002-egyptian-pyramids/) |
| 第三期 | [哈尔的移动城堡](scenes/003-howls-moving-castle/) | 在荒地驾驶城堡，登上舷梯，穿过炉火房的四色门前往港口。 | [进入场景](https://aevumworks.github.io/webGameLab/scenes/003-howls-moving-castle/) |

## 目录与本地游览

三期源码位于 [scenes/](scenes/)，目录前缀 001、002、003 对应发布顺序。各期的 index.html 是游览入口，films/ 收录该期摄影程序。[architecture/](architecture/) 提供三期建筑的模型预览，[vendor/](vendor/) 存放共用渲染库。

在仓库根目录运行 `node tools/preview.mjs 4182`，打开 [本机目录](http://127.0.0.1:4182/)。也可直接访问 [在线作品目录](https://aevumworks.github.io/webGameLab/)。

原创代码采用 [MIT 许可证](LICENSE)。第三方引擎与参考资料保留原署名，见 [Three.js 许可证](vendor/three-r160/LICENSE) 和 [科隆参考资料](scenes/001-cologne-cathedral/references/)。
