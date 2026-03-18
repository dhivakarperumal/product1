import { doc, runTransaction } from "firebase/firestore";
import { db } from "../firebase";

export const reduceStockAfterPurchase = async (cartItems) => {
  await runTransaction(db, async (transaction) => {
    for (const item of cartItems) {
      const productRef = doc(db, "products", item.productId);
      const productSnap = await transaction.get(productRef);

      if (!productSnap.exists()) {
        throw new Error("Product not found");
      }

      const product = productSnap.data();

      // 🧥 Dress & 👟 Accessories
      if (item.category === "Dress" || item.category === "Accessories") {
        const key = `${item.size}-${item.gender}`;
        const currentQty = product.stock?.[key]?.qty;

        if (currentQty === undefined) {
          throw new Error(`Stock not found for ${key}`);
        }

        if (currentQty < item.quantity) {
          throw new Error(`Insufficient stock for ${item.name}`);
        }

        transaction.update(productRef, {
          [`stock.${key}.qty`]: currentQty - item.quantity,
        });
      }

      // 🍚 Food (Solid & Liquid)
      if (item.category === "Food") {
        const variantKey = item.variant; // "1kg", "500g", "250ml"
        const currentQty = product?.[variantKey]?.qty;

        if (currentQty === undefined) {
          throw new Error(`Stock not found for ${variantKey}`);
        }

        if (currentQty < item.quantity) {
          throw new Error(`Insufficient stock for ${item.name}`);
        }

        transaction.update(productRef, {
          [`${variantKey}.qty`]: currentQty - item.quantity,
        });
      }
    }
  });
};