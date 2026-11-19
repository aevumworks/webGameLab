# 科隆大教堂 · Kölner Dom

德国科隆 · 哥特式主教座堂 · 1248 年动工，1880 年竣工。[UNESCO 世界遗产档案](https://whc.unesco.org/en/list/292/)

## 尺度口径

| 构件 | 实物尺寸 | 模型中如何使用 |
| --- | ---: | --- |
| 外部总长 / 最大宽度 | 144.58 / 86.25 m | 从西端到最东放射礼拜堂，最大宽度取横厅南北两端 |
| 西立面 / 横厅端立面宽 | 61.54 / 39.95 m | 双塔立面与横厅正面分别放样 |
| 长堂内部总宽 | 45.19 m | 覆盖中殿及四条侧廊的内宽 |
| 中殿 / 侧廊拱顶净高 | 43.35 / 19.80 m | 地坪到对应拱顶顶点 |
| 南塔 / 北塔高 | 157.22 / 157.18 m | 分别控制两座塔的尖顶 |
| 交叉部小塔 / 横厅端立面高 | 109.12 / 69.95 m | 小塔顶点和端部山墙高度 |
| 长堂屋脊高 | 61.10 m | 欧盟 Nano-Cathedral 建筑研究表中的屋脊值 |

前六项采用科隆总主教座堂公布的尺寸。早期研究与现行表的双塔高度略有出入，模型采用现行官方表。[教堂官方尺寸表](https://www.koelner-dom.de/erleben/der-dom-in-zahlen) · [Nano-Cathedral 原始研究 PDF](https://www.nanocathedral.eu/wp-content/uploads/2017/02/Nanocathedral-D1.1-Document-on-historical-architectural-architectural-environmental-knowledge-of-the-buildings-min.pdf)

## 图纸与推导

[平面图](https://commons.wikimedia.org/wiki/File:Plan.cathedrale.Cologne.png)用来确定五廊、交叉部、柱距和七座放射小礼拜堂。扫描图西端约 y=920、东端约 y=36，按 144.58 米换算，比例约为 0.164 米/像素。柱网取柱心，扫描和读图偏差约 0.3–0.7 米。以西面中央入口为原点，向东为负 Z，向南为正 X，Y 表示高程。

[西立面 F 图](https://commons.wikimedia.org/wiki/File:Fassadenplan_F_vom_K%C3%B6lner_Dom.jpg)用于比对三道门廊、中段花窗、钟楼层与镂空八角尖塔。[1859 年唱诗席横剖面](https://commons.wikimedia.org/wiki/File:Jahrbuch_MZK_Band_03_-_Gew%C3%B6lbesystem_-_Fig_75_Chordurchschnitt_des_Domes_zu_C%C3%B6ln_-_S%C3%BCdseite.jpg)用于分辨两层飞扶壁、束柱、侧廊拱券与高侧窗。三份缩览图和原始来源存于[本期素材目录](https://github.com/aevumworks/webGameLab/tree/main/scenes/001-cologne-cathedral/references)。

两张实景摄影用于核对西立面和中殿。西立面照片由 Yair-haklai 拍摄，中殿轴线照片由 Allie_Caulfield 拍摄。原图、许可和加工说明随项目保存。[素材清单和缩览](https://github.com/aevumworks/webGameLab/tree/main/scenes/001-cologne-cathedral/references)

## 渲染参考

砂岩与木材使用 Three.js 标准材质，砂岩纹理依据世界坐标生成。不同石块的接缝、明度和风化通过着色器绘制，五种彩窗以固定随机种子生成。建筑固定，天光切换时更新阴影图，静止时保留已渲染的画面。[Three.js 标准材质](https://threejs.org/docs/pages/MeshStandardMaterial.html) · [Three.js 阴影](https://threejs.org/manual/en/shadows.html)

## 程序参数

`documented` 为文献尺寸。 `design` 中的柱网轴线、跨位和礼拜堂数量来自读图，起拱线、窗槛、塔段分界和人眼高度为游览复原取值。所有线性尺寸单位为米，数组中的柱列编号从零开始。

```json
{
  "id": "cologne",
  "name": "科隆大教堂",
  "unit": "m",
  "documented": {
    "length": 144.58,
    "totalWidth": 86.25,
    "westWidth": 61.54,
    "insideWidth": 45.19,
    "transeptFacadeWidth": 39.95,
    "transeptFacadeHeight": 69.95,
    "southTower": 157.22,
    "northTower": 157.18,
    "crossingTurret": 109.12,
    "naveVault": 43.35,
    "aisleVault": 19.8,
    "ridge": 61.1,
    "shrine": {"width": 1.10, "length": 2.20, "height": 1.53}
  },
  "design": {
    "rowZ": [
      -4.8,
      -13.7,
      -22.6,
      -31.6,
      -39.2,
      -46.4,
      -54,
      -61.5,
      -69.8,
      -85.5,
      -93.7,
      -101.4,
      -109.6,
      -117.1
    ],
    "halfNave": 7.24,
    "midAisle": 15.11,
    "crossingBays": [
      8,
      9
    ],
    "transeptOuterRows": [
      7,
      10
    ],
    "radiatingChapels": 7,
    "naveSpring": 29.4,
    "aisleSpring": 12.4,
    "arcadePeak": 19.25,
    "triforiumSill": 21.65,
    "clerestorySill": 27.1,
    "clerestoryHead": 39.7,
    "towerCenters": 15.955,
    "towerDepth": 20.8,
    "upperBelfry": 77.5,
    "spireBase": 99,
    "eyeHeight": 1.66
  }
}
```

石材采用 Rob Tuytel 的 CC0 砂岩实物扫描，向世界坐标投射颜色、法线和粗糙度，叠加有尺度的接缝与风化。两套预过滤天空环境分别照亮晴日和暮色，彩窗对石地的彩色投射属于实时近似。石料依据科隆大教堂营造工坊的历史材料说明选择。[扫描原件](https://polyhaven.com/a/large_sandstone_blocks) · [科隆大教堂营造工坊](https://www.koelner-dombauhuette.de/bauerhalt/gewerke/stein) · [环境贴图技术](https://threejs.org/docs/pages/PMREMGenerator.html)

## 街区配准与陈设

从 Geobasis NRW 的 CityGML 瓦片 32/356/5645 提取大教堂两座塔尖平面位置。塔心间距约 31.91 米，模型中轴距各塔 15.955 米。西门局部坐标原点采用 ETRS89 / UTM 32N 的 E 356477.59、N 5645284.27，DGM1 西门地坪约 55.10 米。室内沿用官方建筑尺寸。城市底模纳入 270 栋建筑的 7,898 个实测数据表面，4 米间距采样原始 1 米地形。周边建筑墙面与屋顶来自 LoD2，屋顶位置对应正射航片，立面精度逐项记录。[德国官方建筑数据](https://data.gov.de/suche/daten/3d-gebaudemodell-nw-lod28b9df) · [数据和许可](https://github.com/aevumworks/webGameLab/tree/main/scenes/001-cologne-cathedral/references)

Domforum 沿街楼层参考现场摄影，窗格纹理由去除行人与文字的照片裁片透视校正而成。博物馆、车站与街屋保留测绘体量，其他窗洞、檐饰、树木和街具按实景参照放样。色彩、门窗逐扇形状与街具位置存在复原取值。建筑正门广场、北侧车站和东侧博物馆均有独立参观点。

三王圣龛长 2.20 米、宽 1.10 米、高 1.53 米，位于高祭坛后方。双层拱龛、鎏金轮廓和珐琅装饰以几何重建，人物浮雕按游览距离概括。[科隆旅游局尺寸](https://www.koelntourismus.de/kunst-kultur/sehenswuerdigkeiten/koelner-dom/innenraum) · [教堂圣龛档案](https://www.koelner-dom.de/kunstwerke/dreikoenigenschrein)

## 放样顺序

1. 按中轴、主柱排、第二柱排及外墙线，放样五廊纵向柱网，在交叉部留出横厅。
2. 按剖面分别生成束柱、尖拱券、三廊层、高侧窗及四分肋架拱顶。将双层飞扶壁连接到外侧扶壁墩。
3. 西端建三座门廊和双塔，在八角肋之间留下开放的菱形塔身。东端由中央唱诗席、回廊及七座放射礼拜堂组成。
4. 彩窗使用自绘的程序玻璃纹样。南横厅参考里希特窗的彩色方格语言，采用独立排列。圣龛及石雕按可辨轮廓简化。[南横厅窗官方档案](https://www.koelner-dom.de/kunstwerke/suedquerhausfenster)

[[WGL-003 科隆大教堂验收]] · [[00-工作台|返回工作台]]
