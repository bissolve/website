// ============================================================
//  Bissolve — Contact Form → Google Sheets
//  Paste this entire file into Google Apps Script and deploy
// ============================================================

var SHEET_NAME = 'Form Submissions';

function doPost(e) {
  try {
    var sheet = getOrCreateSheet();
    var data  = JSON.parse(e.postData.contents);

    sheet.appendRow([
      new Date().toLocaleString(),   // Timestamp
      data.name    || '',            // Name
      data.company || '',            // Company
      data.email   || '',            // Email
      data.message || '',            // Message
      data.page    || '',            // Page URL
    ]);

    return ContentService
      .createTextOutput(JSON.stringify({ status: 'success' }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: 'error', error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// Also handle GET (for testing in browser)
function doGet(e) {
  return ContentService
    .createTextOutput(JSON.stringify({ status: 'ok', message: 'Bissolve form endpoint is live.' }))
    .setMimeType(ContentService.MimeType.JSON);
}

function getOrCreateSheet() {
  var ss    = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME);

  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    // Add header row
    sheet.appendRow(['Timestamp', 'Name', 'Company', 'Email', 'Message', 'Page URL']);
    sheet.getRange(1, 1, 1, 6).setFontWeight('bold');
    sheet.setFrozenRows(1);
  }

  return sheet;
}
