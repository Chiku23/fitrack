import Transaction from '../models/Transaction.js';
import csv from 'csv-parser';
import { Readable } from 'stream';
import ExcelJS from 'exceljs';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

const pdfParse = async (buffer) => {
  const { PDFParse } = require('pdf-parse');
  const parser = new PDFParse({ data: buffer });

  // Override getPageText to sort elements visually by coordinates
  parser.getPageText = async function (page, options, total) {
    const viewport = page.getViewport({ scale: 1 });
    const textContent = await page.getTextContent({ includeMarkedContent: false, disableNormalization: false });

    const linesMap = {};
    const tolerance = 5; // Pixels tolerance for baseline alignment

    for (const item of textContent.items) {
      if (!item.str || !item.str.trim()) continue;

      const transform = item.transform;
      // Convert to viewport point to get visual layout coords
      const [x, y] = viewport.convertToViewportPoint(transform[4], transform[5]);

      let foundYKey = null;
      for (const keyStr of Object.keys(linesMap)) {
        const keyVal = parseFloat(keyStr);
        if (Math.abs(keyVal - y) <= tolerance) {
          foundYKey = keyStr;
          break;
        }
      }

      if (foundYKey === null) {
        foundYKey = String(y);
        linesMap[foundYKey] = [];
      }

      linesMap[foundYKey].push({ x, str: item.str, width: item.width || 0 });
    }

    // Sort Y keys ascending (top to bottom on page)
    const sortedYKeys = Object.keys(linesMap).map(Number).sort((a, b) => a - b);
    const pageLines = [];
    for (const yKey of sortedYKeys) {
      // Sort items on the same line from left to right (lowest X to highest X)
      const lineItems = linesMap[String(yKey)].sort((a, b) => a.x - b.x);

      let lineStr = '';
      for (let i = 0; i < lineItems.length; i++) {
        const item = lineItems[i];
        if (i === 0) {
          lineStr = item.str;
        } else {
          const prev = lineItems[i - 1];
          const gap = item.x - (prev.x + prev.width);

          if (gap > 12) { // 12 pixels gap indicates a separate column/cell
            lineStr += '\t' + item.str;
          } else if (gap > 1) { // small positive gap indicates a space
            lineStr += ' ' + item.str;
          } else { // negative or zero gap (overlapping or adjacent)
            lineStr += item.str;
          }
        }
      }

      if (lineStr.trim()) {
        pageLines.push(lineStr.trim());
      }
    }

    return pageLines.join('\n');
  };

  try {
    const result = await parser.getText();
    return { text: result.text };
  } finally {
    await parser.destroy().catch(() => { });
  }
};



// Helper: detect file format by headers
const detectFormat = (headers) => {
  const h = headers.map(s => s.toLowerCase().trim());
  if (h.some(x => x.includes('transaction id') && x.includes('utr'))) return 'phonepe';
  if (h.some(x => x.includes('google') || (x.includes('transaction') && x.includes('type')))) return 'gpay';
  if (h.some(x => x.includes('narration') || x.includes('chq/ref'))) return 'hdfc';
  if (h.some(x => x.includes('withdrawal') || x.includes('deposit'))) return 'generic_bank';
  return 'generic';
};

