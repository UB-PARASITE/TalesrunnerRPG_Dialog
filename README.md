# TalesrunnerRPG Dialog Research

Unity / IL2CPP Dialog 資料與 `PageDialog` 分支流程研究，附 GitHub Pages 靜態檢視器。

- Repository: https://github.com/UB-PARASITE/TalesrunnerRPG_Dialog
- Pages: https://ub-parasite.github.io/TalesrunnerRPG_Dialog/（啟用 Pages 並完成 Actions 部署後）

## 功能

- 以 Dialog ID、Order、Type、Text resource key 搜尋 `DictDialog` 記錄。
- 依 Chapter 索引找到對應 Dialog ID。
- 檢視 `ChoiceQuestion`、`ChoiceBranch1–5`、`ChoiceEnd` 與推導的執行區間。
- 查看 `DialogType1/2/3` enum 對照及 PageDialog 原生控制流程分析。

## 本機資料與發布

完整靜態檢視器所需資料位於 `data/`。解壓縮專案後，在專案根目錄執行：

- Windows：`powershell -ExecutionPolicy Bypass -File .\publish.ps1`
- macOS/Linux：`bash ./publish.sh`

發布腳本會 clone 本 repository、將整個專案複製到 clone、commit 並 push 到 `main`。這可避免透過聊天附件反覆傳遞大型資料檔。請先安裝 Git，並確認本機 GitHub 認證可 push 至此 repository。

## GitHub Pages

Repository → Settings → Pages → Build and deployment → Source 選擇 **GitHub Actions**。`.github/workflows/pages.yml` 會在 `main` 有 push 時自動部署。

## 公開內容範圍

本專案公開結構化 metadata：ID、Order、portrait ID、Type enum、文字資源 Key、delay、strValue、分支索引與分析結果。**不包含** 韓文／英文劇情原文、遊戲二進位檔、AssetBundle、圖片或音訊。

## 權利聲明

本專案為非官方技術研究索引。遊戲名稱、角色及原始資產權利歸其權利人所有；本專案不代表開發商背書。
