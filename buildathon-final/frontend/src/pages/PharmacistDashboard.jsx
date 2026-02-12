import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ShoppingBag, CheckCircle, AlertTriangle, TrendingUp, Package, RefreshCw, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const PharmacistDashboard = () => {
    const navigate = useNavigate();

    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState('All');

    useEffect(() => {
        fetchOrders();
        // Poll every 30 seconds
        const interval = setInterval(fetchOrders, 30000);
        return () => clearInterval(interval);
    }, []);

    const fetchOrders = async () => {
        try {
            const res = await axios.get('http://localhost:8003/pharmacy/orders');
            setOrders(res.data.orders || []);
            setLoading(false);
        } catch (error) {
            console.error("Error fetching orders:", error);
            setLoading(false);
        }
    };

    const updateStatus = async (orderId, newStatus) => {
        try {
            await axios.patch(`http://localhost:8003/pharmacy/orders/${orderId}`, { status: newStatus });
            // Optimistic update
            setOrders(orders.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
        } catch (error) {
            console.error("Error updating status:", error);
            alert("Failed to update status");
        }
    };

    const filteredOrders = filterStatus === 'All' ? orders : orders.filter(o => o.status === filterStatus);

    // Stats
    const pendingCount = orders.filter(o => o.status === 'PENDING').length;
    const readyCount = orders.filter(o => o.status === 'READY').length;
    const completedToday = orders.filter(o => o.status === 'COMPLETED').length;

    return (
        <div className="p-8 max-w-7xl mx-auto bg-gray-50 min-h-screen" style={{ paddingTop: '100px' }}>
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Pharmacist Portal</h1>
                    <p className="text-gray-500">Manage orders and inventory</p>
                </div>
                <button onClick={fetchOrders} className="p-2 bg-white rounded-full shadow-sm hover:shadow-md transition-shadow">
                    <RefreshCw size={20} className="text-gray-600" />
                </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <StatCard icon={<Clock className="text-yellow-600" />} label="Pending Orders" value={pendingCount} color="bg-yellow-50" />
                <StatCard icon={<CheckCircle className="text-green-600" />} label="Ready for Pickup" value={readyCount} color="bg-green-50" />
                <StatCard icon={<Package className="text-blue-600" />} label="Completed Today" value={completedToday} color="bg-blue-50" />
            </div>

            {/* Orders List */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-6 border-b border-gray-200 flex justify-between items-center flex-wrap gap-4">
                    <h2 className="text-xl font-bold text-gray-800">Active Orders</h2>
                    <div className="flex gap-2 overflow-x-auto pb-2">
                        {['All', 'PENDING', 'PREPARING', 'READY'].map(status => (
                            <button
                                key={status}
                                onClick={() => setFilterStatus(status)}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${filterStatus === status ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                            >
                                {status}
                            </button>
                        ))}
                    </div>
                </div>

                {loading ? (
                    <div className="p-8 text-center text-gray-500">Loading orders...</div>
                ) : (
                    <div className="divide-y divide-gray-100">
                        {filteredOrders.length === 0 ? (
                            <div className="p-8 text-center text-gray-500">No active orders found.</div>
                        ) : (
                            filteredOrders.map(order => (
                                <OrderRow key={order.id} order={order} onUpdateStatus={updateStatus} />
                            ))
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

const StatCard = ({ icon, label, value, color }) => (
    <div className={`p-6 rounded-xl ${color} border border-gray-100 flex items-center gap-4`}>
        <div className="p-3 bg-white rounded-lg shadow-sm">{icon}</div>
        <div>
            <p className="text-sm text-gray-600 font-medium">{label}</p>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
    </div>
);

const OrderRow = ({ order, onUpdateStatus }) => (
    <div className="p-6 hover:bg-gray-50 transition-colors">
        <div className="flex justify-between items-start mb-4">
            <div>
                <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-gray-900">{order.patient_name || 'Guest Patient'}</h3>
                    <span className="text-xs text-gray-400">#{order.id.slice(-6)}</span>
                </div>
                <p className="text-sm text-gray-500">{order.created_at ? new Date(order.created_at).toLocaleString() : 'Recent'}</p>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-bold ${order.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                    order.status === 'READY' ? 'bg-green-100 text-green-800' :
                        'bg-blue-100 text-blue-800'
                }`}>
                {order.status}
            </span>
        </div>

        <div className="space-y-2 mb-4">
            {order.items && order.items.map((item, idx) => (
                <div key={idx} className="flex justify-between text-sm">
                    <span className="text-gray-700">{item.qty}x {item.name} {item.info && <span className="text-gray-400">({item.info})</span>}</span>
                    <span className="font-medium text-gray-900">₹{(item.price * item.qty).toFixed(2)}</span>
                </div>
            ))}
        </div>

        <div className="flex justify-between items-center pt-4 border-t border-gray-100">
            <span className="font-bold text-lg text-gray-900">Total: ₹{order.total?.toFixed(2)}</span>
            <div className="flex gap-2">
                {order.status === 'PENDING' && (
                    <ActionBtn onClick={() => onUpdateStatus(order.id, 'PREPARING')} label="Accept & Prepare" color="bg-indigo-600 text-white hover:bg-indigo-700" />
                )}
                {order.status === 'PREPARING' && (
                    <ActionBtn onClick={() => onUpdateStatus(order.id, 'READY')} label="Mark Ready" color="bg-green-600 text-white hover:bg-green-700" />
                )}
                {order.status === 'READY' && (
                    <ActionBtn onClick={() => onUpdateStatus(order.id, 'COMPLETED')} label="Complete Pickup" color="bg-gray-800 text-white hover:bg-gray-900" />
                )}
            </div>
        </div>
    </div>
);

const ActionBtn = ({ onClick, label, color }) => (
    <button
        onClick={onClick}
        className={`px-4 py-2 rounded-lg text-sm font-medium transition-transform active:scale-95 ${color}`}
    >
        {label}
    </button>
);

export default PharmacistDashboard;
