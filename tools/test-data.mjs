import {
  describeWorkbook,
  getSheetInfo,
  getSheetRows
} from "./workbook-query.mjs";

console.log(
  await describeWorkbook()
);

console.log(
  await getSheetInfo(
    "StrataEnrolments"
  )
);

const rows =
  await getSheetRows(
    "StrataEnrolments"
  );

console.log(
  rows.slice(0, 3)
);