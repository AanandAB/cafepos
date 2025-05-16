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
  isTakeaway?: boolean;
};

export default function PaymentModal({
  isOpen,
  onClose,
  cart,
  selectedTable,
  total,
  onSuccess,
  isTakeaway = false
}: PaymentModalProps) {
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "card" | "upi" | "other">("cash");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerGstin, setCustomerGstin] = useState("");
  const [printReceipt, setPrintReceipt] = useState(true);
  const [upiId, setUpiId] = useState("");
  const [upiTransactionId, setUpiTransactionId] = useState("");
  const [waitingForUpiPayment, setWaitingForUpiPayment] = useState(false);
  const [upiPaymentReceived, setUpiPaymentReceived] = useState(false);
  
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const { subtotal, cgst, sgst, total: finalTotal } = gstCalculator(total);
  
  // Simulate UPI payment check (in a real app, this would connect to a payment gateway)
  const checkUpiPaymentStatus = async () => {
    // This is a placeholder for actual UPI payment verification
    // In a production environment, you would integrate with a payment gateway
    // and check if the payment has been received
    
    return new Promise<boolean>((resolve) => {
      // Simulate a network request
      setTimeout(() => {
        // Simulate successful payment
        if (upiTransactionId.trim()) {
          setUpiPaymentReceived(true);
          resolve(true);
        } else {
          resolve(false);
        }
      }, 1500);
    });
  };
  
  // Create order mutation
  const createOrderMutation = useMutation({
    mutationFn: async () => {
      // For UPI payments, verify payment first
      if (paymentMethod === "upi" && !upiPaymentReceived) {
        const paymentSuccess = await checkUpiPaymentStatus();
        if (!paymentSuccess) {
          throw new Error("UPI payment verification failed. Please check the transaction ID.");
        }
      }
      
      // Include isTakeaway flag and UPI information if applicable
      const upiData = paymentMethod === "upi" ? {
        upiId: upiId || null,
        transactionId: upiTransactionId || null
      } : {};
      
      // First create the order
      const orderResponse = await apiRequest("POST", "/api/orders", {
        tableId: isTakeaway ? null : selectedTable,
        status: "pending",
        paymentMethod,
        customerName: customerName || null,
        customerPhone: customerPhone || null,
        customerGstin: customerGstin || null,
        isTakeaway: isTakeaway,
        ...upiData
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
    
    // For UPI payments, first check payment status if not already verified
    if (paymentMethod === "upi" && !upiPaymentReceived) {
      setWaitingForUpiPayment(true);
      
      // This will be automatically handled in the mutation
      createOrderMutation.mutate();
    } else {
      createOrderMutation.mutate();
    }
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
            
            {/* UPI Payment Details (only shown when UPI payment method is selected) */}
            {paymentMethod === "upi" && (
              <div className="space-y-2 border-2 border-blue-100 dark:border-blue-900 p-3 rounded-md">
                <Label htmlFor="upi-id" className="text-sm font-medium">UPI Payment Details</Label>
                <Input
                  id="upi-id"
                  placeholder="Your UPI ID (e.g. name@upi)"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  required={paymentMethod === "upi"}
                />
                
                {!upiPaymentReceived ? (
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground">
                      {waitingForUpiPayment 
                        ? "Verifying payment..." 
                        : "Enter transaction ID after customer makes payment"}
                    </p>
                    <Input
                      id="upi-transaction"
                      placeholder="UPI Transaction ID"
                      value={upiTransactionId}
                      onChange={(e) => setUpiTransactionId(e.target.value)}
                      required={paymentMethod === "upi"}
                      disabled={waitingForUpiPayment}
                    />
                    {waitingForUpiPayment && (
                      <div className="flex items-center justify-center py-2">
                        <Loader2 className="h-5 w-5 animate-spin text-blue-500 mr-2" />
                        <span className="text-sm">Waiting for payment confirmation...</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-2 bg-green-100 dark:bg-green-900 rounded-md text-center">
                    <p className="text-sm font-medium text-green-800 dark:text-green-200">
                      Payment Received ✓
                    </p>
                  </div>
                )}
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="customer-name" className="text-sm font-medium">Customer Details {isTakeaway ? "(Required for Takeaway)" : "(Optional)"}</Label>
              <Input
                id="customer-name"
                placeholder="Customer Name"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                required={isTakeaway}
              />
              <Input
                id="customer-phone"
                placeholder="Phone Number"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                required={isTakeaway}
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
            <Button 
              type="submit" 
              disabled={createOrderMutation.isPending || (paymentMethod === "upi" && waitingForUpiPayment && !upiPaymentReceived)}
            >
              {createOrderMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : paymentMethod === "upi" && !upiPaymentReceived ? (
                <>
                  <CreditCard className="mr-2 h-4 w-4" />
                  Verify UPI Payment
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
