# world.execute(me); — MV demo（00:00–00:20）

Mili《world.execute(me);》的同人 MV 试作。主角是提供的立绘（蓝发、黑色婚纱、捧花的 AI 少女），
风格为 **日本独立动画 × 实验性赛璐璐插画 × 复古计算机视觉**，歌词以等宽代码格式中英对照打出。

![分镜表](docs/storyboard.jpg)

## 创作思路

- **歌词＝源代码**：每句歌词是编辑器里的一行（行号 / 英文 / `// 中文注释` / 光标），关键词（PROTECTION、OBJECT CREATION…）作为常量高亮并从乱码中解码出现；中英文字符严格对齐在等宽网格上（汉字占两格）。
- **黑色婚纱＝婚礼与葬礼**：爱与「EXECUTION（执行 / 死刑）」的双关，贯穿全片的月亮取自立绘背景。
- **赛璐璐上色流程＝填参数**：「Fill in my data parameters」一段里，属性窗口每填一个颜色，线稿就铺上一层平涂，按下 `render()` 才完成上色。
- **伏笔**：棋盘上的 6 枚棋子是 6 个程序 `EIN / DOS / TROIS / NE / FEM / LIU.exe`，对应后段「一二三四五六」的删除；`world.add(you); // pending...`、`while (you.away) { me.wait(); }` 暗示使用者的离开。
- **首尾呼应**：以 CRT 开机亮线开场，以 CRT 关机收成一点结束。
- **节奏**：曲速实测 130 BPM（首拍 0.21s），所有剪辑点、闪光、落子、马赛克分级都卡在拍点 / 半拍上；角色动作「一拍二」（12fps）保留手绘动画的顿挫感。

## 目录

| 路径 | 内容 |
| --- | --- |
| `web/js/shots.js` | 12 个镜头的分镜，每个镜头都是时间 t 的纯函数 |
| `web/js/type.js` | 等宽代码排版、歌词时间轴（中英对照） |
| `web/js/post.js` | WebGL2 后期：CRT 曲面、色差、蓝色光晕、扫描线、故障切片、胶片颗粒 |
| `web/js/main.js` | 资源 / 字体加载、HUD（时间码、编辑器状态栏）、`MV.render(t)` |
| `render.mjs` | 无头 Chromium 逐帧渲染 + ffmpeg 合成音频 |
| `tools/prep_assets.py` | 从立绘生成图层：BiRefNet 抠图、Real-ESRGAN 4× 超分、线稿、7 色赛璐璐平涂分层、点云 |
| `web/assets/` | 已生成好的图层（可直接渲染） |

## 渲染

```bash
npm install                       # 字体 + playwright（使用本机已装的 Chromium）
# 需要 ffmpeg 在 PATH 中；歌曲音频不随仓库提供，传入原曲视频或音频文件即可
node render.mjs --audio "Mili-world.execute(me).mp4" --out out/demo.mp4
node render.mjs --stills 3.6,8.4,17.9   # 渲染单帧到 out/stills/
node render.mjs --serve                 # 浏览器实时预览：http://localhost:8123/web/index.html?play
```

输出：1920×1080 / 24fps / H.264 + AAC。时间轴以原曲第一个采样为 0 秒。

重新生成图层（一般不需要）：

```bash
pip install rembg onnxruntime opencv-python-headless pillow numpy scipy onnx
curl -LO https://github.com/xinntao/Real-ESRGAN/releases/download/v0.2.2.4/RealESRGAN_x4plus_anime_6B.pth
python3 tools/esrgan_to_onnx.py RealESRGAN_x4plus_anime_6B.pth .cache/anime6b.onnx
python3 tools/prep_assets.py tools/character_src.webp web/assets
```

音乐：Mili《world.execute(me);》。本仓库只包含 MV 画面的制作代码。