// Helper: parse a row into a standard transaction object
const mapRow = (row, format) => {
  try {
    const keys = Object.keys(row);
    const get = (key) => {
      const match = keys.find(k => k.toLowerCase().trim().includes(key.toLowerCase()));
      return match ? (row[match] || '').toString().trim() : '';
    };

    let description = '', amount = 0, type = 'expense', date = '', category = 'Other', payment_method = '';

    if (format === 'phonepe') {
      description = get('narration') || get('description') || get('merchant');
      const debit = Math.abs(parseFloat(get('debit') || get('debited') || '0'));
      const credit = Math.abs(parseFloat(get('credit') || get('credited') || '0'));
      amount = debit > 0 ? debit : credit;
      type = credit > 0 ? 'income' : 'expense';
      date = get('date');
      payment_method = 'UPI';
    } else if (format === 'gpay') {
      description = get('description') || get('note');
      amount = Math.abs(parseFloat(get('amount') || '0'));
      type = (get('type') || '').toLowerCase().includes('credit') ? 'income' : 'expense';
      date = get('date');
      payment_method = 'UPI';
    } else if (format === 'hdfc') {
      description = get('narration');
      const withdrawal = Math.abs(parseFloat(get('withdrawal') || '0'));
      const deposit = Math.abs(parseFloat(get('deposit') || '0'));
      amount = withdrawal > 0 ? withdrawal : deposit;
      type = deposit > 0 ? 'income' : 'expense';
      date = get('date') || get('value date');
      payment_method = 'Bank Transfer';
    } else {
      description = get('description') || get('narration') || get('details') || 'Imported';
      const debit = Math.abs(parseFloat(get('debit') || get('withdrawal') || '0'));
      const credit = Math.abs(parseFloat(get('credit') || get('deposit') || '0'));
      amount = debit > 0 ? debit : credit;
      type = credit > 0 ? 'income' : 'expense';
      date = get('date') || get('value date') || get('txn date');
    }

    // Normalize date
    if (date) {
      const parsed = new Date(date);
      if (!isNaN(parsed)) date = parsed.toISOString().split('T')[0];
    }
    if (!date || date === 'Invalid Date') date = new Date().toISOString().split('T')[0];

    if (!amount || isNaN(amount) || amount <= 0) return null;
    if (!description) return null;

    // Auto-categorize
    const desc = description.toLowerCase();
    if (desc.match(/swiggy|zomato|food|restaurant|cafe|pizza|burger/)) category = 'Dining';
    else if (desc.match(/amazon|flipkart|shop|store|mall|market/)) category = 'Shopping';
    else if (desc.match(/uber|ola|metro|bus|train|petrol|fuel|cab/)) category = 'Transport';
    else if (desc.match(/salary|stipend|payroll|income/)) category = 'Salary';
    else if (desc.match(/rent|pg|hostel|accommodation/)) category = 'Rent';
    else if (desc.match(/electricity|water|gas|bill|recharge|postpaid/)) category = 'Utilities';
    else if (desc.match(/netflix|spotify|prime|youtube|subscription/)) category = 'Entertainment';
    else if (desc.match(/hospital|doctor|pharma|medicine|clinic/)) category = 'Healthcare';
    else if (desc.match(/mutual fund|sip|investment|stock|trading|zerodha/)) category = 'Investments';
    else if (desc.match(/atm|cash/)) category = 'Cash';
    else if (type === 'income') category = 'Income';

    return { description, amount: parseFloat(amount.toFixed(2)), type, category, date, payment_method, source: 'import' };
  } catch {
    return null;
  }
};

// @desc   Import CSV (PhonePe, Google Pay, Bank)
// @route  POST /api/import/csv
export const importCsv = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, error: 'No file uploaded.' });

    const rows = [];
    let format = 'generic';
    let headerDetected = false;

    await new Promise((resolve, reject) => {
      const stream = Readable.from(req.file.buffer.toString('utf8'));
      stream
        .pipe(csv())
        .on('headers', (headers) => {
          format = detectFormat(headers);
          headerDetected = true;
        })
        .on('data', (row) => rows.push(row))
        .on('end', resolve)
        .on('error', reject);
    });

    const transactions = rows.map(row => mapRow(row, format)).filter(Boolean);

    if (transactions.length === 0) {
      return res.status(400).json({ success: false, error: 'No valid transactions found in file.' });
    }

    const created = await Transaction.bulkCreate(
      transactions.map(t => ({ ...t, userId: req.user.id }))
    );

    return res.status(201).json({
      success: true,
      imported: created.length,
      skipped: rows.length - created.length,
      data: created,
      format
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Server Error: ' + error.message });
  }
};

