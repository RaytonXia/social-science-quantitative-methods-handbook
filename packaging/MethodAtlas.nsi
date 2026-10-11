; -*- coding: utf-8 -*-
Unicode true
!include "MUI2.nsh"
!include "x64.nsh"
!include "WinVer.nsh"
!include "FileFunc.nsh"
!include "LogicLib.nsh"

!define APPNAME "社会科学量化方法自学图谱"
!define RELEASE "社会科学量化方法自学图谱_v1.0"
!define EXENAME "${RELEASE}.exe"
!define APPID "MethodAtlas.Quantitative.1"
!define PAYLOAD "..\dist\${RELEASE}"

Name "${APPNAME} v1.0"
OutFile "..\dist\${RELEASE}_Setup.exe"
InstallDir "$LOCALAPPDATA\Programs\MethodAtlas"
InstallDirRegKey HKCU "Software\MethodAtlas\Installer" "InstallDir"
RequestExecutionLevel user
SetCompressor /SOLID lzma
SetCompressorDictSize 32
SetDatablockOptimize on
CRCCheck on
ManifestDPIAware true
BrandingText "METHOD ATLAS · 从问题出发，回到证据。"
VIProductVersion "1.0.0.0"
VIAddVersionKey /LANG=2052 "ProductName" "${APPNAME}"
VIAddVersionKey /LANG=2052 "FileDescription" "${APPNAME} v1.0 安装程序"
VIAddVersionKey /LANG=2052 "FileVersion" "1.0.0.0"
VIAddVersionKey /LANG=2052 "ProductVersion" "1.0"
VIAddVersionKey /LANG=2052 "LegalCopyright" "各内置资料的版权归原作者所有"
!define MUI_ICON "${PAYLOAD}\atlas.ico"
!define MUI_UNICON "${PAYLOAD}\atlas.ico"
!define MUI_ABORTWARNING
!define MUI_COMPONENTSPAGE_TEXT_TOP "安装完整应用与 73 份离线读物。学习记录保存在独立的本机目录中。"
!insertmacro MUI_PAGE_COMPONENTS
!define MUI_DIRECTORYPAGE_TEXT_TOP "选择程序位置。请关闭正在运行的本软件后再安装；原来的学习记录会继续保留。"
!insertmacro MUI_PAGE_DIRECTORY
!insertmacro MUI_PAGE_INSTFILES
!define MUI_FINISHPAGE_TITLE "安装完成"
!define MUI_FINISHPAGE_TEXT "现在可以从开始菜单打开图谱。方法词典、学习引导和内置读物均可离线使用。"
!define MUI_FINISHPAGE_RUN "$INSTDIR\${EXENAME}"
!define MUI_FINISHPAGE_RUN_TEXT "打开图谱"
!insertmacro MUI_PAGE_FINISH
!define MUI_UNCONFIRMPAGE_TEXT_TOP "卸载程序文件，保留学习笔记、收藏、阅读位置和课程草稿。"
!insertmacro MUI_UNPAGE_CONFIRM
!insertmacro MUI_UNPAGE_INSTFILES
!insertmacro MUI_LANGUAGE "SimpChinese"

Var QAMode
Var InstallKey
Var UninstallKey
Var ShortcutDir
Var DesktopLink
Var RuntimeVersion

