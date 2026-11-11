// tools/workbook-query.mjs

import ExcelJS from "exceljs";
import path from "node:path";
import fs from "node:fs";




const WORKBOOK_FILE = path.resolve(
    "../Enrolment Data and Tracking.xlsx"
);

let workbookCache = null;
let workbookLoadedAt = 0;

const CACHE_MS = 30000;

const HEADER_ROWS = {
    StrataEnrolments: 5,
    Triage: 4
};
/**
 * Open workbook with simple caching.
 */
export async function getWorkbook() {
    const now = Date.now();

    if (
        workbookCache &&
        (now - workbookLoadedAt) < CACHE_MS
    ) {
        return workbookCache;
    }

    if (!fs.existsSync(WORKBOOK_FILE)) {
        throw new Error(
            `Workbook not found: ${WORKBOOK_FILE}`
        );
    }

    const workbook = new ExcelJS.Workbook();

    await workbook.xlsx.readFile(WORKBOOK_FILE);

    workbookCache = workbook;
    workbookLoadedAt = now;

    return workbook;
}

/**
 * Return all worksheet names.
 */
export async function listSheets() {
    const workbook = await getWorkbook();

    return workbook.worksheets.map(
        sheet => sheet.name
    );
}

/**
 * Find the first plausible header row.
 *
 * Heuristic:
 * - look at first 20 rows
 * - header row usually contains multiple text values
 */
function findHeaderRow(sheet) {
    for (let r = 1; r <= 20; r++) {
        const row = sheet.getRow(r);

        const values = row.values
            .slice(1)
            .filter(v => v !== null && v !== undefined && String(v).trim() !== "");

        if (values.length >= 3) {
            const textCount = values.filter(
                v => typeof v === "string"
            ).length;

            if (textCount >= 3) {
                return r;
            }
        }
    }

    return 1;
}

/**
 * Convert excel cell value to plain JS value.
 */
function cellValue(value) {
    if (value === null || value === undefined) {
        return null;
    }

    if (
        typeof value === "object" &&
        value !== null
    ) {
        if ("text" in value) return value.text;
        if ("result" in value) return value.result;
        if ("formula" in value || "sharedFormula" in value) return value.result ?? null;
    }

    return value;
}

/**
 * Read a sheet as an array of records.
 */
export async function getSheetRows(sheetName) {
    const workbook = await getWorkbook();

    const sheet =
        workbook.getWorksheet(sheetName);

    if (!sheet) {
        throw new Error(
            `Worksheet not found: ${sheetName}`
        );
    }

    const headerRowNumber =
        HEADER_ROWS[sheetName] ??
        findHeaderRow(sheet);

    const headerRow =
        sheet.getRow(headerRowNumber);

    const table = sheet.getTable(sheetName);
    const tableRange = table?.table.tableRef?.split(":");
    const firstColumn = tableRange
        ? sheet.getCell(tableRange[0]).col
        : 1;
    const lastColumn = tableRange
        ? sheet.getCell(tableRange[1] ?? tableRange[0]).col
        : sheet.columnCount;
    const lastRow = tableRange
        ? sheet.getCell(tableRange[1] ?? tableRange[0]).row
        : sheet.rowCount;
    const headers = Array.from(
        { length: lastColumn - firstColumn + 1 },
        (_, index) => String(headerRow.getCell(firstColumn + index).value ?? "").trim()
    );

    const rows = [];
    let missingResults = 0;
    let firstMissingCell;

    for (
        let r = headerRowNumber + 1;
        r <= lastRow;
        r++
    ) {
        const row = sheet.getRow(r);

        const record = {};
        let hasData = false;

        headers.forEach((header, index) => {
            if (!header) return;

            const cell = row.getCell(firstColumn + index);
            const rawValue = cell.value;
            if (rawValue && typeof rawValue === "object" &&
                ("formula" in rawValue || "sharedFormula" in rawValue) &&
                rawValue.result === undefined) {
                missingResults++;
                firstMissingCell ??= cell.address;
            }
            const value = cellValue(rawValue);

            if (
                value !== null &&
                value !== ""
            ) {
                hasData = true;
            }

            record[header] = value;
        });

        if (hasData) {
            rows.push(record);
        }
    }

    if (missingResults > 0) {
        console.warn(
            `${sheetName}: ${missingResults} formula cells have blank or unavailable saved results ` +
            `(first: ${firstMissingCell}); treating them as blank. ExcelJS cannot calculate formulas.`
        );
    }

    return rows;
}

/**
 * Quick metadata.
 */
export async function describeWorkbook() {
    const workbook = await getWorkbook();

    return workbook.worksheets.map(sheet => ({
        name: sheet.name,
        rows: sheet.rowCount,
        columns: sheet.columnCount
    }));
}

/**
 * Filter rows using exact matches.
 */
export async function querySheet(
    sheetName,
    filters = {}
) {
    const rows =
        await getSheetRows(sheetName);

    return rows.filter(row =>
        Object.entries(filters).every(
            ([field, expected]) =>
                String(row[field] ?? "").trim() ===
                String(expected).trim()
        )
    );
}
export async function getSheetInfo(sheetName) {
    const rows = await getSheetRows(sheetName);
    const workbook = await getWorkbook();
    const sheet = workbook.getWorksheet(sheetName);
    const range = sheet.getTable(sheetName)?.table.tableRef?.split(":");
    const firstColumn = range ? sheet.getCell(range[0]).col : 1;
    const lastColumn = range ? sheet.getCell(range[1] ?? range[0]).col : sheet.columnCount;
    const headerRow = sheet.getRow(HEADER_ROWS[sheetName] ?? findHeaderRow(sheet));

    return {
        sheet: sheetName,
        rowCount: rows.length,
        columns:
            rows.length > 0
                ? Object.keys(rows[0])
                : Array.from({ length: lastColumn - firstColumn + 1 }, (_, index) =>
                    String(headerRow.getCell(firstColumn + index).value ?? "").trim()
                ).filter(Boolean)
    };
}