// @desc   Import Excel (XLSX bank statements)
// @route  POST /api/import/excel
export const importExcel = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, error: 'No file uploaded.' });

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(req.file.buffer);

    const worksheet = workbook.worksheets[0];
    const rows = [];
    let headers = [];

    const getCellValue = (cell) => {
      if (!cell || cell.value === null || cell.value === undefined) return '';
      let val = cell.value;
      if (val && typeof val === 'object') {
        if ('result' in val) val = val.result;
        else if ('text' in val) val = val.text;
      }
      return val;
    };

    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) {
        row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
          headers[colNumber] = String(getCellValue(cell) || '').trim();
        });
      } else {
        const obj = {};
        row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
          const header = headers[colNumber];
          if (header) {
            const val = getCellValue(cell);
            obj[header] = val instanceof Date ? val.toISOString().split('T')[0] : String(val || '').trim();
          }
        });
        rows.push(obj);
      }
    });

    const format = detectFormat(headers.filter(Boolean));
    const transactions = rows.map(row => mapRow(row, format)).filter(Boolean);

    if (transactions.length === 0) {
      return res.status(400).json({ success: false, error: 'No valid transactions found in file.' });
    }

    const created = await Transaction.bulkCreate(
      transactions.map(t => ({ ...t, userId: req.user.id }))
    );

    return res.status(201).json({ success: true, imported: created.length, data: created });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Server Error: ' + error.message });
  }
};

// Lifted Helper functions for PDF and TXT statement parsing
const parseDate = (str) => {
  if (!str) return null;
  // Clean string: replace commas and hyphens/slashes with space
  const clean = str.replace(/,/g, ' ').replace(/[\/\-\s]+/g, ' ').trim();
  const parts = clean.split(' ').filter(Boolean);
  if (parts.length < 3) return null;

  let day, month, year;
  const monthsMap = {
    jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
    jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12',
    december: '12', november: '11', october: '10', september: '09',
    august: '08', july: '07', june: '06', may_long: '05', april: '04',
    march: '03', february: '02', january: '01'
  };

  // Find year (4 digits, or 2 digits at the end if no 4 digit found)
  let yearIdx = parts.findIndex(p => p.length === 4 && !isNaN(p));
  if (yearIdx === -1) {
    if (!isNaN(parts[parts.length - 1])) {
      yearIdx = parts.length - 1;
    }
  }
  if (yearIdx === -1) return null;
  year = parts[yearIdx];
  if (year.length === 2) year = '20' + year;

  const remaining = parts.filter((_, idx) => idx !== yearIdx);
  if (remaining.length < 2) return null;

  let monthIdx = remaining.findIndex(p => isNaN(p) && monthsMap[p.toLowerCase().slice(0, 3)]);
  if (monthIdx !== -1) {
    month = monthsMap[remaining[monthIdx].toLowerCase().slice(0, 3)];
    day = remaining[1 - monthIdx];
  } else {
    const val1 = parseInt(remaining[0]);
    const val2 = parseInt(remaining[1]);
    if (val1 > 12) {
      day = val1.toString();
      month = val2.toString();
    } else if (val2 > 12) {
      day = val2.toString();
      month = val1.toString();
    } else {
      day = val1.toString();
      month = val2.toString();
    }
  }

  if (!day || !month || !year) return null;
  day = day.padStart(2, '0');
  month = month.padStart(2, '0');

  const parsed = new Date(`${year}-${month}-${day}`);
  return !isNaN(parsed) ? parsed.toISOString().split('T')[0] : null;
};

// Helper functions for parsing
const detectPdfSource = (text) => {
  const t = text.toLowerCase();
  if (t.includes('phonepe') || t.includes('transaction id t')) return 'phonepe';
  if (t.includes('google pay') || t.includes('upi transaction id:')) return 'gpay';
  if (t.includes('jio payments bank') || t.includes('jio payments')) return 'jio';
  return 'generic';
};

const parsePhonePePdf = (lines) => {
  const transactions = [];
  let idx = 0;
  while (idx < lines.length) {
    const line = lines[idx];
    const cleanLine = line.replace(/\s+/g, ' ');
    const match = cleanLine.match(/([a-zA-Z]{3,10}\s\d{1,2},\s\d{4})\s+(.+?)\s+(DEBIT|CREDIT)\s*(?:₹|Rs\.|INR)?\s*([\d,]+(?:\.\d{1,2})?)/i);
    if (match) {
      const rawDate = match[1];
      const description = match[2].trim();
      const type = match[3].toLowerCase();
      const amount = parseFloat(match[4].replace(/,/g, ''));
      const date = parseDate(rawDate);

      if (amount > 0 && description && date) {
        const mapped = mapRow({
          date,
          description,
          debit: type === 'debit' ? amount : 0,
          credit: type === 'credit' ? amount : 0
        }, 'generic_bank');
        if (mapped) transactions.push(mapped);
      }
    }
    idx++;
  }
  return transactions;
};

