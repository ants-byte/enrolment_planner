// tools/test-workbook.mjs

import {
    listSheets,
    describeWorkbook
} from "./workbook-query.mjs";

console.log(
    await listSheets()
);

console.log(
    await describeWorkbook()
);