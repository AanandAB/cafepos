/**
 * Calculate GST (Goods and Services Tax) for Indian taxation system
 * Default GST rate for cafes and restaurants is 5% (2.5% CGST + 2.5% SGST)
 */

// Default GST rate for food and beverages in India
const DEFAULT_GST_RATE = 5; // 5%

interface GSTResult {
  subtotal: number;
  cgst: number;
  sgst: number;
  igst: number;
  total: number;
}

/**
 * Calculate GST based on subtotal amount
 * By default uses CGST+SGST (intra-state) split with 5% rate
 */
export function gstCalculator(
  subtotal: number,
  options: {
    rate?: number;
    type?: 'cgst_sgst' | 'igst';
  } = {}
): GSTResult {
  const rate = options.rate ?? DEFAULT_GST_RATE;
  const type = options.type ?? 'cgst_sgst';
  
  // For inter-state transactions use IGST
  // For intra-state transactions split into CGST and SGST
  if (type === 'igst') {
    const igst = (subtotal * rate) / 100;
    return {
      subtotal,
      cgst: 0,
      sgst: 0,
      igst,
      total: subtotal + igst
    };
  } else {
    // Split the rate in half for CGST and SGST
    const halfRate = rate / 2;
    const cgst = (subtotal * halfRate) / 100;
    const sgst = (subtotal * halfRate) / 100;
    
    return {
      subtotal,
      cgst,
      sgst,
      igst: 0,
      total: subtotal + cgst + sgst
    };
  }
}

/**
 * Calculate each item's GST amount based on rate
 */
export function calculateItemGST(price: number, quantity: number, rate: number = DEFAULT_GST_RATE): {
  subtotal: number;
  gstAmount: number;
  total: number;
} {
  const subtotal = price * quantity;
  const gstAmount = (subtotal * rate) / 100;
  const total = subtotal + gstAmount;
  
  return {
    subtotal,
    gstAmount,
    total
  };
}

/**
 * Get GST rates for different categories
 */
export const GST_RATES = {
  FOOD_AND_BEVERAGES: 5, // 5%
  ALCOHOL: 18, // 18%
  LUXURY_ITEMS: 28 // 28%
};
