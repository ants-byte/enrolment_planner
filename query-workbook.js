import ExcelJS from "exceljs";

let workbookCache = null;
let workbookLoadedAt = 0;

export async function getWorkbook() {
    const now = Date.now();

    if (
        workbookCache &&
        now - workbookLoadedAt < 30000
    ) {
        return workbookCache;
    }

    const workbook = new ExcelJS.Workbook();

    await workbook.xlsx.readFile(
        "./Enrolment Data and Tracking.xlsx"
    );

    workbookCache = workbook;
    workbookLoadedAt = now;

    return workbook;
}