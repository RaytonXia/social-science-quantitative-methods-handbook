$ErrorActionPreference = 'Stop'
$packagePath = Split-Path $PSScriptRoot -Parent
$compilerPath = Join-Path $env:WINDIR 'Microsoft.NET\Framework64\v4.0.30319\csc.exe'
$outputPath = Join-Path $packagePath ((Get-ChildItem -LiteralPath $packagePath -Filter '*.exe.config' | Select-Object -First 1).BaseName)
if (-not (Test-Path -LiteralPath (Join-Path $packagePath 'Atlas.Shell.dll'))) { throw 'Atlas.Shell.dll is required.' }
$stagingPath = Join-Path $PSScriptRoot 'Atlas.Launcher.exe'
& $compilerPath /nologo /target:winexe /platform:x64 /optimize+ /utf8output "/out:$stagingPath" "/win32icon:$(Join-Path $packagePath 'atlas.ico')" "/win32manifest:$(Join-Path $PSScriptRoot 'app.manifest')" /r:System.Windows.Forms.dll /r:System.Drawing.dll /r:System.Web.Extensions.dll /r:System.Net.Http.dll "/r:$(Join-Path $packagePath 'Microsoft.Web.WebView2.Core.dll')" "/r:$(Join-Path $packagePath 'Microsoft.Web.WebView2.WinForms.dll')" (Join-Path $PSScriptRoot 'AssistantHost.cs')
if ($LASTEXITCODE -ne 0) { throw 'C# build failed.' }
Move-Item -LiteralPath $stagingPath -Destination $outputPath -Force
Write-Output 'Windows assistant transport built successfully.'
