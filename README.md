# 數數小書 · 1 至 20

ChemLab Starter **book 骨架**簡化版 → 中度智障數學數數。

## 本機開

```bash
cd ~/works/sen-count-book-1-20
python3 -m http.server 8765
# 開 http://127.0.0.1:8765/
```

或 VS Code Live Server 開 `index.html`（需 http，唔好 file:// 若 three 路徑有問題；而家 relative 通常 OK）。

## 結構（抄 ChemLab）

| 檔 | 角色 |
|---|---|
| `index.html` | shell + SEN lock CSS + HUD |
| `js/three.min.js` | Three r159 |
| `js/core.js` | `window.L` 引擎：render/cam/tween/sfx/say |
| `js/book.js` | 3D 書 + canvas 頁 + 水果 pop-up |
| `js/pages.js` | 封面 + 1–20 + 每5題 quiz + 完 |
| `js/main.js` | 流程 / N選1 / 粵語 TTS |

## 教學流

1. 封面 → 數字頁（大數 + 逐個彈水果 + 讀 1…N）
2. 5 / 10 / 15 / 20 後 **有幾多？** A/B/C/D 大圓標
3. 完頁

## SEN

- `100dvh` 無頁面滾動、禁右鍵、user-select:none
- 大掣、少字、粵 `zh-HK` speechSynthesis
- 錯再答（quiz 唔 skip）

## 之後可加

- 真實粵語 mp3 VO
- 主題換（星星／巴士／蘋果圖）
- 身份卡／紀錄
- GitHub Pages Push（等你講 Push）