const parseGPayPdf = (lines) => {
  const transactions = [];
  let idx = 0;
  while (idx < lines.length) {
    const line = lines[idx];
    const parts = line.split('\t').map(p => p.trim()).filter(Boolean);

    if (parts.length >= 3) {
      const date = parseDate(parts[0]);
      if (date) {
        const rawDescription = parts[1];
        const rawAmount = parts[2];

        const cleanAmt = rawAmount.replace(/[^\d\.,\-]/g, '').trim();
        const amount = Math.abs(parseFloat(cleanAmt.replace(/,/g, '')));

        if (amount > 0 && rawDescription) {
          const lowerDesc = rawDescription.toLowerCase();
          const isCredit = lowerDesc.includes('receiv') || lowerDesc.includes('reciev') || lowerDesc.includes('refund') || lowerDesc.includes('deposit') || lowerDesc.includes('credited');

          let description = rawDescription;
          let j = idx + 1;
          while (j < lines.length && j < idx + 3) {
            const nextLine = lines[j];
            if (parseDate(nextLine)) {
              break;
            }
            const lowerNext = nextLine.toLowerCase();
            if (lowerNext.includes('transaction statement') || lowerNext.includes('page') || lowerNext.includes('note:')) {
              break;
            }
            description += ' ' + nextLine.replace(/\t/g, ' ').trim();
            j++;
          }

          const mapped = mapRow({
            date,
            description: description.trim(),
            debit: isCredit ? 0 : amount,
            credit: isCredit ? amount : 0
          }, 'generic_bank');

          if (mapped) {
            transactions.push(mapped);
            idx = j - 1; // skip consumed lines
          }
        }
      }
    }
    idx++;
  }
  return transactions;
};

