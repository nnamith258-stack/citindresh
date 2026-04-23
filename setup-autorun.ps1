# Setup-AutoRun.ps1
# This script adds the AgriSmart server to Windows Startup

$WorkingDir = "c:\Users\nnami_9itp2db\OneDrive\Desktop\basavaraj"
$BatchFile = Join-Path $WorkingDir "start-agrismart.bat"
$StartupFolder = [System.Environment]::GetFolderPath("Startup")
$ShortcutPath = Join-Path $StartupFolder "AgriSmart.lnk"

$WshShell = New-Object -ComObject WScript.Shell
$Shortcut = $WshShell.CreateShortcut($ShortcutPath)
$Shortcut.TargetPath = "cmd.exe"
$Shortcut.Arguments = "/c start /min $BatchFile"
$Shortcut.WorkingDirectory = $WorkingDir
$Shortcut.IconLocation = "shell32.dll, 21" # Wheat/Tree icon
$Shortcut.Save()

Write-Host "Success! AgriSmart will now run every time you start Windows." -ForegroundColor Green
Write-Host "Shortcut created in: $StartupFolder"
