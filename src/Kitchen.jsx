import React, { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

// ✅ Fixed for Create React App (use REACT_APP_ prefix, not VITE_)
const SUPABASE_URL =
  process.env.REACT_APP_SUPABASE_URL ||
  "https://lugtmmcpcgzyytkzqozn.supabase.co";
const SUPABASE_ANON_KEY =
  process.env.REACT_APP_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx1Z3RtbWNwY2d6eXl0a3pxb3puIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkzODk0MDQsImV4cCI6MjA3NDk2NTQwNH0.uSEDsRNpH_QGwgGxrrxuYKCkuH3lszd8O9w7GN9INpE";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

function Kitchen() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  // Fetch latest active orders
  async function fetchOrders() {
    setLoading(true);
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .not("status", "in", '("Completed","Cancelled")') // exclude both
      .order("created_at", { ascending: true })
      .limit(10); // Show more orders

    if (error) {
      console.error("Error fetching orders:", error);
    } else {
      setOrders(data || []);
      setLastUpdate(new Date());
    }
    setLoading(false);
  }

  // Update order status
  async function updateOrderStatus(orderId, status) {
    const { error } = await supabase
      .from("orders")
      .update({ status })
      .eq("id", orderId);

    if (error) {
      console.error("Error updating order:", error);
      alert("Failed to update order status");
    } else {
      console.log(`✅ Order ${orderId} status updated to ${status}`);
      fetchOrders(); // refresh after update
    }
  }

  // Setup real-time subscription
  useEffect(() => {
    console.log("🔌 Setting up Supabase Realtime connection...");
    fetchOrders();

    const channel = supabase
      .channel("orders-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders" },
        (payload) => {
          console.log("🔔 Realtime event received:", payload);
          fetchOrders();
        }
      )
      .subscribe((status) => {
        console.log("📡 Realtime subscription status:", status);
      });

    return () => {
      console.log("🔌 Cleaning up Realtime connection...");
      supabase.removeChannel(channel);
    };
  }, []);

  // Auto-refresh every 30 seconds as backup
  useEffect(() => {
    const interval = setInterval(() => {
      console.log("🔄 Auto-refresh backup triggered");
      fetchOrders();
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 p-4 sm:p-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-lg shadow-xl p-4 sm:p-6 mb-6">
        <h1 className="text-2xl sm:text-4xl font-black text-white text-center mb-2">
          🍔 KITCHEN DISPLAY
        </h1>
        <div className="text-center text-white text-sm sm:text-base">
          <p className="font-semibold">
            Active Orders: <span className="text-2xl">{orders.length}</span>
          </p>
          <p className="text-xs mt-1 opacity-80">
            Last updated: {lastUpdate.toLocaleTimeString()}
          </p>
        </div>
      </div>

      {/* Manual Refresh */}
      <div className="text-center mb-6">
        <button
          onClick={fetchOrders}
          disabled={loading}
          className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold disabled:bg-gray-400 transition-colors"
        >
          {loading ? "🔄 Refreshing..." : "🔄 Refresh Orders"}
        </button>
      </div>

      {/* Orders Grid */}
      {loading && orders.length === 0 ? (
        <div className="text-center text-white text-lg py-20">
          <div className="animate-spin text-6xl mb-4">⏳</div>
          <p>Loading orders...</p>
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center text-white text-lg py-20">
          <div className="text-6xl mb-4">✅</div>
          <p className="text-2xl font-bold">No Active Orders</p>
          <p className="text-sm opacity-70 mt-2">All caught up!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {orders.map((order) => (
            <div
              key={order.id}
              className="bg-white shadow-2xl rounded-lg p-4 border-4 border-orange-400 transform hover:scale-105 transition-transform"
            >
              {/* Order Header */}
              <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg p-3 mb-3">
                <h2 className="text-2xl font-black text-center">
                  #{order.order_number}
                </h2>
                <p className="text-center text-sm font-semibold opacity-90">
                  {new Date(order.created_at).toLocaleTimeString()}
                </p>
              </div>

              {/* Customer Info */}
              <div className="bg-blue-50 rounded-lg p-3 mb-3">
                <p className="text-gray-800 text-sm font-bold mb-1">
                  👤 {order.customer_name}
                </p>
                <p className="text-gray-700 text-xs">📱 {order.customer_phone}</p>
                <div className="flex gap-2 mt-2">
                  <span
                    className={`px-2 py-1 rounded text-xs font-bold ${
                      order.order_type === "delivery"
                        ? "bg-purple-500 text-white"
                        : "bg-green-500 text-white"
                    }`}
                  >
                    {order.order_type === "delivery"
                      ? "🚗 DELIVERY"
                      : "🏃 PICKUP"}
                  </span>
                  <span className="px-2 py-1 rounded text-xs font-bold bg-gray-200 text-gray-800">
                    💳 {order.payment_method.toUpperCase()}
                  </span>
                </div>
              </div>

              {/* Order Items */}
              <div className="bg-yellow-50 rounded-lg p-3 mb-3 border-2 border-yellow-200">
                <h3 className="font-black text-sm mb-2 text-gray-800">
                  📋 ORDER ITEMS:
                </h3>
                <ul className="space-y-2">
                  {order.items.map((item, i) => (
                    <li
                      key={i}
                      className="border-b border-yellow-200 pb-2 last:border-b-0"
                    >
                      <div className="flex justify-between items-start">
                        <span className="font-bold text-sm text-gray-800">
                          {item.name}
                        </span>
                        <span className="bg-orange-500 text-white px-2 py-1 rounded-full text-xs font-black">
                          x{item.quantity}
                        </span>
                      </div>

                      {/* ✅ Sauces */}
                      {item.sauces && item.sauces.length > 0 && (
                        <div className="mt-1">
                          <p className="text-xs font-bold text-gray-600">
                            🥫 Sauces:
                          </p>
                          <ul className="ml-4 list-disc text-xs text-gray-700">
                            {item.sauces.map((sauce, idx) => (
                              <li key={idx}>{sauce}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* ✅ Add-ons */}
                      {item.add_ons && item.add_ons.length > 0 && (
                        <div className="mt-1">
                          <p className="text-xs font-bold text-gray-600">
                            ➕ Add-ons:
                          </p>
                          <ul className="ml-4 list-disc text-xs text-gray-700">
                            {item.add_ons.map((addon, idx) => (
                              <li key={idx}>{addon}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Seasoning */}
                      {item.withSeasoning && (
                        <div className="mt-1 bg-green-500 text-white text-xs px-2 py-1 rounded inline-block">
                          ✨ WITH SEASONING
                        </div>
                      )}

                      {/* Remarks */}
                      {item.remarks && item.remarks.trim() !== "" && (
                        <div className="mt-2 bg-red-100 border-2 border-red-400 text-red-900 text-xs rounded px-2 py-2 font-bold">
                          ⚠️ SPECIAL REQUEST: {item.remarks}
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Total */}
              <div className="bg-gray-800 text-white rounded-lg p-3 mb-3 text-center">
                <p className="text-xs font-semibold opacity-80">TOTAL</p>
                <p className="text-2xl font-black">PKR {order.grand_total}</p>
              </div>

              {/* Status Badge */}
              <div className="mb-3 text-center">
                <span
                  className={`px-4 py-2 rounded-lg text-white text-sm font-black inline-block ${
                    order.status === "Pending"
                      ? "bg-yellow-500 animate-pulse"
                      : order.status === "Confirmed"
                      ? "bg-green-500"
                      : order.status === "Cancelled"
                      ? "bg-red-500"
                      : "bg-gray-500"
                  }`}
                >
                  {order.status === "Pending" && "⏳ NEW ORDER"}
                  {order.status === "Confirmed" && "👨‍🍳 PUNCHING"}
                  {order.status === "Cancelled" && "❌ CANCELLED"}
                </span>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => updateOrderStatus(order.id, "Confirmed")}
                  disabled={order.status === "Confirmed"}
                  className="bg-green-500 hover:bg-green-600 text-white px-2 py-3 rounded-lg font-bold text-xs disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                  ✅ CONFIRM
                </button>
                <button
                  onClick={() => updateOrderStatus(order.id, "Completed")}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-2 py-3 rounded-lg font-bold text-xs transition-colors"
                >
                  🏁 COMPLETED
                </button>
                <button
                  onClick={() => updateOrderStatus(order.id, "Cancelled")}
                  className="bg-red-500 hover:bg-red-600 text-white px-2 py-3 rounded-lg font-bold text-xs transition-colors"
                >
                  ❌ CANCEL
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
