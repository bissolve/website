// ============================================================
//  Bissolve — Appointment Booking → Google Calendar + Sheets
//  Paste this entire file into Google Apps Script and deploy
//  as a Web App: Execute as "Me", Access "Anyone"
// ============================================================

var CALENDAR_ID  = 'a3078a8fd0426d0ca49432bb61946ec71093186d07da3ce4922874274c78bd7b@group.calendar.google.com';
var SHEET_NAME   = 'Bookings';
var SLOT_MINUTES = 60;
var WORK_START   = 9;    // 9 AM Dubai time
var WORK_END     = 18;   // 6 PM Dubai time (last slot 5 PM)
var BISSOLVE_TZ  = 'Asia/Dubai';

// Slot labels in 12-hour format matching the frontend
var SLOT_LABELS = [
  '9:00 AM','10:00 AM','11:00 AM','12:00 PM',
  '1:00 PM','2:00 PM','3:00 PM','4:00 PM','5:00 PM'
];

// ------------------------------------------------------------
// GET — ?action=getBookedSlots&date=YYYY-MM-DD
//       returns { status, bookedSlots: ['9:00 AM', ...] }
// ------------------------------------------------------------
function doGet(e) {
  try {
    var action = e.parameter.action || '';

    if (action === 'getBookedSlots') {
      var dateStr = e.parameter.date; // 'YYYY-MM-DD'
      if (!dateStr) {
        return jsonResponse({ status: 'error', error: 'Missing date parameter.' });
      }

      var parts = dateStr.split('-');
      // Build start/end of that date in Dubai time via UTC offsets
      // Dubai is UTC+4, no DST
      var dubaiOffsetMs = 4 * 60 * 60 * 1000;
      var dayStartUTC = new Date(
        Date.UTC(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2])) - dubaiOffsetMs
      );
      var dayEndUTC = new Date(dayStartUTC.getTime() + 24 * 60 * 60 * 1000);

      var cal    = CalendarApp.getCalendarById(CALENDAR_ID);
      var events = cal.getEvents(dayStartUTC, dayEndUTC);

      // Convert booked event start times to slot labels
      var booked = [];

      // If any all-day event exists, block the entire day
      var hasAllDay = events.some(function(ev) { return ev.isAllDayEvent(); });
      if (hasAllDay) {
        return jsonResponse({ status: 'success', bookedSlots: SLOT_LABELS });
      }

      events.forEach(function(ev) {
        var startUTC = ev.getStartTime();
        // Convert to Dubai time
        var dubaiMs  = startUTC.getTime() + dubaiOffsetMs;
        var dubaiDate = new Date(dubaiMs);
        var hour   = dubaiDate.getUTCHours();
        var minute = dubaiDate.getUTCMinutes();

        // Match to a slot label
        var label = toSlotLabel(hour, minute);
        if (label && booked.indexOf(label) === -1) {
          booked.push(label);
        }
      });

      return jsonResponse({ status: 'success', bookedSlots: booked });
    }

    // Default: return all upcoming events (legacy)
    var now     = new Date();
    var maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + 30);
    var cal    = CalendarApp.getCalendarById(CALENDAR_ID);
    var events = cal.getEvents(now, maxDate);
    var evList = events.map(function(ev) {
      return {
        id:    ev.getId(),
        title: ev.getTitle(),
        start: ev.getStartTime().toISOString(),
        end:   ev.getEndTime().toISOString(),
      };
    });
    return jsonResponse({ status: 'success', events: evList });

  } catch (err) {
    return jsonResponse({ status: 'error', error: err.toString() });
  }
}

