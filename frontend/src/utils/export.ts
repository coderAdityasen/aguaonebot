import axios from 'axios';

export interface ExportOptions {
  type?: 'qualified' | 'all';
  brand?: 'all' | 'aguaone' | 'flovax' | string;
}

/**
 * Downloads leads as a CSV file using authenticated Axios blob streaming.
 * Automatically handles auth token headers and browser file saving.
 */
export async function downloadLeadsCSV(options: ExportOptions = {}): Promise<void> {
  const { type = 'qualified', brand = 'all' } = options;

  try {
    const response = await axios.get('/api/export/csv', {
      params: { type, brand },
      responseType: 'blob'
    });

    // Extract filename from Content-Disposition header if provided
    let filename = `${brand !== 'all' ? brand + '_' : ''}${type}_leads_${Date.now()}.csv`;
    const disposition = response.headers['content-disposition'];
    if (disposition && disposition.includes('filename=')) {
      const match = disposition.match(/filename="?([^";]+)"?/);
      if (match && match[1]) {
        filename = match[1];
      }
    }

    const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8;' });
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();

    // Clean up DOM and memory
    document.body.removeChild(link);
    window.URL.revokeObjectURL(downloadUrl);
  } catch (error: any) {
    console.error('Failed to export leads CSV:', error);
    const errMsg = error.response?.data?.error || error.message || 'Failed to download CSV';
    alert(`Export Error: ${errMsg}`);
    throw error;
  }
}
