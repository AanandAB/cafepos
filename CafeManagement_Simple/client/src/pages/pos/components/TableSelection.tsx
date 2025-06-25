import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Coffee, BeerOff } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

type TableSelectionProps = {
  selectedTable: number | null;
  onSelectTable: (tableId: number) => void;
};

export default function TableSelection({ selectedTable, onSelectTable }: TableSelectionProps) {
  // Fetch tables with auto-refresh to show real-time status
  const { data: tables, isLoading } = useQuery({
    queryKey: ['/api/tables'],
    refetchInterval: 5000 // Refresh every 5 seconds to show updated table occupancy status
  });
  
  if (isLoading) {
    return (
      <div className="p-6">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {Array.from({ length: 10 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full rounded-lg" />
          ))}
        </div>
      </div>
    );
  }
  
  // Ensure tables is always an array
  const tableArray = Array.isArray(tables) ? tables : [];
  
  return (
    <div className="p-6">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {tableArray.map((table: any) => (
          <Card 
            key={table.id} 
            className={`table-item cursor-pointer transition-all duration-200 ${
              table.occupied ? 'bg-blue-100 dark:bg-blue-900' : 'bg-green-100 dark:bg-green-900'
            } ${selectedTable === table.id ? 'ring-2 ring-primary' : ''}`}
            onClick={() => onSelectTable(table.id)}
          >
            <CardContent className="p-4 text-center flex flex-col items-center justify-center h-32">
              {table.occupied ? (
                <Coffee className="h-8 w-8 mb-2 text-blue-500" />
              ) : (
                <Coffee className="h-8 w-8 mb-2 text-green-500" />
              )}
              <h3 className="font-semibold text-lg">{table.name}</h3>
              <p className="text-sm">
                {table.occupied ? 'Occupied - Click to add items' : 'Available'}
              </p>
              {table.capacity && (
                <p className="text-xs text-muted-foreground mt-1">
                  Capacity: {table.capacity}
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