Function .onInit
  SetShellVarContext current
  SetRegView 64
  ${IfNot} ${RunningX64}
    MessageBox MB_OK|MB_ICONSTOP "此版本需要 64 位 Windows 10 或 Windows 11。" /SD IDOK
    Abort
  ${EndIf}
  ${IfNot} ${AtLeastWin10}
    MessageBox MB_OK|MB_ICONSTOP "此版本需要 Windows 10 或 Windows 11。" /SD IDOK
    Abort
  ${EndIf}
  ReadRegDWORD $0 HKLM "SOFTWARE\Microsoft\NET Framework Setup\NDP\v4\Full" "Release"
  ${If} $0 < 394802
    MessageBox MB_OK|MB_ICONSTOP "需要 .NET Framework 4.6.2 或更高版本。请先通过 Windows 更新安装，再重新运行本安装包。" /SD IDOK
    Abort
  ${EndIf}
  StrCpy $QAMode "0"
  ${GetParameters} $0
  ClearErrors
  ${GetOptions} $0 "/QA" $1
  ${IfNot} ${Errors}
    StrCpy $QAMode "1"
  ${EndIf}
  StrCpy $InstallKey "Software\MethodAtlas\Installer"
  StrCpy $UninstallKey "Software\Microsoft\Windows\CurrentVersion\Uninstall\MethodAtlas"
  ${If} $QAMode == "1"
    StrCpy $InstallKey "Software\MethodAtlas\InstallerQA"
    StrCpy $UninstallKey "Software\Microsoft\Windows\CurrentVersion\Uninstall\MethodAtlas.QA"
  ${EndIf}
FunctionEnd

Function .onVerifyInstDir
  IfFileExists "$INSTDIR\*.*" 0 folder_valid
  ReadINIStr $0 "$INSTDIR\installation.ini" "Install" "AppId"
  StrCmp $0 "${APPID}" folder_valid
  ; A portable copy of this exact product can be upgraded in place.
  IfFileExists "$INSTDIR\${EXENAME}" folder_valid
  Abort
  folder_valid:
FunctionEnd

Function ReadRuntime
  StrCpy $RuntimeVersion ""
  SetRegView 32
  ReadRegStr $RuntimeVersion HKLM "Software\Microsoft\EdgeUpdate\Clients\{F3017226-FE2A-4295-8BDF-00C3A9A7E4C5}" "pv"
  ${If} $RuntimeVersion == ""
  ${OrIf} $RuntimeVersion == "0.0.0.0"
    ReadRegStr $RuntimeVersion HKCU "Software\Microsoft\EdgeUpdate\Clients\{F3017226-FE2A-4295-8BDF-00C3A9A7E4C5}" "pv"
  ${EndIf}
  SetRegView 64
  ${If} $RuntimeVersion == ""
  ${OrIf} $RuntimeVersion == "0.0.0.0"
    ReadRegStr $RuntimeVersion HKCU "Software\Microsoft\EdgeUpdate\Clients\{F3017226-FE2A-4295-8BDF-00C3A9A7E4C5}" "pv"
  ${EndIf}
FunctionEnd

