import express from "express";
import fetch from "node-fetch";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

app.post("/api/create-transaction", async (req, res) => {
  try {
    const { name, email, amount } = req.body;

    const serverKey = "SB-Mid-server-xxxxxx"; // Ganti dengan Server Key Sandbox kamu
    const authHeader = "Basic " + Buffer.from(serverKey + ":").toString("base64");

    const response = await fetch("https://app.sandbox.midtrans.com/snap/v1/transactions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": authHeader,
      },
      body: JSON.stringify({
        transaction_details: {
          order_id: "order-" + Date.now(),
          gross_amount: amount,
        },
        customer_details: {
          first_name: name,
          email: email,
        },
        item_details: [
          {
            id: "fixie001",
            price: amount,
            quantity: 1,
            name: "FixieStore Order",
          },
        ],
      }),
    });

    const data = await response.json();
    console.log("Response Midtrans:", data); // tambahkan log biar kelihatan

    res.json(data);
  } catch (error) {
    console.error("Error server:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

app.listen(3001, () => {
  console.log("Proxy server running on http://localhost:3001");
});
