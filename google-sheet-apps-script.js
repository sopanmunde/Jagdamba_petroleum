/**
 * Jagdamba Petroleum - Google Sheet storage script.
 * Sheet ID: 1XwT7-69sAUroUTi1_t80Xs3i3RtM7FmiE_lAuNDQUvs
 *
 * HOW TO UPDATE ON GOOGLE SHEETS:
 * 1. Open your sheet: https://docs.google.com/spreadsheets/d/1XwT7-69sAUroUTi1_t80Xs3i3RtM7FmiE_lAuNDQUvs
 * 2. Go to Extensions > Apps Script
 * 3. Replace all code with this file contents.
 * 4. Click Deploy > Manage deployments > Edit (pencil icon) > Version: New version > Deploy
 *    (or Deploy > New deployment > Web app: Execute as: Me, Who has access: Anyone)
 */

var SPREADSHEET_ID = "1XwT7-69sAUroUTi1_t80Xs3i3RtM7FmiE_lAuNDQUvs";
var SHEET_NAME = "Sheet1";

var HEADERS = [
  "Timestamp",
  "Feedback ID",
  "Name",
  "Email",
  "Mobile",
  "Fuel Type",
  "Rating",
  "Feedback",
];

function getSpreadsheet_() {
  try {
    return SpreadsheetApp.getActiveSpreadsheet() || SpreadsheetApp.openById(SPREADSHEET_ID);
  } catch (err) {
    return SpreadsheetApp.openById(SPREADSHEET_ID);
  }
}

function ensureHeaders_(sheet) {
  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
    sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight("bold");
    sheet.getRange(1, 1, 1, HEADERS.length).setBackground("#0f172a");
    sheet.getRange(1, 1, 1, HEADERS.length).setFontColor("#ffffff");
    sheet.setFrozenRows(1);
  }
}

function doGet() {
  try {
    var ss = getSpreadsheet_();
    var sheet = ss.getSheetByName(SHEET_NAME) || ss.getSheets()[0];
    ensureHeaders_(sheet);

    var lastRow = sheet.getLastRow();
    var values = lastRow > 1 ? sheet.getRange(2, 1, lastRow - 1, HEADERS.length).getValues() : [];

    var feedbacks = values
      .map(function (row) {
        return {
          createdAt: row[0],
          id: String(row[1] || ""),
          name: String(row[2] || ""),
          email: String(row[3] || ""),
          mobile: String(row[4] || ""),
          fuelType: String(row[5] || ""),
          rating: String(row[6] || ""),
          feedback: String(row[7] || ""),
        };
      })
      .filter(function (item) {
        return item.id && item.id.length > 0;
      })
      .reverse(); // newest first

    return ContentService.createTextOutput(
      JSON.stringify({ success: true, feedbacks: feedbacks })
    ).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(
      JSON.stringify({ success: false, error: String(err) })
    ).setMimeType(ContentService.MimeType.JSON);
  }
}

function doPost(e) {
  try {
    var ss = getSpreadsheet_();
    var sheet = ss.getSheetByName(SHEET_NAME) || ss.getSheets()[0];
    ensureHeaders_(sheet);

    var payload = {};
    if (e && e.postData && e.postData.contents) {
      try {
        payload = JSON.parse(e.postData.contents);
      } catch (pErr) {
        payload = e.parameter || {};
      }
    } else if (e && e.parameter) {
      payload = e.parameter;
    }

    // Handle delete action
    if (payload.action === "delete" && payload.id) {
      var data = sheet.getDataRange().getValues();
      for (var i = 1; i < data.length; i++) {
        if (String(data[i][1]) === String(payload.id)) {
          sheet.deleteRow(i + 1);
          return json_({ success: true, message: "Deleted " + payload.id });
        }
      }
      return json_({ success: false, message: "ID not found: " + payload.id });
    }

    if (!payload.name && !payload.id) {
      return json_({ success: false, message: "No data payload received" });
    }

    var row = [
      payload.createdAt || new Date().toISOString(),
      payload.id || ("FB-" + Math.floor(100000 + Math.random() * 900000)),
      payload.name || "",
      payload.email || "",
      payload.mobile || "",
      payload.fuelType || "",
      payload.rating || "",
      payload.feedback || "",
    ];

    sheet.appendRow(row);
    return json_({ success: true, message: "Feedback stored successfully", data: payload });
  } catch (err) {
    return json_({ success: false, message: String(err) });
  }
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(
    ContentService.MimeType.JSON
  );
}
