import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Trash2, MinusCircle, PlusCircle, CreditCard } from "lucide-react";
import { type CartItem } from "../PosLayout";
import { useQuery } from "@tanstack/react-query";
import { gstCalculator } from "@/lib/gst";

type OrderSummaryProps = {
  cart: CartItem[];
  selectedTable: number | null;
  onUpdateItem: (id: number, quantity: number) => void;
  onRemoveItem: (id: number) => void;
  onClearCart: () => void;
  onPayment: () => void;
  isTakeaway?: boolean;
  onTakeawayToggle?: (isTakeaway: boolean) => void;
};

export default function OrderSummary({
  cart,
  selectedTable,
  onUpdateItem,
  onRemoveItem,
  onClearCart,
  onPayment,
  isTakeaway = false,
  onTakeawayToggle
}: OrderSummaryProps) {
  // Fetch table information if a table is selected
  const { data: tableInfo } = useQuery({
    queryKey: ['/api/tables', selectedTable],
    enabled: selectedTable !== null
  });
  
  // Calculate totals with item-specific tax rates
  const subtotal = cart.reduce((sum, item) => sum + item.totalPrice, 0);
  
  // Calculate GST for each item based on its specific tax rate
  const taxAmounts = cart.reduce((result, item) => {
    const itemGst = gstCalculator(item.totalPrice, { rate: item.taxRate });
    return {
      cgst: result.cgst + itemGst.cgst,
      sgst: result.sgst + itemGst.sgst,
      igst: result.igst + itemGst.igst
    };
  }, { cgst: 0, sgst: 0, igst: 0 });
  
  const total = subtotal + taxAmounts.cgst + taxAmounts.sgst + taxAmounts.igst;
  
  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="py-3 px-4">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg">Order Summary</CardTitle>
          <div className="flex flex-col items-end gap-2">
            {selectedTable && !isTakeaway && (
              <div className="text-sm px-2 py-1 bg-blue-100 dark:bg-blue-900 rounded">
                Table: {tableInfo?.name || selectedTable}
              </div>
            )}
            {isTakeaway && (
              <div className="text-sm px-2 py-1 bg-green-100 dark:bg-green-900 rounded">
                Takeaway Order
              </div>
            )}
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs">Takeaway:</span>
              <button 
                onClick={() => onTakeawayToggle?.(!isTakeaway)} 
                className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${isTakeaway ? 'bg-green-500' : 'bg-gray-300'}`}
              >
                <span 
                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${isTakeaway ? 'translate-x-4' : 'translate-x-0'}`}
                />
              </button>
            </div>
          </div>
        </div>
      </CardHeader>
      
      {cart.length > 0 ? (
        <>
          <ScrollArea className="flex-1 px-4">
            <div className="space-y-4">
              {cart.map((item) => (
                <div key={item.id} className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex justify-between">
                      <h4 className="font-medium">{item.name}</h4>
                      <span className="font-medium">₹{item.totalPrice.toFixed(2)}</span>
                    </div>
                    <div className="flex items-center mt-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => onUpdateItem(item.id, item.quantity - 1)}
                      >
                        <MinusCircle className="h-4 w-4" />
                      </Button>
                      <span className="mx-2">{item.quantity}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => onUpdateItem(item.id, item.quantity + 1)}
                      >
                        <PlusCircle className="h-4 w-4" />
                      </Button>
                      <span className="mx-2 text-sm text-muted-foreground">
                        × ₹{item.unitPrice.toFixed(2)}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 ml-auto"
                        onClick={() => onRemoveItem(item.id)}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
          
          <CardFooter className="flex-col p-4 space-y-4">
            <Separator />
            <div className="w-full space-y-2">
              <div className="flex justify-between text-sm">
                <span>Subtotal</span>
                <span>₹{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>CGST</span>
                <span>₹{taxAmounts.cgst.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>SGST</span>
                <span>₹{taxAmounts.sgst.toFixed(2)}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-bold">
                <span>Total</span>
                <span>₹{total.toFixed(2)}</span>
              </div>
            </div>
            
            <div className="flex w-full gap-2">
              <Button variant="destructive" className="flex-1" onClick={onClearCart}>
                Clear
              </Button>
              <Button variant="default" className="flex-1" onClick={onPayment}>
                <CreditCard className="mr-2 h-4 w-4" />
                Payment
              </Button>
            </div>
          </CardFooter>
        </>
      ) : (
        <CardContent className="flex-1 flex items-center justify-center p-6">
          <div className="text-center">
            <h3 className="font-medium">Your cart is empty</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Add items from the menu to get started
            </p>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
