'use client';
import { useState } from 'react';
import * as XLSX from 'xlsx';
import styles from './admin.module.css';

export default function AdminPage() {
  const [message, setMessage] = useState('');

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    const reader = new FileReader();

    reader.onload = async (e) => {
      try {
        const data = e.target.result;
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        // Remove empty rows and validate format
        const cleanData = jsonData.filter(row => row.length >= 3);
        
        if (cleanData.length < 2) {
          setMessage('Error: Excel file must contain at least a header row and one question');
          return;
        }

        // Validate header row
        const headerRow = cleanData[0];
        if (!headerRow.includes('trait') || !headerRow.includes('english') || !headerRow.includes('urdu')) {
          setMessage('Error: Excel file must have columns: trait, english, urdu');
          return;
        }

        // Store the questions in localStorage
        const questions = cleanData.slice(1).map(row => ({
          trait: row[headerRow.indexOf('trait')],
          english: row[headerRow.indexOf('english')],
          urdu: row[headerRow.indexOf('urdu')]
        }));

        localStorage.setItem('questions', JSON.stringify(questions));
        setMessage('Questions uploaded successfully!');
      } catch (error) {
        setMessage('Error processing file: ' + error.message);
      }
    };

    if (file) {
      reader.readAsArrayBuffer(file);
    }
  };

  return (
    <div className={styles.adminContainer}>
      <h1>Admin Dashboard</h1>
      <div className={styles.uploadSection}>
        <h2>Upload Questions Excel File</h2>
        <p>File must contain columns: trait, english, urdu</p>
        <input
          type="file"
          accept=".xlsx,.xls"
          onChange={handleFileUpload}
          className={styles.fileInput}
        />
        {message && <p className={styles.message}>{message}</p>}
      </div>
    </div>
  );
} 