// --- Configuration --- (Ensure these are defined globally or pass them)
const TASKS_SHEET_NAME = "Tasks";
const GANTT_SHEET_NAME = "Gantt Chart";
const NUM_TASK_ROWS = 50;
const NUM_GANTT_COLUMNS = 60;
// const GANTT_START_COLUMN_LETTER = 'B'; // OLD - No longer needed directly like this
const GANTT_HELPER_START_COL = 2; // Column B (1-based index)
const GANTT_DATE_START_COL = 4; // Column D (1-based index) where dates will now start
const GANTT_TASK_START_ROW = 3;
const GANTT_DATE_ROW = 2;
const WEEKEND_COLOR = "#f3f3f3";
const TODAY_HIGHLIGHT_COLOR = "#fff2cc"; // Light yellow for Today rule
const GANTT_BAR_COLOR = "#4a86e8";
// --- End Configuration ---


/**
 * Sets up the 'Gantt Chart' sheet with helper columns.
 * @param {Spreadsheet} ss The active spreadsheet object.
 */
function setupGanttSheet(ss) {
  let sheet = ss.getSheetByName(GANTT_SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(GANTT_SHEET_NAME);
  } else {
    sheet.clearContents();
    sheet.clearFormats();
    sheet.clearConditionalFormatRules();
    try { // Try unfreezing in case they were set differently
        sheet.setFrozenRows(0);
        sheet.setFrozenColumns(0);
    } catch (e) { Logger.log("No frozen panes to remove or error removing them: " + e)}

     // Ensure enough columns exist before trying to insert/delete
     const requiredCols = GANTT_DATE_START_COL + NUM_GANTT_COLUMNS;
     if (sheet.getMaxColumns() < requiredCols) {
       sheet.insertColumns(sheet.getMaxColumns() + 1, requiredCols - sheet.getMaxColumns());
     }
     // Clear potentially interfering columns if re-running setup heavily
     // sheet.deleteColumns(GANTT_HELPER_START_COL, (GANTT_DATE_START_COL - GANTT_HELPER_START_COL)); // Delete old B, C if needed
  }

  // --- Insert Helper Columns ---
  // Insert 2 columns starting at GANTT_HELPER_START_COL (Column B)
  // This pushes existing content (if any) to the right.
  sheet.insertColumns(GANTT_HELPER_START_COL, (GANTT_DATE_START_COL - GANTT_HELPER_START_COL));

  // Freeze Panes (Freeze Col A, Rows 1 & 2)
  sheet.setFrozenRows(GANTT_DATE_ROW);
  sheet.setFrozenColumns(1); // Freeze column A only

  // --- Setup Headers and Formulas ---

  // Column A Header (Task Name)
  sheet.getRange(GANTT_DATE_ROW, 1).setValue("Task Name").setFontWeight("bold"); // A2

  // Helper Column Headers (Optional, good for clarity before hiding)
  sheet.getRange(GANTT_DATE_ROW, GANTT_HELPER_START_COL).setValue("Start").setFontWeight("bold"); // B2
  sheet.getRange(GANTT_DATE_ROW, GANTT_HELPER_START_COL + 1).setValue("End").setFontWeight("bold"); // C2

  // Link Task Names from 'Tasks' sheet (A3 downwards)
  const taskLinkFormula = `=IF(${TASKS_SHEET_NAME}!A2<>"", ${TASKS_SHEET_NAME}!A2, "")`;
  const taskLinkRange = sheet.getRange(GANTT_TASK_START_ROW, 1, NUM_TASK_ROWS, 1); // A3:A<NUM_TASK_ROWS+2>
  sheet.getRange(GANTT_TASK_START_ROW, 1).setFormula(taskLinkFormula);
  sheet.getRange(GANTT_TASK_START_ROW, 1).autoFill(taskLinkRange, SpreadsheetApp.AutoFillSeries.DEFAULT_SERIES);

  // --- Formulas for Helper Columns (Start Date in B, End Date in C) ---
  const startHelperCol = GANTT_HELPER_START_COL;
  const endHelperCol = GANTT_HELPER_START_COL + 1;
  const taskLookupRange = `${TASKS_SHEET_NAME}!$A$2:$D`; // Range to search in Tasks sheet

  // Formula for Start Date (Column B, starting B3)
  // Uses IFERROR to handle cases where VLOOKUP doesn't find the task
  const startFormula = `=IFERROR(VLOOKUP($A3, ${taskLookupRange}, 3, FALSE), "")`;
  const startHelperRange = sheet.getRange(GANTT_TASK_START_ROW, startHelperCol, NUM_TASK_ROWS, 1); // B3:B<...>
  sheet.getRange(GANTT_TASK_START_ROW, startHelperCol).setFormula(startFormula);
  sheet.getRange(GANTT_TASK_START_ROW, startHelperCol).autoFill(startHelperRange, SpreadsheetApp.AutoFillSeries.DEFAULT_SERIES);
  startHelperRange.setNumberFormat("yyyy-mm-dd"); // Format helper column as date

  // Formula for End Date (Column C, starting C3)
  const endFormula = `=IFERROR(VLOOKUP($A3, ${taskLookupRange}, 4, FALSE), "")`;
  const endHelperRange = sheet.getRange(GANTT_TASK_START_ROW, endHelperCol, NUM_TASK_ROWS, 1); // C3:C<...>
  sheet.getRange(GANTT_TASK_START_ROW, endHelperCol).setFormula(endFormula);
  sheet.getRange(GANTT_TASK_START_ROW, endHelperCol).autoFill(endHelperRange, SpreadsheetApp.AutoFillSeries.DEFAULT_SERIES);
  endHelperRange.setNumberFormat("yyyy-mm-dd"); // Format helper column as date


  // --- Date Row Setup (Row 2, starting Column D) ---
  const firstDateCell = sheet.getRange(GANTT_DATE_ROW, GANTT_DATE_START_COL); // D2
  const secondDateCell = sheet.getRange(GANTT_DATE_ROW, GANTT_DATE_START_COL + 1); // E2
  const fullDateHeaderRange = sheet.getRange(GANTT_DATE_ROW, GANTT_DATE_START_COL, 1, NUM_GANTT_COLUMNS); // D2:<EndColumn>2

  // Chart Start Date Control (Put in C1, next to helper columns)
  sheet.getRange(1, endHelperCol).setValue("Chart Start Date:").setHorizontalAlignment("right").setFontWeight("bold"); // C1
  sheet.getRange(1, firstDateCell.getColumn()).setValue(new Date()).setNumberFormat("yyyy-mm-dd"); // D1 - Set today's date

  firstDateCell.setFormula(`=${sheet.getRange(1, firstDateCell.getColumn()).getA1Notation()}`); // D2 = D1
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
  fullDateHeaderRange.setNumberFormat("d");

  // Adjust Column Widths
  sheet.setColumnWidth(1, 200); // Task Name (A)
  sheet.setColumnWidths(GANTT_HELPER_START_COL, 2, 75); // Helper cols B, C (can be hidden later)
  sheet.setColumnWidths(GANTT_DATE_START_COL, NUM_GANTT_COLUMNS, 35); // Date cols D onwards

  // --- Conditional Formatting (Referencing Helper Columns B & C) ---
  const firstDateColumnLetter = columnToLetter(GANTT_DATE_START_COL); // e.g., "D"
  const lastDateColumnLetter = columnToLetter(GANTT_DATE_START_COL + NUM_GANTT_COLUMNS - 1);
  const ganttRangeA1 = `${firstDateColumnLetter}${GANTT_TASK_START_ROW}:${lastDateColumnLetter}${GANTT_TASK_START_ROW + NUM_TASK_ROWS -1}`; // e.g., "D3:BM52"

  const rules = sheet.getConditionalFormatRules(); // Get existing rules first if needed, but we cleared them
  const newRules = [];

  // Rule 1: Highlight Weekends
  // References date in row 2 of the *current* column (D2, E2, etc.)
  const weekendFormula = `=OR(WEEKDAY(${firstDateColumnLetter}$${GANTT_DATE_ROW})=1, WEEKDAY(${firstDateColumnLetter}$${GANTT_DATE_ROW})=7)`;
  const weekendRule = SpreadsheetApp.newConditionalFormatRule()
    .whenFormulaSatisfied(weekendFormula)
    .setBackground(WEEKEND_COLOR)
    .setRanges([sheet.getRange(ganttRangeA1)])
    .build();
  newRules.push(weekendRule);

  // Rule 2: Create Gantt Bars
  // **MODIFIED FORMULA**: References helper columns $B3 (Start) and $C3 (End)
  const ganttBarFormula = `=AND(${firstDateColumnLetter}$${GANTT_DATE_ROW}>=$${columnToLetter(startHelperCol)}${GANTT_TASK_START_ROW}, ${firstDateColumnLetter}$${GANTT_DATE_ROW}<=$${columnToLetter(endHelperCol)}${GANTT_TASK_START_ROW}, $A${GANTT_TASK_START_ROW}<>"", ISDATE($${columnToLetter(startHelperCol)}${GANTT_TASK_START_ROW}))`;
  const ganttBarRule = SpreadsheetApp.newConditionalFormatRule()
    .whenFormulaSatisfied(ganttBarFormula)
    .setBackground(GANTT_BAR_COLOR)
    .setFontColor(GANTT_BAR_COLOR) // Hide dates under bars
    .setRanges([sheet.getRange(ganttRangeA1)])
    .build();
  newRules.push(ganttBarRule); // Add Gantt rule *after* weekend rule

  // Rule 3: Highlight Today's Date
  const todayFormula = `=${firstDateColumnLetter}$${GANTT_DATE_ROW}=TODAY()`;
  const todayRule = SpreadsheetApp.newConditionalFormatRule()
    .whenFormulaSatisfied(todayFormula)
    .setBackground(TODAY_HIGHLIGHT_COLOR) // Use background color instead of border
    .setRanges([sheet.getRange(ganttRangeA1)])
    .build();
  newRules.push(todayRule); // Add Today rule *last*

  // Apply all rules
  sheet.setConditionalFormatRules(newRules);

  // --- Hide Helper Columns (Optional) ---
  // sheet.hideColumns(GANTT_HELPER_START_COL, (GANTT_DATE_START_COL - GANTT_HELPER_START_COL)); // Hides Columns B & C

  Logger.log(`'${GANTT_SHEET_NAME}' sheet setup complete with helper columns.`);
}

