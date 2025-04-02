/**
 * @OnlyCurrentDoc
 * Creates the 'Tasks' and 'Gantt Chart' sheets with necessary setup,
 * including helper columns on the Gantt sheet to avoid cross-sheet
 * conditional formatting limitations.
 */

// --- Configuration ---
const TASKS_SHEET_NAME = "Tasks";
const GANTT_SHEET_NAME = "Gantt Chart";
const NUM_TASK_ROWS = 50; // How many task rows to pre-format
const NUM_GANTT_COLUMNS = 90; // How many days/columns to pre-format in Gantt chart (approx 3 months)
const GANTT_HELPER_START_COL = 2; // Column B (1-based index) for Start Date helper
const GANTT_HELPER_END_COL = 3;   // Column C (1-based index) for End Date helper
const GANTT_DATE_START_COL = 4;   // Column D (1-based index) where the timeline dates will start
const GANTT_TASK_START_ROW = 3;   // Data starts below headers (Row 3)
const GANTT_DATE_ROW = 2;         // Row containing the dates in the Gantt Chart sheet
const HIDE_HELPER_COLUMNS = true; // Set to true to hide B & C after setup

// --- Formatting Options ---
const WEEKEND_COLOR = "#f3f3f3";         // Light gray for weekends
const TODAY_HIGHLIGHT_COLOR = "#fff2cc"; // Light yellow for Today rule background
const GANTT_BAR_COLOR = "#4a86e8";       // Default blue for Gantt bars
const DATE_FORMAT_TASKS = "yyyy-mm-dd";
const DATE_FORMAT_GANTT_CONTROL = "yyyy-mm-dd";
const DATE_FORMAT_GANTT_HEADER = "d"; // Day number, e.g., "15"
// --- End Configuration ---

/**
 * Creates a custom menu item in the spreadsheet UI when opened.
 */
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('Gantt Setup')
    .addItem('Setup/Reset Gantt Sheets', 'setupGanttChart')
    .addToUi();
}

/**
 * Main function to set up both sheets.
 * Run this function from the script editor or the custom menu.
 */
function setupGanttChart() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const ui = SpreadsheetApp.getUi();
  try {
    ss.toast('Starting Gantt Chart setup...');
    setupTasksSheet(ss);
    setupGanttSheet(ss);
    ui.alert('Success!', `Gantt Chart sheets ("${TASKS_SHEET_NAME}" and "${GANTT_SHEET_NAME}") have been set up successfully.`, ui.ButtonSet.OK);
    ss.toast('Setup complete.');
  } catch (e) {
    Logger.log(`Error setting up Gantt Chart: ${e}\nStack: ${e.stack}`);
    ui.alert('Error', `An error occurred during setup. Please check the logs (View > Logs).\nError: ${e.message}`, ui.ButtonSet.OK);
    ss.toast('Setup failed.');
  }
}

/**
 * Sets up the 'Tasks' sheet.
 * @param {Spreadsheet} ss The active spreadsheet object.
 */
