$ErrorActionPreference = "Stop"
$source = $PSScriptRoot
$remote = "https://github.com/UB-PARASITE/TalesrunnerRPG_Dialog.git"
$temp = Join-Path ([System.IO.Path]::GetTempPath()) ("TalesrunnerRPG_Dialog_publish_" + [guid]::NewGuid().ToString("N"))

if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
  throw "Git is not installed. Install Git for Windows first: https://git-scm.com/download/win"
}

try {
  git clone $remote $temp
  if ($LASTEXITCODE -ne 0) { throw "git clone failed. Check network and repository access." }

  Get-ChildItem -LiteralPath $source -Force |
    Where-Object { $_.Name -ne ".git" } |
    ForEach-Object { Copy-Item -LiteralPath $_.FullName -Destination $temp -Recurse -Force }

  git -C $temp add -A
  if ($LASTEXITCODE -ne 0) { throw "git add failed." }

  $changes = git -C $temp status --porcelain
  if ($changes) {
    git -C $temp commit -m "Publish Dialog research explorer and datasets"
    if ($LASTEXITCODE -ne 0) { throw "git commit failed. Configure your Git user name and email." }
  } else {
    Write-Host "No file changes to publish."
  }

  git -C $temp push origin main
  if ($LASTEXITCODE -ne 0) { throw "git push failed. Check GitHub authentication and branch permissions." }

  Write-Host "Published successfully: https://github.com/UB-PARASITE/TalesrunnerRPG_Dialog"
  Write-Host "Pages: https://ub-parasite.github.io/TalesrunnerRPG_Dialog/"
  Write-Host "If Pages is not enabled yet, set Settings > Pages > Source > GitHub Actions."
}
finally {
  if (Test-Path $temp) { Remove-Item -LiteralPath $temp -Recurse -Force }
}
