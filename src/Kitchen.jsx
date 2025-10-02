import React, { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

// ✅ Replace with your actual Supabase credentials
const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL ||
  "https://lugtmmcpcgzyytkzqozn.supabase.co";
const SUPABASE_ANON_KEY =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx1Z3RtbWNwY2d6eXl0a3pxb3puIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkzODk0MDQsImV4cCI6MjA3NDk2NTQwNH0.uSEDsRNpH_QGwgGxrrxuYKCkuH3lszd8O9w7GN9INpE";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

function Kitchen() {
  const [orders, setOrders] = useState([]);

  // Fetch latest active orders
  async function fetchOrders() {
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .not("status", "in", '("Completed","Cancelled")') // exclude both
      .order("created_at", { ascending: true })
      .limit(3);

    if (error) {
      console.error("Error fetching orders:", error);
    } else {
      setOrders(data || []);
    }
  }

  // Update order status
  async function updateOrderStatus(orderId, status) {
    const { error } = await supabase
      .from("orders")
      .update({ status })
      .eq("id", orderId);

    if (error) {
      console.error("Error updating order:", error);
    } else {
      fetchOrders(); // refresh after update
    }
  }

  // Setup real-time subscription
  useEffect(() => {
    fetchOrders();

    const channel = supabase
      .channel("orders-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders" },
        (payload) => {
          console.log("Realtime event:", payload);
          fetchOrders(); // refresh whenever an order is added/updated
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <h1 className="text-3xl font-bold text-center mb-6">
        🍔 Kitchen Order Display
      </h1>

      {orders.length === 0 ? (
        <p className="text-center text-gray-500 text-lg">No active orders</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {orders.map((order) => (
            <div
              key={order.id}
              className="bg-white shadow-lg rounded-lg p-4 border border-gray-200"
            >
              <h2 className="text-xl font-bold text-orange-600 mb-2">
                Order #{order.order_number}
              </h2>
              <p className="text-gray-700 text-sm mb-1">
                <strong>Customer:</strong> {order.customer_name}
              </p>
              <p className="text-gray-700 text-sm mb-3">
                <strong>Type:</strong> {order.order_type} |{" "}
                <strong>Payment:</strong> {order.payment_method}
              </p>

              <div className="bg-gray-50 rounded p-2 mb-3">
                <h3 className="font-semibold text-sm mb-1">Items:</h3>
                <ul className="text-sm list-disc list-inside">
                  {order.items.map((item, i) => (
                    <li key={i} className="mb-2">
                      {item.name} x{item.quantity} –{" "}
                      <span className="font-medium">
                        PKR {item.totalPrice}
                      </span>

                      {/* ✅ Show remarks if available */}
                      {item.remarks && item.remarks.trim() !== "" && (
                        <div className="mt-1 bg-yellow-100 border border-yellow-300 text-yellow-800 text-xs rounded px-2 py-1 inline-block">
                          📝 {item.remarks}
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              </div>

              <p className="text-sm mb-2">
                <strong>Status:</strong>{" "}
                <span
                  className={`px-2 py-1 rounded text-white text-xs ${
                    order.status === "Pending"
                      ? "bg-yellow-500"
                      : order.status === "Confirmed"
                      ? "bg-green-500"
                      : order.status === "Cancelled"
                      ? "bg-red-500"
                      : "bg-gray-500"
                  }`}
                >
                  {order.status}
                </span>
              </p>

              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => updateOrderStatus(order.id, "Confirmed")}
                  className="flex-1 bg-green-500 hover:bg-green-600 text-white px-3 py-2 rounded"
                >
                  ✅ Confirm
                </button>
                <button
                  onClick={() => updateOrderStatus(order.id, "Cancelled")}
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded"
                >
                  ❌ Cancel
                </button>
                <button
                  onClick={() => updateOrderStatus(order.id, "Completed")}
                  className="flex-1 bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded"
                >
                  🏁 Complete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Kitchen;