function setupTasksSheet(ss) {
  Logger.log(`Setting up ${TASKS_SHEET_NAME}...`);
  let sheet = ss.getSheetByName(TASKS_SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(TASKS_SHEET_NAME, 0); // Insert as first sheet
    Logger.log(`Created sheet: ${TASKS_SHEET_NAME}`);
  } else {
    Logger.log(`Clearing existing sheet: ${TASKS_SHEET_NAME}`);
    sheet.clearContents();
    sheet.clearFormats();
    sheet.clearConditionalFormatRules();
    // Reset column/row dimensions if needed
    // sheet.unhideRow(sheet.getRange("1:1"));
  }

  // Freeze top row
  sheet.setFrozenRows(1);

  // Headers
  const headers = ["Task Name", "Owner", "Start Date", "End Date", "Duration (Days)", "Status", "Notes"];
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]).setFontWeight("bold").setHorizontalAlignment("center");

  // Set initial rows if needed (beyond default)
  if (sheet.getMaxRows() < NUM_TASK_ROWS + 1) {
      sheet.insertRowsAfter(sheet.getMaxRows(), NUM_TASK_ROWS + 1 - sheet.getMaxRows());
  }

  // Column Formatting & Validation (apply to sufficient rows)
  const dataRangeRows = Math.max(NUM_TASK_ROWS, sheet.getMaxRows() - 1);

  // Dates (C & D)
  sheet.getRange(2, 3, dataRangeRows, 2) // Columns C and D
       .setNumberFormat(DATE_FORMAT_TASKS)
       .setDataValidation(SpreadsheetApp.newDataValidation().requireDate().setAllowInvalid(false).build());

  // Duration (E)
  sheet.getRange(2, 5, dataRangeRows, 1).setNumberFormat("0"); // Column E

  // Status Dropdown (F)
  const statuses = ["Not Started", "In Progress", "Completed", "Blocked", "On Hold"];
  const statusRule = SpreadsheetApp.newDataValidation().requireValueInList(statuses, true).setAllowInvalid(false).build(); // true = show dropdown
  sheet.getRange(2, 6, dataRangeRows, 1).setDataValidation(statusRule); // Column F

  // Duration Formula in E2, autofill down
  const durationFormula = `=IF(AND(ISDATE(C2), ISDATE(D2), D2>=C2), D2-C2+1, "")`;
  if (dataRangeRows >= 1) {
      const durationCell = sheet.getRange("E2");
      durationCell.setFormula(durationFormula);
      if (dataRangeRows > 1) {
          const durationRange = sheet.getRange(2, 5, dataRangeRows, 1); // E2:E<end>
          durationCell.autoFill(durationRange, SpreadsheetApp.AutoFillSeries.DEFAULT_SERIES);
      }
  }

  // Adjust Column Widths
  sheet.setColumnWidth(1, 250); // Task Name
  sheet.setColumnWidth(2, 120); // Owner
  sheet.setColumnWidths(3, 2, 100); // Start/End Date
  sheet.setColumnWidth(5, 100); // Duration
  sheet.setColumnWidth(6, 110); // Status
  sheet.setColumnWidth(7, 300); // Notes

  // Add sample data for illustration (Optional)
  const sampleData = [
      ["Project Kickoff", "Alice", new Date(2024, 6, 15), new Date(2024, 6, 15), "", "Completed", "Initial meeting"],
      ["Gather Requirements", "Bob", new Date(2024, 6, 16), new Date(2024, 6, 22), "", "In Progress", "User stories"],
      ["Design Mockups", "Carol", new Date(2024, 6, 23), new Date(2024, 6, 31), "", "Not Started", ""],
      ["Development Phase 1", "Alice", new Date(2024, 7, 1), new Date(2024, 7, 14), "", "Not Started", "Core features"]
  ];
   // Check if sheet is empty before adding sample data
  if (sheet.getRange("A2").getValue() === "") {
       sheet.getRange(2, 1, sampleData.length, sampleData[0].length).setValues(sampleData);
       Logger.log(`Added sample data to ${TASKS_SHEET_NAME}.`);
  }


  Logger.log(`'${TASKS_SHEET_NAME}' sheet setup complete.`);
  SpreadsheetApp.flush(); // Apply changes
}


/**
 * Sets up the 'Gantt Chart' sheet with helper columns.
 * @param {Spreadsheet} ss The active spreadsheet object.
 */
