import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ArrowLeft, CreditCard, Truck, MapPin } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabaseClient";
import { useCart } from "../context/cart-context";

interface CartItem {
  id: string;
  quantity: number;
  products: {
    id: string;
    name: string;
    price: number;
    image_url?: string;
  };
}

const Checkout = () => {
  const { toast } = useToast();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState("transfer");
  const [shippingMethod, setShippingMethod] = useState("regular");
  const { cartCount, fetchCart } = useCart();

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(price);

  // Ambil user login
  useEffect(() => {
    const fetchUser = async () => {
      const { data, error } = await supabase.auth.getUser();
      if (error || !data.user) {
        toast({
          title: "Belum login",
          description: "Silakan login terlebih dahulu untuk melanjutkan checkout.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }
      setUserId(data.user.id);
    };
    fetchUser();
  }, []);

  // Ambil data keranjang
  useEffect(() => {
    const getCart = async () => {
      if (!userId) return;
      setLoading(true);

      const { data, error } = await supabase
        .from("cart_items")
        .select("id, quantity, products(*)")
        .eq("user_id", userId);

      if (error) {
        console.error("Gagal memuat cart:", error.message);
        toast({
          title: "Gagal memuat keranjang",
          description: error.message,
          variant: "destructive",
        });
      } else {
        setCartItems(data || []);
      }
      setLoading(false);
    };
    getCart();
  }, [userId]);

  const shippingCost = shippingMethod === "express" ? 25000 : 0;
  const subtotal = cartItems.reduce(
    (total, item) => total + item.products.price * item.quantity,
    0
  );
  const totalWithShipping = subtotal + shippingCost;

  // === Fungsi utama gabungan: buat order + popup Midtrans ===
  const handleOrderAndPay = async () => {
    if (!userId || cartItems.length === 0) {
      toast({
        title: "Tidak bisa membuat pesanan",
        description: "Keranjang kosong atau user belum login.",
        variant: "destructive",
      });
      return;
    }

    try {
      // 1️⃣ Simpan pesanan ke Supabase
      const { data: orderData, error } = await supabase
        .from("orders")
        .insert([
          {
            user_id: userId,
            total_price: totalWithShipping,
            status: "pending",
            payment_method: paymentMethod,
            shipping_method: shippingMethod,
            created_at: new Date(),
          },
        ])
        .select()
        .single();

      if (error) throw error;

      // 2️⃣ Panggil server proxy untuk minta token Midtrans
      const res = await fetch("http://localhost:3001/api/create-transaction", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Neil SJ",
          email: "neil@example.com",
          amount: totalWithShipping,
        }),
      });

      if (!res.ok) throw new Error("Gagal meminta token ke server backend");

      const tokenData = await res.json();
      const snapToken = tokenData.token || tokenData.snap_token;
      if (!snapToken) throw new Error("Gagal membuat Snap Token");

      console.log("Token data:", tokenData);
      console.log("Snap token:", snapToken);

      // 3️⃣ Jalankan popup Snap Midtrans
      if (!window.snap) {
        toast({
          title: "Midtrans belum siap",
          description: "Silakan refresh halaman dan coba lagi.",
          variant: "destructive",
        });
        return;
      }

      window.snap.pay(snapToken, {
        onSuccess: async (result: any) => {
          console.log("Pembayaran sukses:", result);
          await supabase.from("orders").update({ status: "paid" }).eq("id", orderData.id);
          await supabase.from("cart_items").delete().eq("user_id", userId);
          await fetchCart();
          setCartItems([]);
          toast({
            title: "Pembayaran berhasil!",
            description: "Terima kasih telah berbelanja di FixieStore.",
          });
        },
        onPending: (result: any) => {
          console.log("Menunggu pembayaran:", result);
        },
        onError: (result: any) => {
          console.error("Error pembayaran:", result);
          toast({
            title: "Gagal memproses pembayaran",
            description: "Terjadi kesalahan pada Midtrans.",
            variant: "destructive",
          });
        },
        onClose: () => {
          console.log("Popup ditutup tanpa pembayaran.");
        },
      });
    } catch (err: any) {
      console.error("Error checkout:", err.message);
      toast({
        title: "Terjadi kesalahan",
        description: err.message,
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Memuat checkout...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header cartItemCount={cartCount} />

      <div className="container mx-auto px-4 py-8">
        <Link
          to="/cart"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Kembali ke Keranjang
        </Link>

        <h1 className="text-3xl font-bold mb-8">Checkout</h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Form Alamat */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  Alamat Pengiriman
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input placeholder="Nama Depan" />
                <Input placeholder="Nama Belakang" />
                <Input placeholder="Nomor Telepon" />
                <Textarea placeholder="Alamat Lengkap" />
              </CardContent>
            </Card>

            {/* Metode Pengiriman */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Truck className="w-5 h-5" />
                  Metode Pengiriman
                </CardTitle>
              </CardHeader>
              <CardContent>
                <RadioGroup value={shippingMethod} onValueChange={setShippingMethod}>
                  <div className="flex items-center space-x-2 p-3 border rounded-lg">
                    <RadioGroupItem value="regular" id="regular" />
                    <Label htmlFor="regular" className="flex-1 cursor-pointer">
                      <div className="flex justify-between">
                        <p className="font-medium">Reguler</p>
                        <span className="font-medium text-green-600">GRATIS</span>
                      </div>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 p-3 border rounded-lg">
                    <RadioGroupItem value="express" id="express" />
                    <Label htmlFor="express" className="flex-1 cursor-pointer">
                      <div className="flex justify-between">
                        <p className="font-medium">Express</p>
                        <span className="font-medium">{formatPrice(25000)}</span>
                      </div>
                    </Label>
                  </div>
                </RadioGroup>
              </CardContent>
            </Card>

            {/* Metode Pembayaran */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  Metode Pembayaran
                </CardTitle>
              </CardHeader>
              <CardContent>
                <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
                  <div className="flex items-center space-x-2 p-3 border rounded-lg">
                    <RadioGroupItem value="transfer" id="transfer" />
                    <Label htmlFor="transfer" className="flex-1 cursor-pointer">
                      <p className="font-medium">Transfer Bank</p>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 p-3 border rounded-lg">
                    <RadioGroupItem value="ewallet" id="ewallet" />
                    <Label htmlFor="ewallet" className="flex-1 cursor-pointer">
                      <p className="font-medium">E-Wallet</p>
                      <p className="text-sm text-muted-foreground">GoPay, OVO, DANA, ShopeePay</p>
                    </Label>
                  </div>
                </RadioGroup>
              </CardContent>
            </Card>
          </div>

          {/* Ringkasan Pesanan */}
          <div>
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle>Ringkasan Pesanan</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  {cartItems.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      Tidak ada produk di keranjang.
                    </p>
                  ) : (
                    cartItems.map((item) => (
                      <div key={item.id} className="flex justify-between text-sm">
                        <span>{item.products.name}</span>
                        <span>{formatPrice(item.products.price * item.quantity)}</span>
                      </div>
                    ))
                  )}
                </div>

                <Separator />

                <div className="flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span className="text-primary">{formatPrice(totalWithShipping)}</span>
                </div>

                <Button onClick={handleOrderAndPay} className="w-full" size="lg">
                  Buat Pesanan
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Checkout;