// --- Helper Functions --- (Keep columnToLetter and columnIndexFromString_)

/**
 * Converts a column index (1-based) to a letter (A, B, ... Z, AA, etc.).
 * @param {number} columnNumber The column number (1-based).
 * @return {string} The column letter.
 */
function columnToLetter(columnNumber) {
  let temp, letter = '';
  while (columnNumber > 0) {
    temp = (columnNumber - 1) % 26;
    letter = String.fromCharCode(temp + 65) + letter;
    columnNumber = (columnNumber - temp - 1) / 26;
  }
  return letter;
}

/**
 * Converts a column letter (A, B, ... Z, AA, etc.) to an index (1-based).
 * @param {string} columnLetter The column letter.
 * @return {number} The column number (1-based).
 */
function columnIndexFromString_(columnLetter) {
  let column = 0, length = columnLetter.length;
  for (let i = 0; i < length; i++) {
    column += (columnLetter.charCodeAt(i) - 64) * Math.pow(26, length - i - 1);
  }
  return column;
};

// --- Ensure the main setup function calls this modified setupGanttSheet ---
/**
 * Main function to set up both sheets.
 * Run this function from the script editor.
 */
function setupGanttChart() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  try {
    setupTasksSheet(ss); // Make sure this function is also in your script
    setupGanttSheet(ss); // Calls the modified version
    SpreadsheetApp.getUi().alert('Gantt Chart sheets ("Tasks" and "Gantt Chart") have been set up successfully!');
  } catch (e) {
    Logger.log("Error setting up Gantt Chart: " + e + "\nStack: " + e.stack); // Log stack trace for better debugging
    SpreadsheetApp.getUi().alert('An error occurred during setup. Check Logs (View > Logs). Error: ' + e);
  }
}

