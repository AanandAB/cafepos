import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { gstCalculator } from "@/lib/gst";
import { useAuth } from "@/hooks/useAuth";
import { saveReceipt } from "@/lib/receipt";
import { CreditCard, Printer, Loader2 } from "lucide-react";
import type { CartItem } from "../PosLayout";

type PaymentModalProps = {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  selectedTable: number | null;
  total: number;
  onSuccess: () => void;
};

export default function PaymentModal({
  isOpen,
  onClose,
  cart,
  selectedTable,
  total,
  onSuccess
}: PaymentModalProps) {
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "card" | "upi" | "other">("cash");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerGstin, setCustomerGstin] = useState("");
  const [printReceipt, setPrintReceipt] = useState(true);
  
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const { subtotal, cgst, sgst, total: finalTotal } = gstCalculator(total);
  
  // Create order mutation
  const createOrderMutation = useMutation({
    mutationFn: async () => {
      // First create the order
      const orderResponse = await apiRequest("POST", "/api/orders", {
        tableId: selectedTable,
        status: "pending",
        paymentMethod,
        customerName: customerName || null,
        customerPhone: customerPhone || null,
        customerGstin: customerGstin || null
      });
      
      const orderData = await orderResponse.json();
      
      // Then create order items
      const orderItemPromises = cart.map(item => 
        apiRequest("POST", "/api/order-items", {
          orderId: orderData.id,
          menuItemId: item.menuItemId,
          quantity: item.quantity,
          notes: item.notes
        })
      );
      
      await Promise.all(orderItemPromises);
      
      // Complete the order
      const completedOrderResponse = await apiRequest("PUT", `/api/orders/${orderData.id}`, {
        status: "completed"
      });
      
      const completedOrder = await completedOrderResponse.json();
      
      // Generate and print receipt if needed
      if (printReceipt) {
        await saveReceipt({
          order: {
            ...completedOrder,
            items: cart.map(item => ({
              name: item.name,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              totalPrice: item.totalPrice
            }))
          },
          subtotal,
          cgst,
          sgst,
          total: finalTotal,
          paymentMethod
        });
      }
      
      return completedOrder;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tables'] });
      queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
      queryClient.invalidateQueries({ queryKey: ['/api/orders/active'] });
      
      toast({
        title: "Order completed",
        description: "Payment processed successfully",
      });
      
      onSuccess();
      onClose();
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Payment failed",
        description: error.message || "There was an error processing the payment"
      });
    }
  });
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createOrderMutation.mutate();
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Process Payment</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <h3 className="font-medium">Order Summary</h3>
              <div className="text-sm space-y-1">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>₹{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>CGST (2.5%):</span>
                  <span>₹{cgst.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>SGST (2.5%):</span>
                  <span>₹{sgst.toFixed(2)}</span>
                </div>
                <Separator className="my-2" />
                <div className="flex justify-between font-semibold">
                  <span>Total:</span>
                  <span>₹{finalTotal.toFixed(2)}</span>
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="payment-method">Payment Method</Label>
              <RadioGroup id="payment-method" value={paymentMethod} onValueChange={(value) => setPaymentMethod(value as any)}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="cash" id="cash" />
                  <Label htmlFor="cash">Cash</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="card" id="card" />
                  <Label htmlFor="card">Card</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="upi" id="upi" />
                  <Label htmlFor="upi">UPI</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="other" id="other" />
                  <Label htmlFor="other">Other</Label>
                </div>
              </RadioGroup>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="customer-name" className="text-sm font-medium">Customer Details (Optional)</Label>
              <Input
                id="customer-name"
                placeholder="Customer Name"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
              />
              <Input
                id="customer-phone"
                placeholder="Phone Number"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
              />
              <Input
                id="customer-gstin"
                placeholder="GSTIN (if applicable)"
                value={customerGstin}
                onChange={(e) => setCustomerGstin(e.target.value)}
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="print-receipt" 
                checked={printReceipt} 
                onCheckedChange={(checked) => setPrintReceipt(!!checked)} 
              />
              <Label htmlFor="print-receipt" className="text-sm">
                Print Receipt
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={createOrderMutation.isPending}>
              {createOrderMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CreditCard className="mr-2 h-4 w-4" />
                  Complete Payment
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