function setupGanttSheet(ss) {
  Logger.log(`Setting up ${GANTT_SHEET_NAME}...`);
  let sheet = ss.getSheetByName(GANTT_SHEET_NAME);
  const requiredCols = GANTT_DATE_START_COL + NUM_GANTT_COLUMNS; // Total columns needed

  if (!sheet) {
    sheet = ss.insertSheet(GANTT_SHEET_NAME, 1); // Insert as second sheet
    Logger.log(`Created sheet: ${GANTT_SHEET_NAME}`);
    // Ensure enough columns exist in a new sheet
     if (sheet.getMaxColumns() < requiredCols) {
       sheet.insertColumnsAfter(sheet.getMaxColumns(), requiredCols - sheet.getMaxColumns());
     }
  } else {
    Logger.log(`Clearing existing sheet: ${GANTT_SHEET_NAME}`);
    sheet.clearContents();
    sheet.clearFormats();
    sheet.clearConditionalFormatRules();
    try { sheet.setFrozenRows(0); } catch (e) {}
    try { sheet.setFrozenColumns(0); } catch (e) {}
     // Unhide columns B & C if they were hidden before clearing
    try { sheet.unhideColumn(sheet.getRange(1, GANTT_HELPER_START_COL, 1, GANTT_HELPER_END_COL - GANTT_HELPER_START_COL + 1));} catch(e){}

     // Ensure enough columns exist after clearing
     if (sheet.getMaxColumns() < requiredCols) {
       sheet.insertColumnsAfter(sheet.getMaxColumns(), requiredCols - sheet.getMaxColumns());
     }
     // If columns B, C exist from previous run, delete them before inserting fresh ones
     // Note: This assumes B and C were the ONLY helper cols. Adjust if structure changed.
     const currentSecondColHeader = sheet.getRange(GANTT_DATE_ROW, GANTT_HELPER_START_COL).getValue();
     if (currentSecondColHeader === "Start" || currentSecondColHeader === "End") {
         Logger.log("Detected old helper columns, removing...");
         sheet.deleteColumns(GANTT_HELPER_START_COL, GANTT_HELPER_END_COL - GANTT_HELPER_START_COL + 1);
     }
  }

  // Insert Helper Columns (B and C)
  Logger.log(`Inserting helper columns at B and C.`);
  sheet.insertColumns(GANTT_HELPER_START_COL, GANTT_HELPER_END_COL - GANTT_HELPER_START_COL + 1);

  // Freeze Panes (Freeze Col A, Rows 1 & 2)
  sheet.setFrozenRows(GANTT_DATE_ROW);
  sheet.setFrozenColumns(1); // Freeze column A only

  // Set initial rows if needed
  if (sheet.getMaxRows() < NUM_TASK_ROWS + GANTT_TASK_START_ROW -1) {
      sheet.insertRowsAfter(sheet.getMaxRows(), NUM_TASK_ROWS + GANTT_TASK_START_ROW -1 - sheet.getMaxRows());
  }
  const dataRangeRows = Math.max(NUM_TASK_ROWS, sheet.getMaxRows() - GANTT_TASK_START_ROW + 1); // Rows for data/formulas


  // --- Setup Headers and Formulas ---

  // Column A Header (Task Name)
  sheet.getRange(GANTT_DATE_ROW, 1).setValue("Task Name").setFontWeight("bold").setHorizontalAlignment("center"); // A2

  // Helper Column Headers (B2, C2)
  sheet.getRange(GANTT_DATE_ROW, GANTT_HELPER_START_COL).setValue("Start").setFontWeight("bold").setHorizontalAlignment("center"); // B2
  sheet.getRange(GANTT_DATE_ROW, GANTT_HELPER_END_COL).setValue("End").setFontWeight("bold").setHorizontalAlignment("center"); // C2

  // Link Task Names from 'Tasks' sheet (A3 downwards)
  const taskLinkFormula = `=IF('${TASKS_SHEET_NAME}'!A2<>"", '${TASKS_SHEET_NAME}'!A2, "")`;
  const taskLinkCell = sheet.getRange(GANTT_TASK_START_ROW, 1); // A3
  taskLinkCell.setFormula(taskLinkFormula);
  if (dataRangeRows > 1) {
    const taskLinkRange = sheet.getRange(GANTT_TASK_START_ROW, 1, dataRangeRows, 1); // A3:A<end>
    taskLinkCell.autoFill(taskLinkRange, SpreadsheetApp.AutoFillSeries.DEFAULT_SERIES);
  }

  // Formulas for Helper Columns (Start Date in B, End Date in C)
  const taskLookupRange = `'${TASKS_SHEET_NAME}'!$A$2:$D`; // Range to search in Tasks sheet

  // Formula for Start Date (Column B, starting B3)
  const startFormula = `=IFERROR(VLOOKUP($A3, ${taskLookupRange}, 3, FALSE), "")`;
  const startHelperCell = sheet.getRange(GANTT_TASK_START_ROW, GANTT_HELPER_START_COL); // B3
  startHelperCell.setFormula(startFormula);
  const startHelperRange = sheet.getRange(GANTT_TASK_START_ROW, GANTT_HELPER_START_COL, dataRangeRows, 1); // B3:B<end>
  if (dataRangeRows > 1) {
      startHelperCell.autoFill(startHelperRange, SpreadsheetApp.AutoFillSeries.DEFAULT_SERIES);
  }
  startHelperRange.setNumberFormat(DATE_FORMAT_TASKS); // Format helper column as date

  // Formula for End Date (Column C, starting C3)
  const endFormula = `=IFERROR(VLOOKUP($A3, ${taskLookupRange}, 4, FALSE), "")`;
  const endHelperCell = sheet.getRange(GANTT_TASK_START_ROW, GANTT_HELPER_END_COL); // C3
  endHelperCell.setFormula(endFormula);
  const endHelperRange = sheet.getRange(GANTT_TASK_START_ROW, GANTT_HELPER_END_COL, dataRangeRows, 1); // C3:C<end>
  if (dataRangeRows > 1) {
    endHelperCell.autoFill(endHelperRange, SpreadsheetApp.AutoFillSeries.DEFAULT_SERIES);
  }
  endHelperRange.setNumberFormat(DATE_FORMAT_TASKS); // Format helper column as date


  // Date Row Setup (Row 2, starting Column D)
  const firstDateCell = sheet.getRange(GANTT_DATE_ROW, GANTT_DATE_START_COL); // D2
  const secondDateCell = sheet.getRange(GANTT_DATE_ROW, GANTT_DATE_START_COL + 1); // E2
  const fullDateHeaderRange = sheet.getRange(GANTT_DATE_ROW, GANTT_DATE_START_COL, 1, NUM_GANTT_COLUMNS); // D2:<EndCol>2

  // Chart Start Date Control (Put in C1, label in B1)
  sheet.getRange(1, GANTT_HELPER_START_COL).setValue("Chart Start:").setHorizontalAlignment("right").setFontWeight("bold"); // B1
  const startDateControlCell = sheet.getRange(1, GANTT_HELPER_END_COL); // C1
  startDateControlCell.setValue(new Date()).setNumberFormat(DATE_FORMAT_GANTT_CONTROL); // C1 - Set today's date

  firstDateCell.setFormula(`=${startDateControlCell.getA1Notation()}`); // D2 = C1
  secondDateCell.setFormula(`=${firstDateCell.getA1Notation()}+1`); // E2 = D2+1

  // AutoFill date formula across, starting from E2
  if (NUM_GANTT_COLUMNS > 1) {
      const dateFillRange = sheet.getRange(
          GANTT_DATE_ROW,               // Row 2
          secondDateCell.getColumn(),   // Starting Column (E)
          1,                            // Number of rows (1)
          NUM_GANTT_COLUMNS - 1         // Number of columns to fill
      );
      secondDateCell.autoFill(dateFillRange, SpreadsheetApp.AutoFillSeries.DEFAULT_SERIES);
  }

  // Format the *entire* date header range (D2 onwards)
  fullDateHeaderRange.setNumberFormat(DATE_FORMAT_GANTT_HEADER);
  fullDateHeaderRange.setHorizontalAlignment("center");


  // Adjust Column Widths
  sheet.setColumnWidth(1, 250); // Task Name (A)
  sheet.setColumnWidths(GANTT_HELPER_START_COL, GANTT_HELPER_END_COL - GANTT_HELPER_START_COL + 1, 75); // Helper cols B, C
  sheet.setColumnWidths(GANTT_DATE_START_COL, NUM_GANTT_COLUMNS, 35); // Date cols D onwards

  // --- Conditional Formatting (Referencing Helper Columns B & C) ---
  const firstDateColumnLetter = columnToLetter(GANTT_DATE_START_COL); // e.g., "D"
  const lastDateColumnLetter = columnToLetter(GANTT_DATE_START_COL + NUM_GANTT_COLUMNS - 1);
  const ganttVizRangeA1 = `${firstDateColumnLetter}${GANTT_TASK_START_ROW}:${lastDateColumnLetter}${GANTT_TASK_START_ROW + dataRangeRows -1}`; // e.g., "D3:CZ52"
  Logger.log(`Applying conditional formatting to range: ${ganttVizRangeA1}`);
  const ganttVizRange = sheet.getRange(ganttVizRangeA1); // The range where bars/highlights appear

  const newRules = []; // Array to hold new rules

  // Rule 1: Highlight Weekends (Applied first, lower precedence)
  // References date in row 2 of the *current* column (D$2, E$2, etc.)
  const weekendFormula = `=OR(WEEKDAY(${firstDateColumnLetter}$${GANTT_DATE_ROW})=1, WEEKDAY(${firstDateColumnLetter}$${GANTT_DATE_ROW})=7)`;
  const weekendRule = SpreadsheetApp.newConditionalFormatRule()
    .whenFormulaSatisfied(weekendFormula)
    .setBackground(WEEKEND_COLOR)
    .setRanges([ganttVizRange])
    .build();
  newRules.push(weekendRule);

  // Rule 2: Create Gantt Bars
  // References helper columns $B3 (Start) and $C3 (End)
  // Also checks that helper columns contain valid dates
  const startHelperColLetter = columnToLetter(GANTT_HELPER_START_COL); // $B
  const endHelperColLetter = columnToLetter(GANTT_HELPER_END_COL);     // $C
  const ganttBarFormula = `=AND($A${GANTT_TASK_START_ROW}<>"", ISDATE($${startHelperColLetter}${GANTT_TASK_START_ROW}), ISDATE($${endHelperColLetter}${GANTT_TASK_START_ROW}), ${firstDateColumnLetter}$${GANTT_DATE_ROW}>=$${startHelperColLetter}${GANTT_TASK_START_ROW}, ${firstDateColumnLetter}$${GANTT_DATE_ROW}<=$${endHelperColLetter}${GANTT_TASK_START_ROW})`;
  const ganttBarRule = SpreadsheetApp.newConditionalFormatRule()
    .whenFormulaSatisfied(ganttBarFormula)
    .setBackground(GANTT_BAR_COLOR)
    .setFontColor(GANTT_BAR_COLOR) // Hide dates under bars
    .setRanges([ganttVizRange])
    .build();
  newRules.push(ganttBarRule);

  // Rule 3: Highlight Today's Date (Applied last, highest precedence for background)
  const todayFormula = `=${firstDateColumnLetter}$${GANTT_DATE_ROW}=TODAY()`;
  const todayRule = SpreadsheetApp.newConditionalFormatRule()
    .whenFormulaSatisfied(todayFormula)
    .setBackground(TODAY_HIGHLIGHT_COLOR) // Use background color
    .setRanges([ganttVizRange])
    .build();
  newRules.push(todayRule);

  // Apply all rules (replaces any existing rules on the sheet)
  sheet.setConditionalFormatRules(newRules);
  Logger.log(`Applied ${newRules.length} conditional format rules.`);


  // --- Hide Helper Columns (Optional) ---
  if (HIDE_HELPER_COLUMNS) {
    Logger.log(`Hiding helper columns ${startHelperColLetter} and ${endHelperColLetter}.`);
    sheet.hideColumns(GANTT_HELPER_START_COL, GANTT_HELPER_END_COL - GANTT_HELPER_START_COL + 1); // Hides Columns B & C
  }

  // Activate the Gantt sheet for the user
  ss.setActiveSheet(sheet);
  Logger.log(`'${GANTT_SHEET_NAME}' sheet setup complete.`);
  SpreadsheetApp.flush(); // Apply changes
}


