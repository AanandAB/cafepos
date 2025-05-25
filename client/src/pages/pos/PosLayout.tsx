import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
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
  taxRate: number;
  notes?: string;
};

export default function PosLayout() {
  const [selectedTable, setSelectedTable] = useState<number | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [activeOrder, setActiveOrder] = useState<any | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isTakeaway, setIsTakeaway] = useState(false);
  
  const { toast } = useToast();
  
  // Fetch all categories for the menu
  const { data: categories, isLoading: isCategoriesLoading } = useQuery({
    queryKey: ['/api/categories']
  });
  
  // Fetch tables to check availability
  const { data: tables, isLoading: isTablesLoading } = useQuery({
    queryKey: ['/api/tables'],
    refetchInterval: 5000 // Refresh every 5 seconds to keep tables data updated
  });
  
  // Event handlers
  const handleAddToCart = (menuItem: any) => {
    // Check if item is out of stock
    if (menuItem.stockQuantity !== undefined && menuItem.stockQuantity <= 0) {
      toast({
        variant: "destructive",
        title: "Out of Stock",
        description: `${menuItem.name} is currently unavailable`,
      });
      return;
    }
    
    const existingItemIndex = cart.findIndex(item => item.menuItemId === menuItem.id);
    
    if (existingItemIndex >= 0) {
      // Check if adding more would exceed available stock
      const currentQuantity = cart[existingItemIndex].quantity;
      if (menuItem.stockQuantity !== undefined && currentQuantity + 1 > menuItem.stockQuantity) {
        toast({
          variant: "destructive",
          title: "Limited Stock",
          description: `Only ${menuItem.stockQuantity} of ${menuItem.name} available`,
        });
        return;
      }
      
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
        totalPrice: menuItem.price,
        taxRate: menuItem.taxRate || 5 // Use item's tax rate or default to 5%
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
  
  // Modified to preserve table occupancy status
  const handleOrderSuccess = () => {
    setCart([]);
    setActiveOrder(null);
    // We intentionally don't clear selectedTable here to preserve table occupancy
  };
  
  const handleClearCart = () => {
    setCart([]);
    // Don't clear the selected table when clearing cart
    // as this can unintentionally mark occupied tables as available
    setActiveOrder(null);
  };
  
  const handleTableSelect = (tableId: number) => {
    setSelectedTable(tableId);
    
    // Check if table is already occupied - if not, mark it as occupied
    if (tables) {
      const tableArray = Array.isArray(tables) ? tables : [];
      const selectedTableObj = tableArray.find((table: any) => table.id === tableId);
      
      if (selectedTableObj && !selectedTableObj.occupied) {
        // Mark table as occupied when selecting an available table
        fetch(`/api/tables/${tableId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ occupied: true })
        }).then(() => {
          // Invalidate tables query to refresh the data
          queryClient.invalidateQueries({ queryKey: ['/api/tables'] });
        });
      }
    }
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
    
    if (!selectedTable && !isTakeaway) {
      toast({
        variant: "destructive",
        title: "No table selected",
        description: "Please select a table for the order or use takeaway option."
      });
      return;
    }
    
    setIsPaymentModalOpen(true);
  };
  
  const handleTakeawayToggle = (takeawayState: boolean) => {
    setIsTakeaway(takeawayState);
    // If switching to takeaway, clear table selection
    if (takeawayState) {
      setSelectedTable(null);
    }
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
                  categories={Array.isArray(categories) ? categories : []} 
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
            isTakeaway={isTakeaway}
            onTakeawayToggle={handleTakeawayToggle}
          />
        </div>
      </div>
      
      <PaymentModal 
        isOpen={isPaymentModalOpen} 
        onClose={() => setIsPaymentModalOpen(false)}
        cart={cart}
        selectedTable={selectedTable}
        total={cartTotal}
        onSuccess={handleOrderSuccess}
        isTakeaway={isTakeaway}
      />
    </div>
  );
}
