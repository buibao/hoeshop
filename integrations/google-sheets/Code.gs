/**
 * Hòe Google Sheets gateway. Deploy as Web app, execute as owner.
 * All access is signed POST. doGet never exposes records.
 * Script Properties: SHEET_ID, GATEWAY_SECRET; optional rate settings in runbook.
 */
var HOE_COLUMNS = {
  Orders: ["requestId", "payloadHash", "createdAt", "status", "buyerName", "buyerPhone", "buyerEmail", "recipientName", "recipientPhone", "address", "summary", "snapshot", "totals", "shipping", "notes", "shopNotes"],
  Inquiries: ["requestId", "payloadHash", "createdAt", "status", "name", "phone", "email", "serviceType", "body", "configuration", "snapshot", "shopNotes"],
  Comments: ["requestId", "payloadHash", "createdAt", "status", "postId", "displayName", "body", "commentId", "shopNotes"]
};

function hoeError(status, code) {
  var error = new Error(code);
  error.hoeStatus = status; error.hoeCode = code;
  return error;
}
function hoeJson(value) {
  return ContentService.createTextOutput(JSON.stringify(value)).setMimeType(ContentService.MimeType.JSON);
}
function doGet() { return hoeJson({ ok: false, status: 405, code: "SIGNED_POST_REQUIRED" }); }
function doPost(e) {
  var lock;
  try {
    if (!e || !e.postData || e.postData.contents.length > 150000) throw hoeError(422, "INVALID_ENVELOPE");
    var envelope;
    try { envelope = JSON.parse(e.postData.contents); } catch (_) { throw hoeError(400, "INVALID_JSON"); }
    var properties = PropertiesService.getScriptProperties();
    var secret = properties.getProperty("GATEWAY_SECRET");
    if (!secret || !properties.getProperty("SHEET_ID")) throw hoeError(503, "NOT_CONFIGURED");
    hoeVerify(envelope, secret);
    var payload;
    try { payload = JSON.parse(envelope.payload); } catch (_) { throw hoeError(422, "INVALID_PAYLOAD"); }
    if (!payload || typeof payload !== "object") throw hoeError(422, "INVALID_PAYLOAD");
    lock = LockService.getScriptLock();
    if (!lock.tryLock(10000)) throw hoeError(503, "LOCK_BUSY");
    var sheetBook = SpreadsheetApp.openById(properties.getProperty("SHEET_ID"));
    var result;
    if (payload.action === "listComments") result = hoeListComments(sheetBook, payload);
    else if (payload.action === "lookup" || payload.action === "create") result = hoeWrite(sheetBook, properties, payload);
    else throw hoeError(422, "UNKNOWN_ACTION");
    return hoeJson({ ok: true, data: result });
  } catch (error) {
    return hoeJson({ ok: false, status: error.hoeStatus || 503, code: error.hoeCode || "UPSTREAM_UNAVAILABLE" });
  } finally { if (lock && lock.hasLock()) lock.releaseLock(); }
}
function hoeHex(bytes) { return bytes.map(function (b) { return ("0" + (b & 255).toString(16)).slice(-2); }).join(""); }
function hoeVerify(e, secret) {
  if (!e || e.version !== 1 || !Number.isInteger(e.timestamp) || Math.abs(Math.floor(Date.now() / 1000) - e.timestamp) > 300
      || typeof e.payload !== "string" || typeof e.signature !== "string" || !/^[a-f0-9]{64}$/.test(e.signature))
    throw hoeError(401, "INVALID_SIGNATURE");
  var expected = hoeHex(Utilities.computeHmacSha256Signature("v1." + e.timestamp + "." + e.payload, secret, Utilities.Charset.UTF_8));
  var difference = 0;
  for (var i = 0; i < expected.length; i++) difference |= expected.charCodeAt(i) ^ e.signature.charCodeAt(i);
  if (difference !== 0) throw hoeError(401, "INVALID_SIGNATURE");
}
function hoeTable(book, resource) {
  var columns = HOE_COLUMNS[resource], sheet = book.getSheetByName(resource);
  if (!columns || !sheet) throw hoeError(503, "MISSING_TAB");
  var header = sheet.getRange(1, 1, 1, columns.length).getValues()[0];
  if (JSON.stringify(header) !== JSON.stringify(columns)) throw hoeError(503, "INVALID_HEADERS");
  return { sheet: sheet, columns: columns };
}
function hoeRows(table) {
  if (table.sheet.getLastRow() < 2) return [];
  return table.sheet.getRange(2, 1, table.sheet.getLastRow() - 1, table.columns.length).getValues().map(function (row) {
    var data = {}; table.columns.forEach(function (key, index) { data[key] = row[index]; }); return data;
  });
}
function hoeUuid(value) { return typeof value === "string" && /^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(value); }
function hoeText(value, min, max) {
  return typeof value === "string" && value.trim().length >= min && value.length <= max;
}
function hoePhone(value) { return hoeText(value, 1, 30) && /^[+\d\s().-]+$/.test(value) && value.replace(/\D/g, "").length >= 8 && value.replace(/\D/g, "").length <= 15; }
function hoeContact(value) {
  return value && hoeText(value.name, 1, 120) && hoePhone(value.phone)
    && (value.email === "" || (hoeText(value.email, 3, 254) && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.email)));
}
function hoeConfiguration(value) {
  if (!value || ["hoa-thoi", "hoa-tam", "hoa-y"].indexOf(value.serviceType) === -1) throw hoeError(422, "INVALID_CONFIGURATION");
  var allowed = ["serviceType", "desiredDate", "desiredTime", "style", "color", "budget"];
  if (value.serviceType === "hoa-thoi") allowed.push("recurringNeeds");
  if (value.serviceType === "hoa-tam") allowed = allowed.concat(["relationship", "occasion", "emotion", "dislikedFlowers", "message"]);
  if (value.serviceType === "hoa-y") allowed = allowed.concat(["shape", "flowerType", "size", "occasion", "message", "referenceUrl", "requirements"]);
  Object.keys(value).forEach(function (key) {
    if (allowed.indexOf(key) === -1 || !hoeText(value[key], 0, key === "referenceUrl" ? 2000 : 1500)) throw hoeError(422, "INVALID_CONFIGURATION");
  });
  if (value.serviceType === "hoa-tam" && !hoeText(value.emotion, 1, 500)) throw hoeError(422, "INVALID_EMOTION");
  if (value.serviceType === "hoa-y" && ["bo", "hop", "binh", "canh"].indexOf(value.shape) === -1) throw hoeError(422, "INVALID_SHAPE");
  if (value.desiredDate) {
    var parsedDate = new Date(value.desiredDate + "T00:00:00Z");
    var today = Utilities.formatDate(new Date(), "Asia/Ho_Chi_Minh", "yyyy-MM-dd");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value.desiredDate) || isNaN(parsedDate.valueOf()) || parsedDate.toISOString().slice(0, 10) !== value.desiredDate || value.desiredDate < today)
      throw hoeError(422, "INVALID_DATE");
  }
  if (value.desiredTime && !/^([01]\d|2[0-3]):[0-5]\d$/.test(value.desiredTime)) throw hoeError(422, "INVALID_TIME");
  if (value.referenceUrl && (!/^https:\/\//.test(value.referenceUrl) || /[\s\\]/.test(value.referenceUrl) || /https:\/\/[^/]*@/.test(value.referenceUrl)))
    throw hoeError(422, "INVALID_REFERENCE_URL");
}
function hoePrice(price) {
  if (!price || ["fixed", "range", "quote"].indexOf(price.mode) === -1) throw hoeError(422, "INVALID_PRICE");
  if (price.mode === "quote") {
    if (Object.keys(price).length !== 1) throw hoeError(422, "INVALID_PRICE");
    return;
  }
  if (!hoeText(price.unit, 1, 30)) throw hoeError(422, "INVALID_PRICE_UNIT");
  if (price.mode === "fixed" && (!Number.isSafeInteger(price.amount) || price.amount <= 0)) throw hoeError(422, "INVALID_PRICE");
  if (price.mode === "range" && (!Number.isSafeInteger(price.min) || !Number.isSafeInteger(price.max) || price.min <= 0 || price.min > price.max)) throw hoeError(422, "INVALID_PRICE");
}
function hoeValidateRecord(resource, record, requestId) {
  if (!record || record.requestId !== requestId) throw hoeError(422, "INVALID_RECORD");
  if (JSON.stringify(record).length > 45000) throw hoeError(422, "RECORD_TOO_LARGE");
  if (resource === "Comments") {
    if (!hoeText(record.postId, 1, 100) || !hoeText(record.displayName, 1, 80) || !hoeText(record.body, 1, 1500) || record.honeypot)
      throw hoeError(422, "INVALID_COMMENT");
    return;
  }
  if (record.status !== "received" || !hoeText(record.createdAt, 1, 40) || isNaN(Date.parse(record.createdAt))) throw hoeError(422, "INVALID_RECORD");
  if (resource === "Orders") {
    if (!hoeContact(record.buyer) || !record.recipient || !hoeText(record.recipient.name, 1, 120) || !hoePhone(record.recipient.phone)
      || !hoeText(record.address, 1, 1000) || !hoeText(record.notes, 0, 1500) || record.shipping !== "pending"
      || !Array.isArray(record.items) || record.items.length < 1 || record.items.length > 30) throw hoeError(422, "INVALID_ORDER");
    var min = 0, max = 0, quotes = 0;
    record.items.forEach(function (item) {
      if (!hoeText(item.productId, 1, 100) || !hoeText(item.name, 1, 300) || !hoeText(item.revision, 1, 100) || !Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 99) throw hoeError(422, "INVALID_ITEM");
      hoeConfiguration(item.configuration); hoePrice(item.price);
      if (item.configuration.serviceType === "hoa-thoi" && item.price.mode !== "quote") throw hoeError(422, "UNSUPPORTED_PACKAGE");
      if (item.price.mode === "quote") quotes++;
      else { min += (item.price.mode === "fixed" ? item.price.amount : item.price.min) * item.quantity; max += (item.price.mode === "fixed" ? item.price.amount : item.price.max) * item.quantity; }
    });
    var total = record.totals;
    if (!total || total.min !== min || total.max !== max || total.quoteCount !== quotes || total.pricedCount !== record.items.length - quotes) throw hoeError(422, "INVALID_TOTAL");
  } else {
    if (!hoeContact(record) || !hoeText(record.body, 1, 3000) || ["hoa-thoi", "hoa-tam", "hoa-y", "tu-van"].indexOf(record.serviceType) === -1 || ["general", "service"].indexOf(record.kind) === -1 || record.honeypot) throw hoeError(422, "INVALID_INQUIRY");
    if (record.configuration) hoeConfiguration(record.configuration);
    if (record.kind === "service" && (!record.configuration || record.serviceType !== record.configuration.serviceType || (record.serviceType === "hoa-y" && !hoeText(record.configuration.requirements, 1, 1500)))) throw hoeError(422, "INVALID_CONFIGURATION");
  }
}
function hoePublicComment(row) {
  return { commentId: row.commentId, postId: row.postId, displayName: row.displayName, body: row.body, createdAt: row.createdAt };
}
function hoeExisting(rows, p) {
  var found = rows.find(function (row) { return row.requestId === p.requestId; });
  if (!found) return null;
  if (found.payloadHash !== p.payloadHash) throw hoeError(409, "REQUEST_CONFLICT");
  if (p.resource === "Comments" && found.status !== "Visible") throw hoeError(409, "COMMENT_HIDDEN");
  // Receipt remains received even if staff subsequently changes the order status.
  return p.resource === "Comments" ? hoePublicComment(found) : { requestId: found.requestId, status: "received" };
}
function hoeSafeText(value) {
  var string = String(value === undefined || value === null ? "" : value);
  return /^[\s]*[=+\-@]/.test(string) || string.charAt(0) === "'" ? "'" + string : string;
}
function hoeRate(properties, resource, key) {
  if (!/^[a-f0-9]{64}$/.test(key)) throw hoeError(422, "INVALID_RATE_KEY");
  var now = Date.now();
  var all = properties.getProperties();
  Object.keys(all).forEach(function (name) {
    if (name.indexOf("rate:") === 0) {
      try { if (JSON.parse(all[name]).until <= now) properties.deleteProperty(name); }
      catch (_) { properties.deleteProperty(name); }
    }
  });
  var propertyName = "rate:" + resource + ":" + key;
  var current = properties.getProperty(propertyName);
  var windowMs = Number(properties.getProperty(resource === "Comments" ? "COMMENT_RATE_WINDOW_MS" : "REQUEST_RATE_WINDOW_MS")) || (resource === "Comments" ? 60000 : 600000);
  var limit = Number(properties.getProperty(resource === "Comments" ? "COMMENT_RATE_LIMIT" : "REQUEST_RATE_LIMIT")) || 5;
  if (!Number.isSafeInteger(windowMs) || windowMs <= 0 || !Number.isSafeInteger(limit) || limit <= 0) throw hoeError(503, "INVALID_RATE_CONFIG");
  var state = current ? JSON.parse(current) : { count: 0, until: now + windowMs };
  if (state.until <= now) state = { count: 0, until: now + windowMs };
  if (state.count >= limit) throw hoeError(429, "RATE_LIMITED");
  state.count++;
  properties.setProperty(propertyName, JSON.stringify(state));
}
function hoeWrite(book, properties, p) {
  if (!HOE_COLUMNS[p.resource] || !hoeUuid(p.requestId) || !/^[a-f0-9]{64}$/.test(p.payloadHash) || !/^[a-f0-9]{64}$/.test(p.rateKey)) throw hoeError(422, "INVALID_REQUEST");
  if (p.action === "lookup" && p.resource === "Comments") throw hoeError(422, "INVALID_ACTION");
  var table = hoeTable(book, p.resource);
  var existing = hoeExisting(hoeRows(table), p);
  if (existing) return existing;
  if (p.action === "lookup") return null;
  hoeValidateRecord(p.resource, p.record, p.requestId);
  hoeRate(properties, p.resource, p.rateKey);
  var r = p.record;
  var row = { requestId: p.requestId, payloadHash: p.payloadHash, createdAt: r.createdAt || new Date().toISOString(), status: p.resource === "Comments" ? "Visible" : "received", shopNotes: "" };
  if (p.resource === "Orders") {
    row.buyerName = r.buyer.name; row.buyerPhone = r.buyer.phone; row.buyerEmail = r.buyer.email;
    row.recipientName = r.recipient.name; row.recipientPhone = r.recipient.phone; row.address = r.address;
    row.summary = r.items.map(function (item) { return item.quantity + " × " + item.name; }).join("; ");
    row.snapshot = JSON.stringify(r); row.totals = JSON.stringify(r.totals); row.shipping = "pending"; row.notes = r.notes;
  } else if (p.resource === "Inquiries") {
    row.name = r.name; row.phone = r.phone; row.email = r.email; row.serviceType = r.serviceType;
    row.body = r.body; row.configuration = JSON.stringify(r.configuration || {}); row.snapshot = JSON.stringify(r);
  } else {
    row.postId = r.postId; row.displayName = r.displayName; row.body = r.body; row.commentId = p.requestId;
  }
  var range = table.sheet.getRange(table.sheet.getLastRow() + 1, 1, 1, table.columns.length);
  range.setNumberFormat("@");
  range.setValues([table.columns.map(function (column) { return hoeSafeText(row[column]); })]);
  SpreadsheetApp.flush();
  return p.resource === "Comments" ? hoePublicComment(row) : { requestId: p.requestId, status: "received" };
}
function hoeListComments(book, p) {
  if (!hoeText(p.postId, 1, 100) || (p.cursor !== null && !hoeUuid(p.cursor))) throw hoeError(422, "INVALID_QUERY");
  // Use all rows for cursor lookup so hiding a cursor row does not break pagination.
  var rows = hoeRows(hoeTable(book, "Comments")).filter(function (row) { return row.postId === p.postId; }).reverse();
  var start = p.cursor ? rows.findIndex(function (row) { return row.commentId === p.cursor; }) + 1 : 0;
  if (p.cursor && start === 0) throw hoeError(422, "INVALID_CURSOR");
  var visible = rows.slice(start).filter(function (row) { return row.status === "Visible"; });
  var page = visible.slice(0, 20);
  return { comments: page.map(hoePublicComment), nextCursor: visible.length > 20 ? page[page.length - 1].commentId : null };
}
function initializeHoeSheets() {
  var properties = PropertiesService.getScriptProperties();
  if (!properties.getProperty("SHEET_ID") || !properties.getProperty("GATEWAY_SECRET")) throw new Error("Set SHEET_ID and GATEWAY_SECRET in Script Properties first.");
  var lock = LockService.getScriptLock(); lock.waitLock(10000);
  try {
    var book = SpreadsheetApp.openById(properties.getProperty("SHEET_ID"));
    Object.keys(HOE_COLUMNS).forEach(function (resource) {
      var sheet = book.getSheetByName(resource) || book.insertSheet(resource);
      if (sheet.getLastRow() === 0) {
        sheet.getRange(1, 1, 1, HOE_COLUMNS[resource].length).setValues([HOE_COLUMNS[resource]]);
        sheet.setFrozenRows(1);
      } else hoeTable(book, resource);
    });
    SpreadsheetApp.flush();
  } finally { lock.releaseLock(); }
}
