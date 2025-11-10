import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Eye, Heart } from "lucide-react";
import { Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { Product } from "@/types/product";

interface ProductCardProps {
  product: Product;
  onAddToCart?: (product: Product) => void; // ✅ prop opsional dari parent
}

export const ProductCard = ({ product, onAddToCart }: ProductCardProps) => {
  const { toast } = useToast();

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(price);

  // ✅ gunakan fungsi dari parent (Index atau Detail)
  const handleAddToCart = () => {
    if (!onAddToCart) {
      toast({
        title: "Error",
        description: "Fungsi tambah ke keranjang tidak ditemukan",
        variant: "destructive",
      });
      return;
    }   
    onAddToCart(product);
  };

  const inStock = product.stock > 0;
  const imageSrc = product.image_url || "/placeholder.png";

  return (
    <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 bg-card">
      <CardContent className="p-0">
        <div className="relative overflow-hidden rounded-t-lg">
          <img
            src={imageSrc}
            alt={product.name}
            className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
          />

          {!inStock && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <Badge variant="destructive">Stok Habis</Badge>
            </div>
          )}

          <div className="absolute top-2 right-2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button size="icon" variant="secondary" className="w-8 h-8">
              <Heart className="w-4 h-4" />
            </Button>
            <Link to={`/product/${product.id}`}>
              <Button size="icon" variant="secondary" className="w-8 h-8">
                <Eye className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>

        <div className="p-4">
          {product.category && (
            <Badge variant="outline" className="text-xs mb-2 capitalize">
              {product.category}
            </Badge>
          )}
          <h3 className="font-semibold text-sm mb-1 line-clamp-2 text-card-foreground">
            {product.name}
          </h3>
          <p className="font-bold text-lg text-primary">{formatPrice(product.price)}</p>
        </div>
      </CardContent>

      <CardFooter className="p-4 pt-0">
        <Button
          onClick={handleAddToCart}
          disabled={!inStock}
          className="w-full"
          size="sm"
        >
          <ShoppingCart className="w-4 h-4 mr-2" />
          {inStock ? "Tambah ke Keranjang" : "Stok Habis"}
        </Button>
      </CardFooter>
    </Card>
  );
};
