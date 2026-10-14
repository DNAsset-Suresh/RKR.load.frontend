'use client';

import { useState, useRef, useEffect } from 'react';
import Script from 'next/script';
import api from '@/services/api';
import ConfirmationModal from './ConfirmationModal';
import { normaliseVehicle, parseKg } from '@/utils/format';

export default function BulkUploadModal({ open, onClose, onUploaded }) {
  const [step, setStep] = useState('select'); // select, preview, uploading, complete
  const [fileData, setFileData] = useState(null);
  const [defaultMaterial, setDefaultMaterial] = useState('40mm');
  const [validRows, setValidRows] = useState([]);
  const [invalidRows, setInvalidRows] = useState([]);
  const [uploadSummary, setUploadSummary] = useState(null);
  const [error, setError] = useState('');

  const fileInputRef = useRef(null);

  // Reset state when opened/closed
  useEffect(() => {
    if (open) {
      setStep('select');
      setFileData(null);
      setDefaultMaterial('40mm');
      setValidRows([]);
      setInvalidRows([]);
      setUploadSummary(null);
      setError('');
    }
  }, [open]);

  // Convert Excel serial date to ISO YYYY-MM-DD
  const excelDateToJSDate = (excelDate) => {
    if (!excelDate) return null;
    if (typeof excelDate === 'string') {
      const parts = excelDate.split(/[-/]/);
      if (parts.length === 3) {
        if (parts[0].length === 4) return `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
        return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
      }
      return excelDate;
    }
    const jsDate = new Date(Math.round((excelDate - 25569) * 86400 * 1000));
    return jsDate.toISOString().split('T')[0];
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileData(file);
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        if (!window.XLSX) {
          setError('Excel processing library is still loading. Please try again in a moment.');
          return;
        }

        const data = evt.target.result;
        const workbook = window.XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];

        const jsonData = window.XLSX.utils.sheet_to_json(sheet, { raw: true, defval: '' });

        const valid = [];
        const invalid = [];

        jsonData.forEach((row, index) => {
          const keys = Object.keys(row);
          const dateKey = keys.find(k => k.toLowerCase().includes('date'));
          const vehicleKey = keys.find(k => k.toLowerCase().includes('vehicle'));
          const weightKey = keys.find(k => k.toLowerCase().includes('weight'));
          const materialKey = keys.find(k => k.toLowerCase().includes('material') || k.toLowerCase().includes('segment'));

          const excelDate = dateKey ? row[dateKey] : '';
          const rawVehicle = vehicleKey ? String(row[vehicleKey]) : '';
          const rawWeight = weightKey ? String(row[weightKey]) : '';

          let parsedMaterial = defaultMaterial;
          if (materialKey && row[materialKey]) {
            const mStr = String(row[materialKey]).trim().toLowerCase();
            if (mStr.includes('dust')) {
              parsedMaterial = 'Dust';
            } else if (mStr.includes('40')) {
              parsedMaterial = '40mm';
            }
          }

          let isValid = true;
          let errorMessage = '';

          // Validate Date
          let parsedDate = '';
          if (!excelDate) {
            isValid = false;
            errorMessage = 'Date is required';
          } else {
            parsedDate = excelDateToJSDate(excelDate);
            if (!parsedDate || isNaN(new Date(parsedDate).getTime())) {
              isValid = false;
              errorMessage = 'Invalid Date format';
            }
          }

          // Validate Vehicle
          const parsedVehicle = normaliseVehicle(rawVehicle);
          if (isValid && !parsedVehicle) {
            isValid = false;
            errorMessage = 'Vehicle number is required';
          }

          // Validate Weight
          const parsedWeight = parseKg(rawWeight);
          if (isValid && (parsedWeight === null || isNaN(parsedWeight) || parsedWeight <= 0)) {
            isValid = false;
            errorMessage = 'Weight must be a valid number greater than 0';
          }

          const record = {
            rowNum: index + 2,
            date: parsedDate,
            vehicleNumber: parsedVehicle,
            weightKg: parsedWeight,
            material: parsedMaterial,
            errorReason: errorMessage
          };

          if (isValid) {
            valid.push(record);
          } else {
            invalid.push(record);
          }
        });

        setValidRows(valid);
        setInvalidRows(invalid);
        setStep('preview');
      } catch (err) {
        setError('Failed to parse Excel file. Please ensure it is a valid .xlsx file.');
        console.error(err);
      }
    };
    reader.readAsBinaryString(file);
  };

  const downloadTemplate = () => {
    if (!window.XLSX) return;
    const ws = window.XLSX.utils.json_to_sheet([
      { Date: '29-09-2026', 'Vehicle Number': 'TN01AB1234', Material: '40mm', Weight: 8500 },
      { Date: '29-09-2026', 'Vehicle Number': 'TN01CD5678', Material: 'Dust', Weight: 10000 }
    ]);
    const wb = window.XLSX.utils.book_new();
    window.XLSX.utils.book_append_sheet(wb, ws, 'Loads');
    window.XLSX.writeFile(wb, 'RKR_Bulk_Upload_Template.xlsx');
  };

  const downloadErrorExcel = () => {
    if (!window.XLSX || invalidRows.length === 0) return;
    const ws = window.XLSX.utils.json_to_sheet(invalidRows.map(r => ({
      Date: r.date || '',
      'Vehicle Number': r.vehicleNumber || '',
      Material: r.material || defaultMaterial,
      Weight: r.weightKg || '',
      'Error Reason': r.errorReason
    })));
    const wb = window.XLSX.utils.book_new();
    window.XLSX.utils.book_append_sheet(wb, ws, 'Invalid Loads');
    window.XLSX.writeFile(wb, 'RKR_Upload_Errors.xlsx');
  };

  const handleUpload = async () => {
    if (validRows.length === 0) return;

    setStep('uploading');
    setError('');

    try {
      const payload = validRows.map(r => ({
        date: r.date,
        vehicleNumber: r.vehicleNumber,
        weightKg: r.weightKg,
        material: r.material || defaultMaterial
      }));

      const res = await api.transactions.bulkUpload(payload, defaultMaterial);
      setUploadSummary(res.data);
      setStep('complete');
    } catch (err) {
      setError(err.message || 'Failed to upload records.');
      setStep('preview');
    }
  };

  const handleClose = () => {
    if (step === 'complete' && onUploaded) {
      onUploaded();
    }
    onClose();
  };

  if (!open) return null;

  return (
    <>
      <Script src="https://cdn.sheetjs.com/xlsx-0.20.1/package/dist/xlsx.full.min.js" strategy="lazyOnload" />

      <ConfirmationModal
        open={open}
        title="Bulk Load Upload"
        onClose={handleClose}
        footer={
          <>
            {step === 'select' && (
              <button className="tbtn" onClick={downloadTemplate}>Download Template</button>
            )}
            {step === 'preview' && (
              <>
                <button className="tbtn" onClick={() => setStep('select')}>Cancel</button>
                <button className="tbtn primary" onClick={handleUpload} disabled={validRows.length === 0}>
                  Upload {validRows.length} Valid Rows
                </button>
              </>
            )}
            {step === 'complete' && (
              <button className="tbtn primary" onClick={handleClose}>Done</button>
            )}
          </>
        }
      >
        <div style={{ minHeight: '300px' }}>
          {error && <div className="alert" style={{ marginBottom: 16 }}>{error}</div>}

          {step === 'select' && (
            <div style={{ textAlign: 'center', padding: '30px 0' }}>
              <p style={{ color: 'var(--muted)', marginBottom: 16 }}>
                Upload an Excel (.xlsx) file containing load records.<br />
                Columns: <strong>Date, Vehicle Number, Material (40mm / Dust), Weight</strong>
              </p>

              {/* Default material picker if file lacks Material column */}
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 10,
                background: 'var(--surface-2)',
                border: '1px solid var(--hair)',
                borderRadius: 8,
                padding: '6px 14px',
                marginBottom: 20
              }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)' }}>
                  Default Segment (if not specified in file):
                </span>
                <div style={{ display: 'inline-flex', gap: 4 }}>
                  <button
                    type="button"
                    className={`mat-pill${defaultMaterial === '40mm' ? ' active-40mm' : ''}`}
                    onClick={() => setDefaultMaterial('40mm')}
                    style={{ cursor: 'pointer', padding: '3px 10px', fontSize: 11 }}
                  >
                    40mm
                  </button>
                  <button
                    type="button"
                    className={`mat-pill${defaultMaterial === 'Dust' ? ' active-dust' : ''}`}
                    onClick={() => setDefaultMaterial('Dust')}
                    style={{ cursor: 'pointer', padding: '3px 10px', fontSize: 11 }}
                  >
                    Dust
                  </button>
                </div>
              </div>

              <div>
                <input
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  ref={fileInputRef}
                  style={{ display: 'none' }}
                  onChange={handleFileUpload}
                />
                <button className="tbtn primary" onClick={() => fileInputRef.current?.click()}>
                  Select Excel File
                </button>
              </div>
            </div>
          )}

          {step === 'preview' && (
            <div>
              <div style={{ display: 'flex', gap: 20, marginBottom: 16, alignItems: 'center' }}>
                <div>Total Rows: <strong>{validRows.length + invalidRows.length}</strong></div>
                <div style={{ color: 'var(--pos)' }}>Valid: <strong>{validRows.length}</strong></div>
                <div style={{ color: 'var(--faint)' }}>Invalid: <strong>{invalidRows.length}</strong></div>
              </div>

              {invalidRows.length > 0 && (
                <div className="alert" style={{ marginBottom: 16 }}>
                  <div>
                    <div className="alert-title">Found {invalidRows.length} invalid records</div>
                    <div className="alert-body">
                      These records will be skipped during upload.
                      <br /><br />
                      <button className="tbtn" onClick={downloadErrorExcel} style={{ padding: '4px 10px', fontSize: 12 }}>
                        Download Error Excel
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <div className="table-wrap" style={{ maxHeight: '350px', overflowY: 'auto' }}>
                <table className="table" style={{ width: '100%' }}>
                  <thead>
                    <tr>
                      <th>Row</th>
                      <th>Date</th>
                      <th>Vehicle</th>
                      <th>Material</th>
                      <th className="r">Weight KG</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invalidRows.slice(0, 20).map((r, i) => (
                      <tr key={`inv-${i}`}>
                        <td>{r.rowNum}</td>
                        <td>{r.date || '-'}</td>
                        <td>{r.vehicleNumber || '-'}</td>
                        <td><span className={`mat-badge ${r.material === 'Dust' ? 'dust' : 'm40'}`}>{r.material}</span></td>
                        <td className="r">{r.weightKg || '-'}</td>
                        <td style={{ color: 'var(--neg)' }}>{'\u274c'} {r.errorReason}</td>
                      </tr>
                    ))}
                    {validRows.slice(0, Math.max(0, 20 - invalidRows.length)).map((r, i) => (
                      <tr key={`val-${i}`}>
                        <td>{r.rowNum}</td>
                        <td>{r.date}</td>
                        <td>{r.vehicleNumber}</td>
                        <td><span className={`mat-badge ${r.material === 'Dust' ? 'dust' : 'm40'}`}>{r.material}</span></td>
                        <td className="r">{r.weightKg}</td>
                        <td style={{ color: 'var(--pos)' }}>{'\u2713'} Valid</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {(validRows.length + invalidRows.length) > 20 && (
                <p style={{ color: 'var(--faint)', textAlign: 'center', marginTop: 10, fontSize: 12 }}>
                  Showing first 20 records
                </p>
              )}
            </div>
          )}

          {step === 'uploading' && (
            <div style={{ textAlign: 'center', padding: '60px 0' }}>
              <span className="spinner" style={{ display: 'inline-block', marginBottom: 20, transform: 'scale(2)' }} />
              <h3 style={{ fontSize: 16 }}>Processing Loads...</h3>
              <p style={{ color: 'var(--muted)' }}>Uploading {validRows.length} valid records to the database.</p>
            </div>
          )}

          {step === 'complete' && uploadSummary && (
            <div style={{ padding: '20px 0' }}>
              <h3 style={{ fontSize: 18, color: 'var(--pos)', marginBottom: 20 }}>Upload Completed Successfully</h3>

              <dl className="dl">
                <dt>Total Excel Rows</dt>
                <dd>{uploadSummary.totalRows}</dd>

                <dt>Successfully Uploaded</dt>
                <dd className="gold">{uploadSummary.uploadedRows}</dd>

                <dt>Skipped (Duplicates)</dt>
                <dd style={{ color: 'var(--muted)' }}>{uploadSummary.duplicateRows}</dd>

                <dt>Skipped (Invalid)</dt>
                <dd style={{ color: 'var(--muted)' }}>{invalidRows.length}</dd>
              </dl>

              {uploadSummary.duplicateRows > 0 && (
                <div className="alert" style={{ marginTop: 20 }}>
                  <div>
                    <div className="alert-title">{uploadSummary.duplicateRows} Duplicate Records Skipped</div>
                    <div className="alert-body">
                      These loads were already present in the database with the exact same date, vehicle, material, and weight.
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </ConfirmationModal>
    </>
  );
}