Section "应用与完整离线资料（必需）" Main
  SectionIn RO
  Call ReadRuntime
  ${If} $RuntimeVersion == ""
  ${OrIf} $RuntimeVersion == "0.0.0.0"
    MessageBox MB_YESNO|MB_ICONQUESTION "这台电脑缺少 Microsoft Edge WebView2。是否现在使用微软安装程序联网安装该运行组件？选择‘否’将停止安装。" /SD IDNO IDYES install_runtime
    Abort
    install_runtime:
    InitPluginsDir
    SetOutPath "$PLUGINSDIR"
    File "${PAYLOAD}\runtime\MicrosoftEdgeWebview2Setup.exe"
    ExecWait '"$PLUGINSDIR\MicrosoftEdgeWebview2Setup.exe" /silent /install' $0
    Call ReadRuntime
    ${If} $RuntimeVersion == ""
    ${OrIf} $RuntimeVersion == "0.0.0.0"
      MessageBox MB_OK|MB_ICONSTOP "WebView2 尚未安装成功。请检查网络，或从 Microsoft Edge WebView2 官方网站安装后重试。应用文件尚未写入。" /SD IDOK
      Abort
    ${EndIf}
  ${EndIf}
  SetOverwrite on
  !include "payload-install.nsh"
  SetOutPath "$INSTDIR"
  WriteINIStr "$INSTDIR\installation.ini" "Install" "AppId" "${APPID}"
  WriteINIStr "$INSTDIR\installation.ini" "Install" "QAMode" "$QAMode"
  WriteUninstaller "$INSTDIR\Uninstall.exe"
  WriteRegStr HKCU "$InstallKey" "InstallDir" "$INSTDIR"
  WriteRegStr HKCU "$UninstallKey" "DisplayName" "${APPNAME}"
  WriteRegStr HKCU "$UninstallKey" "DisplayVersion" "1.0"
  WriteRegStr HKCU "$UninstallKey" "InstallLocation" "$INSTDIR"
  WriteRegStr HKCU "$UninstallKey" "UninstallString" '$\"$INSTDIR\Uninstall.exe$\"'
  WriteRegStr HKCU "$UninstallKey" "QuietUninstallString" '$\"$INSTDIR\Uninstall.exe$\" /S'
  WriteRegStr HKCU "$UninstallKey" "DisplayIcon" "$INSTDIR\${EXENAME}"
  WriteRegDWORD HKCU "$UninstallKey" "NoModify" 1
  WriteRegDWORD HKCU "$UninstallKey" "NoRepair" 1
  ${GetSize} "$INSTDIR" "/S=0K" $0 $1 $2
  WriteRegDWORD HKCU "$UninstallKey" "EstimatedSize" $0
  StrCpy $ShortcutDir "$SMPROGRAMS\${APPNAME}"
  StrCpy $DesktopLink "$DESKTOP\${APPNAME}.lnk"
  ${If} $QAMode == "1"
    StrCpy $ShortcutDir "$INSTDIR\qa-shortcuts"
    StrCpy $DesktopLink "$INSTDIR\qa-desktop.lnk"
  ${EndIf}
  CreateDirectory "$ShortcutDir"
  CreateShortcut "$ShortcutDir\${APPNAME}.lnk" "$INSTDIR\${EXENAME}" "" "$INSTDIR\atlas.ico"
  CreateShortcut "$ShortcutDir\卸载.lnk" "$INSTDIR\Uninstall.exe"
SectionEnd

Section /o "创建桌面快捷方式" Desktop
  CreateShortcut "$DesktopLink" "$INSTDIR\${EXENAME}" "" "$INSTDIR\atlas.ico"
SectionEnd

Function un.onInit
  SetShellVarContext current
  SetRegView 64
  ReadINIStr $0 "$INSTDIR\installation.ini" "Install" "AppId"
  ${If} $0 != "${APPID}"
    MessageBox MB_OK|MB_ICONSTOP "无法确认安装目录，已停止卸载。" /SD IDOK
    Abort
  ${EndIf}
  ReadINIStr $QAMode "$INSTDIR\installation.ini" "Install" "QAMode"
  StrCpy $InstallKey "Software\MethodAtlas\Installer"
  StrCpy $UninstallKey "Software\Microsoft\Windows\CurrentVersion\Uninstall\MethodAtlas"
  StrCpy $ShortcutDir "$SMPROGRAMS\${APPNAME}"
  StrCpy $DesktopLink "$DESKTOP\${APPNAME}.lnk"
  ${If} $QAMode == "1"
    StrCpy $InstallKey "Software\MethodAtlas\InstallerQA"
    StrCpy $UninstallKey "Software\Microsoft\Windows\CurrentVersion\Uninstall\MethodAtlas.QA"
    StrCpy $ShortcutDir "$INSTDIR\qa-shortcuts"
    StrCpy $DesktopLink "$INSTDIR\qa-desktop.lnk"
  ${EndIf}
FunctionEnd

Section "Uninstall"
  ; Remove only names from this package. Do not touch the separate user profile.
  !include "payload-uninstall.nsh"
  Delete "$ShortcutDir\${APPNAME}.lnk"
  Delete "$ShortcutDir\卸载.lnk"
  RMDir "$ShortcutDir"
  Delete "$DesktopLink"
  Delete "$INSTDIR\installation.ini"
  Delete "$INSTDIR\Uninstall.exe"
  DeleteRegKey HKCU "$UninstallKey"
  DeleteRegKey HKCU "$InstallKey"
  RMDir "$INSTDIR"
SectionEnd
