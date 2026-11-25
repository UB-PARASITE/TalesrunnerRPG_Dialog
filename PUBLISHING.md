# 發布至 UB-PARASITE/TalesrunnerRPG_Dialog

目標 repository：<https://github.com/UB-PARASITE/TalesrunnerRPG_Dialog>

## Windows

1. 安裝 Git for Windows，並確認已能對此 repository push。
2. 解壓縮完整專案 ZIP。
3. 在解壓後的 `TR-Dialog-Research` 資料夾開啟 PowerShell。
4. 執行：

   ```powershell
   powershell -ExecutionPolicy Bypass -File .\\publish.ps1
   ```

## macOS / Linux

在專案根目錄執行：

```bash
bash ./publish.sh
```

腳本會先 clone 已建立的遠端 repository，再將本專案完整複製到 clone、commit 並 push 至 `main`。這可以處理遠端已經有初始 README commit 的情況，不會產生 unrelated histories。

## 啟用 Pages（只需設定一次）

進入 repository 的 **Settings → Pages → Build and deployment → Source**，選擇 **GitHub Actions**。之後每次 push 到 `main` 都會觸發部署。

## 驗證

前往 **Actions**，確認 `Deploy static site to GitHub Pages` 成功。預期網址：

<https://ub-parasite.github.io/TalesrunnerRPG_Dialog/>

## 公開資料範圍

資料集保留流程所需的結構 metadata 與資源 Key，不包含本地化劇情原文、遊戲二進位檔或原始美術／音訊資產。