// ------------------------------------------------------------
// POST — creates a calendar event and logs to Sheets
// Expects JSON: { type:'booking', firstName, lastName, email,
//   phone, service, message, date (display), dateKey (YYYY-MM-DD),
//   time (Dubai slot), userTime, userTimezone }
// ------------------------------------------------------------
function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);

    // Support both new payload shape and legacy shape
    var firstName = data.firstName || '';
    var lastName  = data.lastName  || '';
    var name      = (firstName + ' ' + lastName).trim() || data.name || '';
    var email     = data.email    || '';
    var phone     = data.phone    || '';
    var service   = data.service  || '';
    var notes     = data.message  || data.notes || '';
    var dateKey   = data.dateKey  || '';   // 'YYYY-MM-DD'
    var slotLabel = data.time     || '';   // '9:00 AM' (Dubai time)
    var userTime  = data.userTime || slotLabel;
    var userTz    = data.userTimezone || BISSOLVE_TZ;

    if (!dateKey || !slotLabel) {
      return jsonResponse({ status: 'error', error: 'Missing date or time.' });
    }

    // Build UTC start from Dubai slot (UTC+4, no DST)
    var dubaiOffsetMs = 4 * 60 * 60 * 1000;
    var parts = dateKey.split('-');
    var slotHour = slotLabelToHour(slotLabel);
    if (slotHour === null) {
      return jsonResponse({ status: 'error', error: 'Unrecognised time slot: ' + slotLabel });
    }

    var startUTC = new Date(
      Date.UTC(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]), slotHour, 0, 0)
      - dubaiOffsetMs
    );
    var endUTC = new Date(startUTC.getTime() + SLOT_MINUTES * 60 * 1000);

    // Validate: not in the past
    if (startUTC < new Date()) {
      return jsonResponse({ status: 'error', error: 'Selected time is in the past.' });
    }

    // Check for conflicts
    var cal      = CalendarApp.getCalendarById(CALENDAR_ID);
    var overlaps = cal.getEvents(startUTC, endUTC);
    if (overlaps.length > 0) {
      return jsonResponse({ status: 'error', error: 'This slot is no longer available.' });
    }

    // Create calendar event
    var title       = 'Bissolve Meeting — ' + name;
    var description = [
      'Name: '     + name,
      'Email: '    + email,
      'Phone: '    + phone,
      'Service: '  + service,
      'Notes: '    + notes,
      '',
      'Booked slot (Dubai): ' + slotLabel + ' on ' + dateKey,
      'Client time: '         + userTime  + ' (' + userTz + ')',
    ].join('\n');

    var event = cal.createEvent(title, startUTC, endUTC, {
      description: description,
      sendInvites:  true,
      guests:       email,
    });

    // Log to Google Sheets
    var sheet = getOrCreateSheet();
    sheet.appendRow([
      new Date().toLocaleString(),
      firstName,
      lastName,
      email,
      phone,
      service,
      notes,
      dateKey,
      slotLabel,
      userTime,
      userTz,
      event.getId(),
    ]);

    return jsonResponse({ status: 'success', eventId: event.getId() });

  } catch (err) {
    return jsonResponse({ status: 'error', error: err.toString() });
  }
}

// ------------------------------------------------------------
// Helpers
// ------------------------------------------------------------

function toSlotLabel(hour, minute) {
  if (minute !== 0) return null;
  if (hour >= 9 && hour <= 12) {
    if (hour === 12) return '12:00 PM';
    return hour + ':00 AM';
  }
  if (hour >= 13 && hour <= 17) {
    return (hour - 12) + ':00 PM';
  }
  return null;
}

function slotLabelToHour(label) {
  var map = {
    '9:00 AM': 9, '10:00 AM': 10, '11:00 AM': 11, '12:00 PM': 12,
    '1:00 PM': 13, '2:00 PM': 14, '3:00 PM': 15, '4:00 PM': 16, '5:00 PM': 17
  };
  return (label in map) ? map[label] : null;
}

function jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function getOrCreateSheet() {
  var ss    = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow([
      'Timestamp', 'First Name', 'Last Name', 'Email', 'Phone',
      'Service', 'Notes', 'Date (YYYY-MM-DD)', 'Slot (Dubai)',
      'Client Time', 'Client Timezone', 'Calendar Event ID',
    ]);
    sheet.getRange(1, 1, 1, 12).setFontWeight('bold');
    sheet.setFrozenRows(1);
  }
  return sheet;
}