// --- onOpen function --- (Keep as before)
/**
 * Creates a custom menu item in the spreadsheet UI.
 */
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('Gantt Setup')
    .addItem('Run Setup', 'setupGanttChart')
    .addToUi();
}

// --- setupTasksSheet function --- (Keep as before, ensure it's included)
/**
 * Sets up the 'Tasks' sheet.
 * @param {Spreadsheet} ss The active spreadsheet object.
 */
function setupTasksSheet(ss) {
  let sheet = ss.getSheetByName(TASKS_SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(TASKS_SHEET_NAME);
  } else {
    // Clear existing content and formatting for a fresh setup
    sheet.clearContents();
    sheet.clearFormats();
    sheet.clearConditionalFormatRules();
  }

  // Freeze top row
  sheet.setFrozenRows(1);

  // Headers
  const headers = ["Task Name", "Owner", "Start Date", "End Date", "Duration (Days)", "Status", "Notes"];
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]).setFontWeight("bold");

  // Column Formatting & Validation
  // Dates (C & D) - Start from row 2
  sheet.getRange(2, 3, sheet.getMaxRows() - 1, 2) // Columns C and D
       .setNumberFormat("yyyy-mm-dd")
       .setDataValidation(SpreadsheetApp.newDataValidation().requireDate().setAllowInvalid(false).build());

  // Duration (E) - Start from row 2
  sheet.getRange(2, 5, sheet.getMaxRows() - 1, 1) // Column E
       .setNumberFormat("0");

  // Status Dropdown (F) - Start from row 2
  const statuses = ["Not Started", "In Progress", "Completed", "Blocked"];
  const statusRule = SpreadsheetApp.newDataValidation().requireValueInList(statuses).setAllowInvalid(false).build();
  sheet.getRange(2, 6, sheet.getMaxRows() - 1, 1).setDataValidation(statusRule); // Column F

  // Duration Formula in E2, autofill down
  const durationFormula = `=IF(AND(ISDATE(C2), ISDATE(D2)), D2-C2+1, "")`;
  // Ensure NUM_TASK_ROWS is defined or use a reasonable default
  const taskRowsToFill = typeof NUM_TASK_ROWS !== 'undefined' ? NUM_TASK_ROWS : 50;
  if (taskRowsToFill > 1) { // Need at least 2 rows to autofill from E2
      const durationRange = sheet.getRange(2, 5, taskRowsToFill - 1, 1); // E2:E<NUM_TASK_ROWS>
      sheet.getRange("E2").setFormula(durationFormula);
      try { // Add try-catch around autoFill as it can fail on very small ranges
           sheet.getRange("E2").autoFill(durationRange, SpreadsheetApp.AutoFillSeries.DEFAULT_SERIES);
      } catch (e) {
          Logger.log("Could not autofill duration: " + e);
          // Fallback: manually set formula in range if autofill fails
           durationRange.setFormula(durationFormula);
      }
  } else if (taskRowsToFill === 1) {
       sheet.getRange("E2").setFormula(durationFormula); // Only set formula if only one task row requested
  }


  // Adjust Column Widths
  sheet.setColumnWidth(1, 200); // Task Name
  sheet.setColumnWidth(2, 100); // Owner
  sheet.setColumnWidths(3, 2, 100); // Start/End Date
  sheet.setColumnWidth(5, 100); // Duration
  sheet.setColumnWidth(6, 100); // Status
  sheet.setColumnWidth(7, 250); // Notes

  Logger.log(`'${TASKS_SHEET_NAME}' sheet setup complete.`);
}