// --- Helper Functions ---

/**
 * Converts a column index (1-based) to a letter (A, B, ... Z, AA, etc.).
 * @param {number} columnNumber The column number (1-based).
 * @return {string} The column letter. Throws error if input is invalid.
 */
function columnToLetter(columnNumber) {
  if (typeof columnNumber !== 'number' || columnNumber < 1 || columnNumber !== Math.floor(columnNumber)) {
      throw new Error("Invalid column number input to columnToLetter: " + columnNumber);
  }
  let temp, letter = '';
  while (columnNumber > 0) {
    temp = (columnNumber - 1) % 26;
    letter = String.fromCharCode(temp + 65) + letter;
    columnNumber = Math.floor((columnNumber - temp - 1) / 26);
  }
  return letter;
}

/**
 * Converts a column letter (A, B, ... Z, AA, etc.) to an index (1-based).
 * Case-insensitive.
 * @param {string} columnLetter The column letter (e.g., "A", "AA").
 * @return {number} The column number (1-based). Throws error if input is invalid.
 */
function columnIndexFromString_(columnLetter) {
  if (typeof columnLetter !== 'string' || columnLetter.length === 0) {
       throw new Error("Invalid column letter input to columnIndexFromString_: " + columnLetter);
  }
  let column = 0;
  const letter = columnLetter.toUpperCase();
  const length = letter.length;
  for (let i = 0; i < length; i++) {
    const charCode = letter.charCodeAt(i);
    if (charCode < 65 || charCode > 90) { // Check if it's an uppercase letter A-Z
        throw new Error("Invalid character in column letter input to columnIndexFromString_: " + columnLetter);
    }
    column += (charCode - 64) * Math.pow(26, length - i - 1);
  }
  return column;
};