const parseHeuristicPdf = (lines) => {
  const transactions = [];
  let idx = 0;
  while (idx < lines.length) {
    const line = lines[idx];
    let parsedTxn = false;

    // 1. Column-based check first (since tabular layout is reconstructed with tabs/multiple spaces)
    const parts = line.split(/\s{2,}|\t/).map(p => p.trim()).filter(Boolean);
    if (parts.length >= 3) {
      const dateRegex = /^([a-zA-Z]{3,10}\s\d{1,2},\s\d{4})|(\d{1,2}\s+[a-zA-Z]{3,10},\s+\d{4})|(\d{1,2}[\s\/\-]([a-zA-Z]{3,10}|\d{1,2})[\s\/\-]\d{2,4})$/;
      let dateIdx = -1;
      for (let i = 0; i < parts.length; i++) {
        if (dateRegex.test(parts[i])) {
          dateIdx = i;
          break;
        }
      }

      if (dateIdx !== -1) {
        const dateStr = parts[dateIdx];
        const remainingParts = parts.filter((_, i) => i !== dateIdx);
        const numPattern = /^\-?(?:₹|Rs\.|INR)?\s*[\d,]+(?:\.\d{1,2})?\s*(?:Cr|Dr|debit|credit)?$/i;
        const amountParts = [];
        const descParts = [];

        remainingParts.forEach(p => {
          if (numPattern.test(p)) {
            amountParts.push(p);
          } else {
            descParts.push(p);
          }
        });

        if (amountParts.length > 0) {
          const description = descParts.join(' ').trim();
          if (description) {
            let debit = 0;
            let credit = 0;
            const parseVal = (str) => Math.abs(parseFloat(str.replace(/[^\d\.\-]/g, ''))) || 0;

            // Pop balance column (last column) if we have multiple amount columns
            if (amountParts.length >= 2) {
              parseVal(amountParts.pop());
            }

            if (amountParts.length >= 2) {
              debit = parseVal(amountParts[0]);
              credit = parseVal(amountParts[1]);
            } else if (amountParts.length === 1) {
              const val = parseVal(amountParts[0]);
              const lowerLine = line.toLowerCase();
              if (lowerLine.includes('credit') || lowerLine.includes('receiv') || lowerLine.includes('reciev') || lowerLine.includes('refund') || lowerLine.includes('deposit') || lowerLine.includes('credited')) {
                credit = val;
              } else {
                debit = val;
              }
            }

            const date = parseDate(dateStr);
            if (date && (debit > 0 || credit > 0)) {
              const mapped = mapRow({ date, description, debit, credit }, 'generic_bank');
              if (mapped) {
                transactions.push(mapped);
                parsedTxn = true;
              }
            }
          }
        }
      }
    }

    if (parsedTxn) {
      idx++;
      continue;
    }

    // 2. Regex-based single-line fallback
    const cleanLine = line.replace(/\s+/g, ' ');
    const dateMatch = cleanLine.match(/([a-zA-Z]{3,10}\s+\d{1,2},\s+\d{4}|d{1,2}\s+[a-zA-Z]{3,10},\s+\d{4}|\d{1,2}[\/\-\s](?:\d{1,2}|[a-zA-Z]{3,10})[\/\-\s]\d{2,4})/i);
    const amountMatch = cleanLine.match(/(?:₹|Rs\.|INR)?\s*([\d,]+(?:\.\d{1,2})?)\s*(?:SUCCESS|FAILED|COMPLETED|DEBIT|CREDIT|Cr|Dr|pending)?$/i);

    if (dateMatch && amountMatch) {
      const rawDate = dateMatch[1];
      const rawAmount = amountMatch[1];
      const date = parseDate(rawDate);
      const amount = Math.abs(parseFloat(rawAmount.replace(/,/g, '')));

      if (date && amount > 0) {
        let description = cleanLine
          .replace(rawDate, '')
          .replace(amountMatch[0], '')
          .trim();

        const lowerLine = cleanLine.toLowerCase();
        let isCredit = false;
        if (lowerLine.includes('credit') || lowerLine.includes('receiv') || lowerLine.includes('reciev') || lowerLine.includes('refund') || lowerLine.includes('deposit') || lowerLine.includes('credited')) {
          isCredit = true;
        }

        description = description
          .replace(/\b(DEBIT|CREDIT|Dr|Cr)\b/ig, '')
          .replace(/\s+/g, ' ')
          .trim();

        const lowerDesc = description.toLowerCase();
        const isHeader = lowerDesc.includes('statement') ||
          lowerDesc.includes('period') ||
          lowerDesc.includes('closing') ||
          lowerDesc.includes('opening') ||
          lowerDesc.includes('summary') ||
          (lowerDesc.includes('total') && !lowerDesc.includes('total wine')) ||
          lowerDesc.includes('page');

        if (description && !isHeader) {
          const mapped = mapRow({
            date,
            description,
            debit: isCredit ? 0 : amount,
            credit: isCredit ? amount : 0
          }, 'generic_bank');

          if (mapped) {
            transactions.push(mapped);
            idx++;
            continue;
          }
        }
      }
    }

    // 3. Multi-line fallback
    const date = parseDate(line);
    if (date) {
      let description = '';
      let amount = 0;
      let type = 'expense';
      let foundAmount = false;

      let j = idx + 1;
      while (j < lines.length && j < idx + 6) {
        const nextLine = lines[j];
        if (parseDate(nextLine)) {
          break;
        }

        const lowerNext = nextLine.toLowerCase().trim();
        if (lowerNext === 'debit' || lowerNext === 'credit' || lowerNext === 'dr' || lowerNext === 'cr') {
          type = (lowerNext === 'credit' || lowerNext === 'cr') ? 'income' : 'expense';
          j++;
          continue;
        }

        const cleanAmt = nextLine.replace(/[^\d\.,\-]/g, '').trim();
        const amtVal = Math.abs(parseFloat(cleanAmt.replace(/,/g, '')));
        if (amtVal > 0 && /^(?:₹|Rs\.|INR)?\s*[\d,]+(?:\.\d{1,2})?$/i.test(nextLine.trim())) {
          amount = amtVal;
          foundAmount = true;
          j++;
          continue;
        }

        if (!lowerNext.includes('transaction id') && !lowerNext.includes('utr no') && !lowerNext.includes('balance') && !lowerNext.includes('page')) {
          description += (description ? ' ' : '') + nextLine;
        }
        j++;
      }

      if (foundAmount && description.trim()) {
        const lowerDesc = description.toLowerCase();
        if (lowerDesc.includes('credit') || lowerDesc.includes('receiv') || lowerDesc.includes('reciev') || lowerDesc.includes('refund') || lowerDesc.includes('deposit') || lowerDesc.includes('credited')) {
          type = 'income';
        }

        const mapped = mapRow({
          date,
          description: description.trim(),
          debit: type === 'expense' ? amount : 0,
          credit: type === 'income' ? amount : 0
        }, 'generic_bank');
        if (mapped) {
          transactions.push(mapped);
          idx = j;
          continue;
        }
      }
    }

    idx++;
  }
  return transactions;
};

