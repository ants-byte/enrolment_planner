#Requires AutoHotkey v2.0
#SingleInstance Force

; Run with AutoHotkey v2 while Strata is open.
; ExportMode: "keyboard" uses Tab, Shift+F10, L, Enter.
; "coordinates" uses the report's client area at 200, 470.
ExportMode := "keyboard"
ResultsWaitMs := 3000 ; Increase if the report takes longer to load.

SetTitleMatchMode(2)
SetKeyDelay(100, 50)
CoordMode("Mouse", "Client")

try {
    MainTitle := "Strata MP Production Horizon - Melbourne Polytechnic"
    ReportTitle := "Class Enrolment Listing Reports"
    MainHwnd := WinExist(MainTitle)
    if !MainHwnd
        throw Error("Open Strata before running this script.")

    ; Avoid entering criteria into a previously opened report in an unknown state.
    if WinExist(ReportTitle)
        throw Error("Close the existing Class Enrolment Listing Reports window, then rerun.")

    WinActivate("ahk_id " MainHwnd)
    if !WinWaitActive("ahk_id " MainHwnd, , 10)
        throw Error("Could not activate Strata.")

    SendEvent("!a")
    Sleep(300)
    SendEvent("{Down}{Right}re{Enter}")

    ReportHwnd := WinWait(ReportTitle, , 20)
    if !ReportHwnd
        throw Error("The Class Enrolment Listing Reports window did not open.")
    Report := "ahk_id " ReportHwnd
    WinActivate(Report)
    if !WinWaitActive(Report, , 10)
        throw Error("Could not activate the report window.")
    Sleep(500)

    ; Focus the first supplied edit control, then follow the Search tab order.
    FirstEdit := "WindowsForms10.EDIT.app.0.3ce0bb8_r6_ad13"
    ControlFocus(FirstEdit, Report)
    SendEvent("^a")
    SendText("BIT105")
    SendEvent("{Tab}^a")
    SendText("BIT372")
    SendEvent("{Tab 2}^a")
    SendText("SS")
    SendEvent("{Tab}^a")
    SendText("SS")

    FindButton := "WindowsForms10.BUTTON.app.0.3ce0bb8_r6_ad123"
    ControlFocus(FindButton, Report)
    SendEvent("{Enter}")

    ; Assumes Find selects Result and leaves focus as described.
    Sleep(ResultsWaitMs)
    if !WinActive(Report)
        throw Error("Report lost focus. Export stopped.")

    if ExportMode = "keyboard" {
        SendEvent("{Tab}+{F10}")
        Sleep(400)
        SendEvent("l{Enter}")
    } else if ExportMode = "coordinates" {
        WinRestore(Report)
        WinMove(, , 631, 791, Report)
        Sleep(300)
        Click(200, 470, "Right")
        Sleep(400)
        SendEvent("{Down}{Enter}") ; First context-menu item: Send list to Excel.
    } else {
        throw Error("Unknown ExportMode: " ExportMode)
    }
} catch as err {
    MsgBox(err.Message, "StrataClassEnrolments_SendToExcel", "Icon!")
    ExitApp(1)
}

; Emergency stop while this script is running.
Esc::ExitApp()
