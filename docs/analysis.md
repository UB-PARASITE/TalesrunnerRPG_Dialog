# PageDialog 分支流程分析（繁體中文）

> 本專案保存 DictDialog 的結構化索引與 PageDialog 分支流程研究。
> 公開資料刻意不包含韓文／英文劇情原文、遊戲二進位檔或完整遊戲資產。

## 已整理的資料

- DictDialog 記錄：100,225
- 不同 Dialog ID：835
- ChoiceQuestion 區塊：490
- Choice 區塊執行索引：986
- Chapter 索引：10

## 資料欄位

`dict-dialogs.json` 保存 `id`、`order`、`portraitId`、三組 Dialog Type、`textKey`、`delay`、`strValue` 及來源行號。
不含 `text_ko`、`text_en` 等翻譯原文。

## 分支模型（已由所提供版本的 ARM64 原生程式碼分析）

- `PageDialog.Set(List<DictDialog>, bool)` 建立每組 Choice 的六槽分支索引。
- 槽位 0–4 分別記錄 ChoiceBranch1–5 的 Order；槽位 5 記錄 ChoiceEnd 的 Order。
- `_OnBranch(idx)` 根據目前 `branchNum` 及 0-based 選項索引取得分支標記位置。
- `_OnNext(short, int)` 進入所選分支，並在到達下一個分支邊界時跳至 ChoiceEnd 之後。
- 玩家選項索引 0 對應 ChoiceBranch1，索引 1 對應 ChoiceBranch2，依此類推。

## Chapter 與 Dialog ID 對照

- Chapter 1：Dialog ID 24
- Chapter 2：Dialog ID 126
- Chapter 3：Dialog ID 149
- Chapter 4：Dialog ID 175
- Chapter 5：Dialog ID 217
- Chapter 6：Dialog ID 241
- Chapter 7：Dialog ID 276
- Chapter 8：Dialog ID 312
- Chapter 9：Dialog ID 344（79 筆記錄，Order 0–78）

## 重要限制

以上是對本次分析之遊戲二進位版本的靜態分析結論。不同版本可能有差異；請以相同版本的 `libil2cpp.so` 與 Metadata 重新驗證。巢狀選項、Loop、EarlyNext、TopPriority 等特殊流程尚未完整驗證。

## 如何使用

直接開啟 GitHub Pages 首頁即可搜尋 Dialog ID、Order、Type、Text Key，檢視選項區塊與分支執行區間。

## 資料來源與權利說明

資料由使用者提供的 Unity AssetStudio Dump 及 IL2CPP 分析結果整理而來。此 repository 不包含遊戲二進位檔、立繪、音訊或大段本地化劇情文字。遊戲名稱、角色、原始資源及其智慧財產權仍屬原權利人。本專案是非官方技術研究索引，不代表與遊戲開發商有關聯或獲得其背書。