const verifyBalances = (text, txns) => {
  const cleanText = text.replace(/,/g, '');
  const opMatch = cleanText.match(/(?:opening|start|brought)\s+balance\s*(?:(?:rs\.|inr|₹)?\s*([\d\.]+))/i);
  const clMatch = cleanText.match(/(?:closing|end|carried)\s+balance\s*(?:(?:rs\.|inr|₹)?\s*([\d\.]+))/i);

  if (opMatch && clMatch) {
    const openingBalance = parseFloat(opMatch[1]);
    const closingBalance = parseFloat(clMatch[1]);

    if (!isNaN(openingBalance) && !isNaN(closingBalance)) {
      let totalDebits = 0;
      let totalCredits = 0;

      txns.forEach(t => {
        if (t.type === 'income') {
          totalCredits += t.amount;
        } else {
          totalDebits += t.amount;
        }
      });

      const expectedClosing = openingBalance + totalCredits - totalDebits;
      const difference = Math.abs(expectedClosing - closingBalance);

      return {
        valid: difference < 1.0,
        openingBalance,
        closingBalance,
        calculatedClosing: expectedClosing,
        difference
      };
    }
  }
  return { valid: null, reason: 'Balances not detected in text.' };
};

// @desc   Import PDF (text-based bank statements)
// @route  POST /api/import/pdf
export const importPdf = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, error: 'No file uploaded.' });

    let text = '';
    const isTxt = req.file.originalname.match(/\.txt$/i) || req.file.mimetype === 'text/plain';

    if (isTxt) {
      text = req.file.buffer.toString('utf8');
    } else {
      const data = await pdfParse(req.file.buffer);
      text = data.text;
    }

    // Save the text to a debug file in the uploads folder to let the user inspect the layout
    try {
      const fs = require('fs');
      const path = require('path');
      const debugDir = path.join(process.cwd(), 'uploads');
      if (!fs.existsSync(debugDir)) {
        fs.mkdirSync(debugDir, { recursive: true });
      }
      fs.writeFileSync(path.join(debugDir, 'debug_extracted_text.txt'), text, 'utf8');
    } catch (e) {
      console.error('Failed to write debug text file:', e);
    }

    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);

    // Execute parsing based on detected source
    const source = detectPdfSource(text);
    let transactions = [];
    if (source === 'phonepe') {
      transactions = parsePhonePePdf(lines);
    } else if (source === 'gpay') {
      transactions = parseGPayPdf(lines);
    } else {
      transactions = parseHeuristicPdf(lines);
    }

    if (transactions.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No transactions could be parsed from this PDF. Only text-based bank statement PDFs are supported.',
        debugTextSnippet: text ? text.slice(0, 1000) : '(empty text)',
        debugLinesCount: lines.length,
        debugFirstFiveLines: lines.slice(0, 5)
      });
    }

    const verification = verifyBalances(text, transactions);

    const created = await Transaction.bulkCreate(
      transactions.map(t => ({ ...t, userId: req.user.id }))
    );

    return res.status(201).json({
      success: true,
      imported: created.length,
      data: created,
      source,
      verification
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Server Error: ' + error.message });
  }
};

