/**
 * PDF generation utilities for reports and invoices
 */

// Helper function to generate PDFs using browser's print functionality
export async function generateReportPDF(reportData: any): Promise<void> {
  // Create a new window for printing
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    throw new Error('Could not open print window. Please allow popups for this site.');
  }
  
  // Get date range in readable format
  const fromDate = new Date(reportData.dateRange.from);
  const toDate = new Date(reportData.dateRange.to);
  const fromDateStr = fromDate.toLocaleDateString('en-IN', { 
    day: '2-digit',
    month: 'short',
    year: 'numeric' 
  });
  const toDateStr = toDate.toLocaleDateString('en-IN', { 
    day: '2-digit',
    month: 'short',
    year: 'numeric' 
  });
  
  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', { 
      style: 'currency', 
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(amount);
  };
  
  // Create HTML content for the report
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Sales Report: ${fromDateStr} to ${toDateStr}</title>
      <meta charset="utf-8" />
      <style>
        body {
          font-family: Arial, sans-serif;
          margin: 20px;
          color: #333;
        }
        h1, h2, h3 {
          color: #5D4037;
        }
        .report-header {
          text-align: center;
          margin-bottom: 30px;
          padding-bottom: 10px;
          border-bottom: 2px solid #5D4037;
        }
        .report-summary {
          display: flex;
          justify-content: space-between;
          margin-bottom: 20px;
          flex-wrap: wrap;
        }
        .summary-card {
          background-color: #f5f5f5;
          border-radius: 5px;
          padding: 15px;
          margin-bottom: 15px;
          min-width: 200px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .summary-title {
          font-size: 14px;
          color: #777;
          margin-bottom: 5px;
        }
        .summary-value {
          font-size: 24px;
          font-weight: bold;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 20px;
        }
        th, td {
          border: 1px solid #ddd;
          padding: 12px;
          text-align: left;
        }
        th {
          background-color: #f2f2f2;
          font-weight: bold;
        }
        tr:nth-child(even) {
          background-color: #f9f9f9;
        }
        .footer {
          margin-top: 30px;
          text-align: center;
          font-size: 12px;
          color: #777;
        }
        @media print {
          body {
            margin: 0;
            padding: 15px;
          }
          button {
            display: none;
          }
        }
      </style>
    </head>
    <body>
      <div class="report-header">
        <h1>Sales Report</h1>
        <p>${reportData.reportType.charAt(0).toUpperCase() + reportData.reportType.slice(1)} Report: ${fromDateStr} to ${toDateStr}</p>
      </div>
      
      <div class="report-summary">
        <div class="summary-card">
          <div class="summary-title">Total Sales</div>
          <div class="summary-value">${formatCurrency(reportData.salesData.totalSales || 0)}</div>
        </div>
        
        <div class="summary-card">
          <div class="summary-title">Total Orders</div>
          <div class="summary-value">${reportData.salesData.totalOrders || 0}</div>
        </div>
        
        <div class="summary-card">
          <div class="summary-title">Average Order Value</div>
          <div class="summary-value">
            ${reportData.salesData.totalOrders > 0 
              ? formatCurrency(reportData.salesData.totalSales / reportData.salesData.totalOrders) 
              : formatCurrency(0)}
          </div>
        </div>
        
        <div class="summary-card">
          <div class="summary-title">Total Tax Collected</div>
          <div class="summary-value">${formatCurrency(reportData.salesData.totalTax || 0)}</div>
        </div>
      </div>
      
      <h2>Payment Method Breakdown</h2>
      <table>
        <thead>
          <tr>
            <th>Payment Method</th>
            <th>Amount</th>
            <th>Percentage</th>
          </tr>
        </thead>
        <tbody>
          ${reportData.salesByPaymentMethod.map((method: any) => {
            const percentage = (method.value / reportData.salesData.totalSales * 100).toFixed(2);
            return `
              <tr>
                <td>${method.name}</td>
                <td>${formatCurrency(method.value)}</td>
                <td>${percentage}%</td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
      
      <h2>Orders</h2>
      <table>
        <thead>
          <tr>
            <th>Invoice #</th>
            <th>Date</th>
            <th>Customer</th>
            <th>Payment Method</th>
            <th>Amount</th>
          </tr>
        </thead>
        <tbody>
          ${reportData.salesData.orders.map((order: any) => {
            const date = new Date(order.createdAt).toLocaleDateString('en-IN', {
              day: '2-digit', 
              month: 'short', 
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            });
            return `
              <tr>
                <td>${order.invoiceNumber || `#${order.id}`}</td>
                <td>${date}</td>
                <td>${order.customerName || 'Walk-in'}</td>
                <td>${order.paymentMethod ? order.paymentMethod.charAt(0).toUpperCase() + order.paymentMethod.slice(1) : 'N/A'}</td>
                <td>${formatCurrency(order.totalAmount)}</td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
      
      <div class="footer">
        <p>Generated on ${new Date().toLocaleString('en-IN')}</p>
        <p>Coffee Haven POS System</p>
      </div>
      
      <button onclick="window.print()" style="margin-top: 20px; padding: 10px 20px; background-color: #5D4037; color: white; border: none; border-radius: 4px; cursor: pointer;">
        Print Report
      </button>
    </body>
    </html>
  `;
  
  // Write content to the new window and trigger print
  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
  
  // Allow time for styles to load before printing
  return new Promise((resolve, reject) => {
    printWindow.onload = () => {
      setTimeout(() => {
        try {
          printWindow.print();
          resolve();
        } catch (error) {
          reject(error);
        }
      }, 500);
    };
  });
}
