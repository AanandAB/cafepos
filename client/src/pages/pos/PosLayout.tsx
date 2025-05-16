import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

import MenuItems from "./components/MenuItems";
import OrderSummary from "./components/OrderSummary";
import TableSelection from "./components/TableSelection";
import PaymentModal from "./components/PaymentModal";

export type CartItem = {
  id: number;
  menuItemId: number;
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  notes?: string;
};

export default function PosLayout() {
  const [selectedTable, setSelectedTable] = useState<number | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [activeOrder, setActiveOrder] = useState<any | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  
  const { toast } = useToast();
  
  // Fetch all categories for the menu
  const { data: categories, isLoading: isCategoriesLoading } = useQuery({
    queryKey: ['/api/categories']
  });
  
  // Event handlers
  const handleAddToCart = (menuItem: any) => {
    const existingItemIndex = cart.findIndex(item => item.menuItemId === menuItem.id);
    
    if (existingItemIndex >= 0) {
      // Item exists, increase quantity
      const updatedCart = [...cart];
      updatedCart[existingItemIndex].quantity += 1;
      updatedCart[existingItemIndex].totalPrice = 
        updatedCart[existingItemIndex].unitPrice * updatedCart[existingItemIndex].quantity;
      setCart(updatedCart);
    } else {
      // Add new item
      const newItem: CartItem = {
        id: Date.now(), // temporary id for cart only
        menuItemId: menuItem.id,
        name: menuItem.name,
        quantity: 1,
        unitPrice: menuItem.price,
        totalPrice: menuItem.price
      };
      setCart([...cart, newItem]);
    }
    
    toast({
      title: "Item added",
      description: `${menuItem.name} added to order`,
      duration: 1500,
    });
  };
  
  const handleUpdateCartItem = (id: number, quantity: number) => {
    if (quantity <= 0) {
      handleRemoveCartItem(id);
      return;
    }
    
    const updatedCart = cart.map(item => {
      if (item.id === id) {
        return {
          ...item,
          quantity,
          totalPrice: item.unitPrice * quantity
        };
      }
      return item;
    });
    
    setCart(updatedCart);
  };
  
  const handleRemoveCartItem = (id: number) => {
    setCart(cart.filter(item => item.id !== id));
  };
  
  const handleClearCart = () => {
    setCart([]);
    setSelectedTable(null);
    setActiveOrder(null);
  };
  
  const handleTableSelect = (tableId: number) => {
    setSelectedTable(tableId);
  };
  
  const handlePayment = () => {
    if (cart.length === 0) {
      toast({
        variant: "destructive",
        title: "Empty order",
        description: "Please add items to the cart before processing payment."
      });
      return;
    }
    
    if (!selectedTable) {
      toast({
        variant: "destructive",
        title: "No table selected",
        description: "Please select a table for the order."
      });
      return;
    }
    
    setIsPaymentModalOpen(true);
  };
  
  const cartTotal = cart.reduce((sum, item) => sum + item.totalPrice, 0);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  
  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 flex flex-col md:flex-row gap-4 overflow-hidden">
        <div className="md:w-2/3 overflow-hidden flex flex-col">
          <Tabs defaultValue="menu" className="flex-1 flex flex-col">
            <TabsList className="w-full justify-start">
              <TabsTrigger value="menu">Menu</TabsTrigger>
              <TabsTrigger value="tables">Tables</TabsTrigger>
            </TabsList>
            
            <TabsContent value="menu" className="flex-1 overflow-auto">
              <Card className="border-0 h-full">
                <MenuItems 
                  categories={categories || []} 
                  isLoading={isCategoriesLoading} 
                  onAddToCart={handleAddToCart} 
                />
              </Card>
            </TabsContent>
            
            <TabsContent value="tables" className="flex-1 overflow-auto">
              <Card className="border-0 h-full">
                <TableSelection 
                  selectedTable={selectedTable} 
                  onSelectTable={handleTableSelect} 
                />
              </Card>
            </TabsContent>
          </Tabs>
        </div>
        
        <div className="md:w-1/3 flex flex-col h-full">
          <OrderSummary 
            cart={cart}
            selectedTable={selectedTable}
            onUpdateItem={handleUpdateCartItem}
            onRemoveItem={handleRemoveCartItem}
            onClearCart={handleClearCart}
            onPayment={handlePayment}
          />
        </div>
      </div>
      
      <PaymentModal 
        isOpen={isPaymentModalOpen} 
        onClose={() => setIsPaymentModalOpen(false)}
        cart={cart}
        selectedTable={selectedTable}
        total={cartTotal}
        onSuccess={handleClearCart}
      />
    </div>
  );
}
