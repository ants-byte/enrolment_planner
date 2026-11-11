import {
    getSheetRows,
    getSheetInfo
} from "./workbook-query.mjs";

console.log(
    await getSheetInfo("StrataEnrolments")
);

const rows =
    await getSheetRows("StrataEnrolments");

console.log(
    "Rows:",
    rows.length
);

console.dir(
    rows.slice(0, 5),
    { depth: null }
);