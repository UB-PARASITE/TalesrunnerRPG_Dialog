# TalesrunnerRPG Dialog Research

Unity / IL2CPP Dialog 資料與 `PageDialog` 分支流程研究，附 GitHub Pages 靜態檢視器。

- Repository: https://github.com/UB-PARASITE/TalesrunnerRPG_Dialog
- Pages: https://ub-parasite.github.io/TalesrunnerRPG_Dialog/（啟用 Pages 並完成 Actions 部署後）

## 功能

- 以 Dialog ID、Order、Type、Text resource key 搜尋 `DictDialog` 記錄。
- 依 Chapter 索引找到對應 Dialog ID。
- 檢視 `ChoiceQuestion`、`ChoiceBranch1–5`、`ChoiceEnd` 與推導的執行區間。
- 查看 `DialogType1/2/3` enum 對照及 PageDialog 原生控制流程分析。

## 完整資料發布

完整資料與互動檢視器已整理於專案 ZIP。下載後解壓縮，在專案資料夾執行：

- Windows：`powershell -ExecutionPolicy Bypass -File .\\publish.ps1`
- macOS/Linux：`bash ./publish.sh`

腳本會 clone 本 repository、複製完整專案、commit 並 push 到 `main`，避免透過聊天附件反覆傳遞大型資料。請先安裝 Git，並確認本機 GitHub 認證可 push。

請使用本次對話提供的 `TR-Dialog-Research-project.zip`；解壓後執行上方發布腳本，即可將完整資料同步到此 repository。

## GitHub Pages

Repository → Settings → Pages → Build and deployment → Source 選擇 **GitHub Actions**。`.github/workflows/pages.yml` 會在 `main` 有 push 時自動部署。

## 公開內容範圍

公開結構化 metadata：ID、Order、portrait ID、Type enum、文字資源 Key、delay、strValue、分支索引與分析結果。**不包含** 韓文／英文劇情原文、遊戲二進位檔、AssetBundle、圖片或音訊。

## 權利聲明

本專案為非官方技術研究索引。遊戲名稱、角色及原始資產權利歸其權利人所有；本專案不代表開發商背書。