// @desc   Parse uploaded statement file (without saving to DB)
// @route  POST /api/import/parse
export const parseUploadedFile = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, error: 'No file uploaded.' });

    const statementType = req.body.statementType || 'auto'; // 'phonepe', 'gpay', 'jio', 'hdfc', 'generic', 'auto'
    const name = req.file.originalname.toLowerCase();
    const mimetype = req.file.mimetype;
    const isCsv = name.match(/\.csv$/i) || mimetype === 'text/csv';
    const isExcel = name.match(/\.xlsx?$/i) || mimetype.includes('spreadsheet') || mimetype.includes('excel');

    let transactions = [];
    let format = 'generic';

    if (isCsv) {
      const rows = [];
      await new Promise((resolve, reject) => {
        const stream = Readable.from(req.file.buffer.toString('utf8'));
        stream
          .pipe(csv())
          .on('headers', (headers) => {
            if (statementType === 'auto') {
              format = detectFormat(headers);
            } else {
              format = statementType;
            }
          })
          .on('data', (row) => rows.push(row))
          .on('end', resolve)
          .on('error', reject);
      });
      transactions = rows.map(row => mapRow(row, format)).filter(Boolean);
    } else if (isExcel) {
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(req.file.buffer);
      const worksheet = workbook.worksheets[0];
      const rows = [];
      let headers = [];

      const getCellValue = (cell) => {
        if (!cell || cell.value === null || cell.value === undefined) return '';
        let val = cell.value;
        if (val && typeof val === 'object') {
          if ('result' in val) val = val.result;
          else if ('text' in val) val = val.text;
        }
        return val;
      };

      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) {
          row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
            headers[colNumber] = String(getCellValue(cell) || '').trim();
          });
        } else {
          const obj = {};
          row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
            const header = headers[colNumber];
            if (header) {
              const val = getCellValue(cell);
              obj[header] = val instanceof Date ? val.toISOString().split('T')[0] : String(val || '').trim();
            }
          });
          rows.push(obj);
        }
      });

      format = statementType === 'auto' ? detectFormat(headers.filter(Boolean)) : statementType;
      transactions = rows.map(row => mapRow(row, format)).filter(Boolean);
    } else {
      // PDF or TXT
      let text = '';
      const isTxt = name.match(/\.txt$/i) || mimetype === 'text/plain';

      if (isTxt) {
        text = req.file.buffer.toString('utf8');
      } else {
        const data = await pdfParse(req.file.buffer);
        text = data.text;
      }

      // Save to debug file in uploads folder
      try {
        const fs = require('fs');
        const path = require('path');
        const debugDir = path.join(process.cwd(), 'uploads');
        if (!fs.existsSync(debugDir)) {
          fs.mkdirSync(debugDir, { recursive: true });
        }
        fs.writeFileSync(path.join(debugDir, 'debug_extracted_text.txt'), text, 'utf8');
      } catch (e) {
        console.error('Failed to write debug text file:', e);
      }

      const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
      format = statementType === 'auto' ? detectPdfSource(text) : statementType;

      if (format === 'phonepe') {
        transactions = parsePhonePePdf(lines);
      } else if (format === 'gpay') {
        transactions = parseGPayPdf(lines);
      } else {
        transactions = parseHeuristicPdf(lines);
      }
    }

    return res.status(200).json({
      success: true,
      format,
      count: transactions.length,
      transactions
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Parser Error: ' + error.message });
  }
};

// @desc   Confirm and save parsed transactions to DB
// @route  POST /api/import/confirm
export const confirmImport = async (req, res) => {
  try {
    const { transactions } = req.body;
    if (!transactions || !Array.isArray(transactions) || transactions.length === 0) {
      return res.status(400).json({ success: false, error: 'No transactions provided to import.' });
    }

    const created = await Transaction.bulkCreate(
      transactions.map(t => ({
        description: t.description,
        amount: Math.abs(parseFloat(t.amount)) || 0,
        type: t.type,
        category: t.category || 'Other',
        date: t.date || new Date().toISOString().split('T')[0],
        payment_method: t.payment_method || '',
        source: 'import',
        userId: req.user.id
      }))
    );

    return res.status(201).json({
      success: true,
      imported: created.length
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Database Save Error: ' + error.message });
  }
};
