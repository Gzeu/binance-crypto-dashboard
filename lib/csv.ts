import { AssetBalance } from './types';

/**
 * Exports portfolio data to CSV format
 * @param balances Array of asset balances
 * @param filename Name of the CSV file to download
 */
export function exportToCSV(balances: AssetBalance[], filename: string = 'portfolio-export.csv') {
  if (!balances || balances.length === 0) {
    console.warn('No data to export');
    return;
  }

  // Define CSV headers
  const headers = [
    'Asset',
    'Free Balance',
    'Locked Balance', 
    'Total Balance',
    'Price (USDT)',
    'Value (USDT)',
  ];

  // Convert data to CSV format
  const csvContent = [
    // Add headers
    headers.join(','),
    // Add data rows
    ...balances.map(balance => [
      balance.asset,
      balance.free,
      balance.locked,
      balance.total,
      balance.priceUSDT,
      balance.valueUSDT,
    ].join(',')),
    // Add summary row
    '',
    `Total Portfolio Value (USDT),,,,,${balances.reduce((sum, balance) => sum + parseFloat(balance.valueUSDT), 0).toFixed(2)}`,
    `Export Date,,,,,${new Date().toISOString()}`,
    `Asset Count,,,,,${balances.length}`,
  ].join('\n');

  // Create and download the file
  try {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up the URL object
      URL.revokeObjectURL(url);
    }
  } catch (error) {
    console.error('Error exporting CSV:', error);
    // Fallback: copy to clipboard
    navigator.clipboard?.writeText(csvContent).then(() => {
      alert('CSV data copied to clipboard!');
    }).catch(() => {
      console.error('Failed to copy to clipboard');
    });
  }
}

/**
 * Formats a date for CSV export
 * @param date Date object or ISO string
 * @returns Formatted date string
 */
export function formatDateForCSV(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toISOString().split('T')[0]; // Returns YYYY-MM-DD format
}

/**
 * Escapes CSV field if it contains special characters
 * @param field The field to escape
 * @returns Escaped field
 */
export function escapeCSVField(field: string): string {
  if (field.includes(',') || field.includes('"') || field.includes('\n')) {
    return `"${field.replace(/"/g, '""')}"`;
  }
  return field;
}
