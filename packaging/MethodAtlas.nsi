; -*- coding: utf-8 -*-
Unicode true
!include "MUI2.nsh"
!include "x64.nsh"
!include "WinVer.nsh"
!include "FileFunc.nsh"
!include "LogicLib.nsh"

!define APPNAME "社会科学量化方法自学手册"
!define RELEASE "社会科学量化方法自学手册_v1.1.1"
!define EXENAME "${RELEASE}.exe"
!define APPID "MethodAtlas.Quantitative.1"
!define PAYLOAD "..\dist\${RELEASE}"

Name "${APPNAME} v1.1.1"
OutFile "..\dist\${RELEASE}_Setup.exe"
InstallDir "$LOCALAPPDATA\Programs\MethodAtlas"
InstallDirRegKey HKCU "Software\MethodAtlas\Installer" "InstallDir"
RequestExecutionLevel user
SetCompressor /SOLID zlib
SetDatablockOptimize on
CRCCheck on
ManifestDPIAware true
BrandingText "METHODS HANDBOOK · 从问题出发，回到证据。"
VIProductVersion "1.1.1.0"
VIAddVersionKey /LANG=2052 "ProductName" "${APPNAME}"
VIAddVersionKey /LANG=2052 "FileDescription" "${APPNAME} v1.1.1 安装程序"
VIAddVersionKey /LANG=2052 "FileVersion" "1.1.1.0"
VIAddVersionKey /LANG=2052 "ProductVersion" "1.1.1"
VIAddVersionKey /LANG=2052 "LegalCopyright" "各内置资料的版权归原作者所有"
!define MUI_ICON "${PAYLOAD}\atlas.ico"
!define MUI_UNICON "${PAYLOAD}\atlas.ico"
!define MUI_ABORTWARNING
!define MUI_COMPONENTSPAGE_TEXT_TOP "安装完整应用与 63 份离线读物。学习记录保存在独立的本机目录中。"
!insertmacro MUI_PAGE_COMPONENTS
!define MUI_DIRECTORYPAGE_TEXT_TOP "选择空文件夹或本软件的旧版目录。请先关闭手册，学习记录会保留。"
!define MUI_PAGE_CUSTOMFUNCTION_LEAVE ValidateInstallDir
!insertmacro MUI_PAGE_DIRECTORY
!insertmacro MUI_PAGE_INSTFILES
!define MUI_FINISHPAGE_TITLE "安装完成"
!define MUI_FINISHPAGE_TEXT "现在可以从开始菜单打开手册。方法词典、学习引导和内置读物均可离线使用。"
!define MUI_FINISHPAGE_RUN "$INSTDIR\${EXENAME}"
!define MUI_FINISHPAGE_RUN_TEXT "打开手册"
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
Var DirectoryAllowed

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

; A wildcard also matches '.' and '..' in an empty directory. Enumerate real
; entries instead. Validate on leaving the page so a rejected path gets a clear
; explanation rather than a silently disabled Install button.
Function CheckInstallDir
  Push $0
  Push $1
  StrCpy $DirectoryAllowed "1"
  ReadINIStr $0 "$INSTDIR\installation.ini" "Install" "AppId"
  StrCmp $0 "${APPID}" directory_checked
  ; Recognize legacy installed and portable editions by their full structure.
  IfFileExists "$INSTDIR\Atlas.Shell.dll" 0 directory_scan
  IfFileExists "$INSTDIR\app\index.html" 0 directory_scan
  IfFileExists "$INSTDIR\${EXENAME}" directory_checked
  IfFileExists "$INSTDIR\社会科学量化方法自学手册_v1.1.0.exe" directory_checked
  IfFileExists "$INSTDIR\社会科学量化方法自学手册_v1.0.2.exe" directory_checked
  IfFileExists "$INSTDIR\社会科学量化方法自学手册_v1.0.1.exe" directory_checked
  IfFileExists "$INSTDIR\社会科学量化方法自学图谱_v1.0.exe" directory_checked
  IfFileExists "$INSTDIR\社会科学量化方法学自学图谱.exe" directory_checked
  directory_scan:
  ClearErrors
  FindFirst $0 $1 "$INSTDIR\*.*"
  IfErrors directory_checked
  directory_entry:
  StrCmp $1 "" directory_close
  StrCmp $1 "." directory_next
  StrCmp $1 ".." directory_next
  StrCpy $DirectoryAllowed "0"
  Goto directory_close
  directory_next:
  ClearErrors
  FindNext $0 $1
  IfErrors directory_close
  Goto directory_entry
  directory_close:
  FindClose $0
  directory_checked:
  Pop $1
  Pop $0
FunctionEnd

Function ValidateInstallDir
  Call CheckInstallDir
  ${If} $DirectoryAllowed != "1"
    MessageBox MB_OK|MB_ICONEXCLAMATION "这个文件夹中已有其他文件，无法确认它是本软件的目录。$\r$\n$\r$\n请选择空文件夹，或在当前路径末尾加上 \MethodAtlas 后再点‘安装’。若要升级旧版，请选择包含旧版 EXE、Atlas.Shell.dll 和 app 文件夹的完整目录。$\r$\n$\r$\n现有文件没有改动。" /SD IDOK
    SetErrorLevel 2
    Abort
  ${EndIf}
  SetErrorLevel 0
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

Section "应用与内置原文（必需）" Main
  SectionIn RO
  ; Silent installations must pass the same directory protection as the wizard.
  Call ValidateInstallDir
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
  ; Remove only known superseded launchers; preserve the independent study profile.
  Delete "$INSTDIR\社会科学量化方法自学手册_v1.1.0.exe"
  Delete "$INSTDIR\社会科学量化方法自学手册_v1.1.0.exe.config"
  Delete "$INSTDIR\社会科学量化方法自学手册_v1.0.2.exe"
  Delete "$INSTDIR\社会科学量化方法自学手册_v1.0.2.exe.config"
  Delete "$INSTDIR\社会科学量化方法自学手册_v1.0.1.exe"
  Delete "$INSTDIR\社会科学量化方法自学手册_v1.0.1.exe.config"
  SetOutPath "$INSTDIR"
  WriteINIStr "$INSTDIR\installation.ini" "Install" "AppId" "${APPID}"
  WriteINIStr "$INSTDIR\installation.ini" "Install" "QAMode" "$QAMode"
  WriteUninstaller "$INSTDIR\Uninstall.exe"
  WriteRegStr HKCU "$InstallKey" "InstallDir" "$INSTDIR"
  WriteRegStr HKCU "$UninstallKey" "DisplayName" "${APPNAME}"
  WriteRegStr HKCU "$UninstallKey" "DisplayVersion" "1.1.1"
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
