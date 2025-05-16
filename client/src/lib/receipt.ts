/**
 * Receipt generation utilities for printing invoices
 */

interface ReceiptItem {
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

interface ReceiptData {
  order: {
    id: number;
    invoiceNumber?: string;
    createdAt: string;
    customerName?: string;
    customerPhone?: string;
    customerGstin?: string;
    items: ReceiptItem[];
  };
  subtotal: number;
  cgst: number;
  sgst: number;
  total: number;
  paymentMethod: string;
}

// Get cafe info from settings for receipt
async function getCafeInfo() {
  try {
    const response = await fetch('/api/settings', { credentials: 'include' });
    if (!response.ok) throw new Error('Failed to fetch settings');
    
    const settings = await response.json();
    
    const cafeInfo = {
      name: 'Coffee Haven',
      address: '123 Coffee Street, Bangalore',
      gstin: '29AABCT1332L1ZT',
      footer: 'Thank you for visiting!'
    };
    
    // Update with actual settings if available
    settings.forEach((setting: any) => {
      switch (setting.key) {
        case 'cafe_name':
          cafeInfo.name = setting.value;
          break;
        case 'cafe_address':
          cafeInfo.address = setting.value;
          break;
        case 'gst_number':
          cafeInfo.gstin = setting.value;
          break;
        case 'receipt_footer':
          cafeInfo.footer = setting.value;
          break;
      }
    });
    
    return cafeInfo;
  } catch (error) {
    // Fall back to defaults if settings can't be fetched
    return {
      name: 'Coffee Haven',
      address: '123 Coffee Street, Bangalore',
      gstin: '29AABCT1332L1ZT',
      footer: 'Thank you for visiting!'
    };
  }
}

// Generate and print receipt
export async function saveReceipt(data: ReceiptData): Promise<void> {
  // Get cafe info from settings
  const cafeInfo = await getCafeInfo();
  
  // Format date
  const orderDate = new Date(data.order.createdAt);
  const dateString = orderDate.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
  const timeString = orderDate.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit'
  });
  
  // Create receipt content
  const receiptHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Receipt #${data.order.invoiceNumber || data.order.id}</title>
      <meta charset="utf-8">
      <style>
        @page {
          margin: 0;
          size: 80mm 200mm;
        }
        body {
          font-family: 'Courier New', monospace;
          margin: 0;
          padding: 10px;
          width: 76mm;
          font-size: 12px;
          line-height: 1.4;
        }
        .receipt-paper {
          background-color: white;
          padding: 5mm;
        }
        .header, .footer {
          text-align: center;
          margin-bottom: 10px;
        }
        .header h1 {
          font-size: 18px;
          margin: 0;
        }
        .header p {
          margin: 2px 0;
          font-size: 11px;
        }
        .divider {
          border-top: 1px dashed #000;
          margin: 8px 0;
        }
        .invoice-details {
          margin-bottom: 10px;
        }
        .invoice-details p {
          margin: 2px 0;
        }
        table {
          width: 100%;
          border-collapse: collapse;
        }
        th, td {
          text-align: left;
          padding: 3px 0;
        }
        .text-right {
          text-align: right;
        }
        .total-section {
          margin-top: 5px;
          font-weight: bold;
        }
        .info {
          font-size: 10px;
        }
        .gst-details {
          font-size: 10px;
          margin-top: 5px;
        }
        .footer p {
          margin: 2px 0;
          font-size: 11px;
        }
        .footer .thank-you {
          font-weight: bold;
          margin-top: 8px;
        }
        @media print {
          .no-print {
            display: none;
          }
        }
      </style>
    </head>
    <body>
      <div class="receipt-paper">
        <div class="header">
          <h1>${cafeInfo.name}</h1>
          <p>${cafeInfo.address}</p>
          <p>GSTIN: ${cafeInfo.gstin}</p>
          <p>Phone: +91 9876543210</p>
        </div>
        
        <div class="divider"></div>
        
        <div class="invoice-details">
          <p><strong>Invoice #:</strong> ${data.order.invoiceNumber || data.order.id}</p>
          <p><strong>Date:</strong> ${dateString} ${timeString}</p>
          ${data.order.customerName ? `<p><strong>Customer:</strong> ${data.order.customerName}</p>` : ''}
          ${data.order.customerPhone ? `<p><strong>Phone:</strong> ${data.order.customerPhone}</p>` : ''}
          ${data.order.customerGstin ? `<p><strong>GSTIN:</strong> ${data.order.customerGstin}</p>` : ''}
        </div>
        
        <div class="divider"></div>
        
        <table>
          <thead>
            <tr>
              <th>Item</th>
              <th class="text-right">Qty</th>
              <th class="text-right">Price</th>
              <th class="text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            ${data.order.items.map(item => `
              <tr>
                <td>${item.name}</td>
                <td class="text-right">${item.quantity}</td>
                <td class="text-right">₹${item.unitPrice.toFixed(2)}</td>
                <td class="text-right">₹${item.totalPrice.toFixed(2)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        
        <div class="divider"></div>
        
        <div class="total-section">
          <table>
            <tr>
              <td>Subtotal:</td>
              <td class="text-right">₹${data.subtotal.toFixed(2)}</td>
            </tr>
            <tr>
              <td>CGST (2.5%):</td>
              <td class="text-right">₹${data.cgst.toFixed(2)}</td>
            </tr>
            <tr>
              <td>SGST (2.5%):</td>
              <td class="text-right">₹${data.sgst.toFixed(2)}</td>
            </tr>
            <tr>
              <td><strong>Total:</strong></td>
              <td class="text-right"><strong>₹${data.total.toFixed(2)}</strong></td>
            </tr>
          </table>
        </div>
        
        <div class="gst-details">
          <p>Payment Method: ${data.paymentMethod.toUpperCase()}</p>
          <p>Tax Invoice under GST Act 2017</p>
          <p>Rate of tax: CGST 2.5% + SGST 2.5% = 5%</p>
        </div>
        
        <div class="divider"></div>
        
        <div class="footer">
          <p class="thank-you">${cafeInfo.footer}</p>
          <p>Powered by Coffee Haven POS</p>
        </div>
      </div>
      
      <div class="no-print" style="margin-top: 20px; text-align: center;">
        <button onclick="window.print()" style="padding: 10px 20px; background-color: #5D4037; color: white; border: none; border-radius: 4px; cursor: pointer;">
          Print Receipt
        </button>
      </div>
    </body>
    </html>
  `;
  
  // Open a new window for printing
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    throw new Error('Could not open print window. Please allow popups for this site.');
  }
  
  // Write the receipt HTML to the new window
  printWindow.document.open();
  printWindow.document.write(receiptHtml);
  printWindow.document.close();
  
  // Wait for content to load before printing
  return new Promise((resolve) => {
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.print();
        resolve();
      }, 500);
    };
  });
}
