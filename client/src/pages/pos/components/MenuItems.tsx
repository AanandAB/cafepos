import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, Coffee, Plus } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

type MenuItemsProps = {
  categories: any[];
  isLoading: boolean;
  onAddToCart: (item: any) => void;
};

export default function MenuItems({ categories, isLoading, onAddToCart }: MenuItemsProps) {
  const [activeCategory, setActiveCategory] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Fetch menu items for the selected category or all if no category is selected
  const { data: menuItems, isLoading: isMenuItemsLoading } = useQuery({
    queryKey: activeCategory 
      ? ['/api/menu-items/category', activeCategory]
      : ['/api/menu-items']
  });
  
  const filteredItems = menuItems ? menuItems.filter((item: any) => 
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) && item.available
  ) : [];
  
  return (
    <div className="h-full flex flex-col">
      <div className="p-4">
        <div className="relative mb-4">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search items..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <ScrollArea className="whitespace-nowrap pb-2" orientation="horizontal">
          <div className="flex space-x-2">
            <Button
              variant={activeCategory === null ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveCategory(null)}
            >
              All Items
            </Button>
            
            {isLoading
              ? Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-9 w-24 rounded-md" />
                ))
              : categories.map((category) => (
                  <Button
                    key={category.id}
                    variant={activeCategory === category.id ? "default" : "outline"}
                    size="sm"
                    onClick={() => setActiveCategory(category.id)}
                  >
                    {category.name}
                  </Button>
                ))
            }
          </div>
        </ScrollArea>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4">
        {isMenuItemsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-32 w-full rounded-md" />
            ))}
          </div>
        ) : filteredItems.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredItems.map((item: any) => (
              <Card key={item.id} className="overflow-hidden hover:shadow-md transition-shadow">
                <CardContent className="p-0">
                  <div className="flex p-4">
                    <div className="mr-3 flex-shrink-0 rounded-full bg-primary/10 p-2">
                      <Coffee className="h-5 w-5 text-primary" />
                    </div>
                    
                    <div className="flex-1">
                      <h3 className="font-medium">{item.name}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-2">{item.description}</p>
                      <div className="mt-1 flex items-center justify-between">
                        <span className="font-semibold">
                          ₹{item.price.toFixed(2)}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => onAddToCart(item)}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <h3 className="text-lg font-medium">No items found</h3>
              <p className="text-sm text-muted-foreground">Try a different search or category</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
