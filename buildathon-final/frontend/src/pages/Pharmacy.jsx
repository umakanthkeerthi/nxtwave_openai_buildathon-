
import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { ShoppingCart, MapPin, Navigation, ArrowLeft, Search, Plus, Minus, Pill, X } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import axios from 'axios';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix Leaflet default icon issue
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

let UserIcon = L.icon({
    iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png",
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

const MapComponent = ({ pharmacies, userLocation, mapCenter }) => {
    return (
        <MapContainer center={mapCenter} zoom={13} style={{ height: '100%', width: '100%' }}>
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {userLocation && (
                <Marker position={userLocation} icon={UserIcon}>
                    <Popup>
                        <strong>You are here</strong>
                    </Popup>
                </Marker>
            )}
            {pharmacies.map(pharmacy => (
                <Marker
                    key={pharmacy.id}
                    position={[pharmacy.lat, pharmacy.lng]}
                >
                    <Popup>
                        <strong>{pharmacy.name}</strong><br />
                        {pharmacy.distance} away
                    </Popup>
                </Marker>
            ))}
            <AutoFitBounds pharmacies={pharmacies} userLocation={userLocation} />
        </MapContainer>
    );
};

// Component to auto-fit map bounds to show all markers
const AutoFitBounds = ({ pharmacies, userLocation }) => {
    const map = useMap();

    React.useEffect(() => {
        if (!userLocation && pharmacies.length === 0) return;

        const bounds = L.latLngBounds([]);

        if (userLocation) {
            bounds.extend(userLocation);
        }

        pharmacies.forEach(p => {
            bounds.extend([p.lat, p.lng]);
        });

        if (bounds.isValid()) {
            map.flyToBounds(bounds, {
                padding: [50, 50],
                maxZoom: 15, // Don't zoom in too close if only 1 point
                animate: true
            });
        }
    }, [pharmacies, userLocation, map]);

    return null;
};

const Pharmacy = () => {
    const [cart, setCart] = React.useState([]);
    const [isCartOpen, setIsCartOpen] = React.useState(false);
    const [isCartAnimating, setIsCartAnimating] = React.useState(false);
    const [isMobile, setIsMobile] = React.useState(window.innerWidth < 768);
    const [selectedPharmacy, setSelectedPharmacy] = React.useState(null);

    // Location & Real Pharmacy State
    const [userLocation, setUserLocation] = React.useState(null);
    const [mapCenter, setMapCenter] = React.useState([51.505, -0.09]);
    const [pharmacies, setPharmacies] = React.useState([]);

    // Product State
    const [products, setProducts] = React.useState([]);
    const [loading, setLoading] = React.useState(false);
    const [searchQuery, setSearchQuery] = React.useState("");
    const [selectedCategory, setSelectedCategory] = React.useState("All");
    const [checkoutStatus, setCheckoutStatus] = React.useState('idle');
    const [isAddressModalOpen, setIsAddressModalOpen] = React.useState(false);
    const [deliveryAddress, setDeliveryAddress] = React.useState("");
    const [toast, setToast] = React.useState(null);

    // Toast Helper
    const showToast = (message) => {
        setToast(message);
        setTimeout(() => setToast(null), 3000);
    };

    // Cart Functions
    const addToCart = (product) => {
        setCart(prev => {
            const existing = prev.find(item => item.id === product.id);
            if (existing) {
                return prev.map(item => item.id === product.id ? { ...item, qty: item.qty + 1 } : item);
            }
            return [...prev, { ...product, qty: 1 }];
        });
        setIsCartAnimating(true);
        setTimeout(() => setIsCartAnimating(false), 300);
        showToast(`Added ${product.name} to cart`);
    };

    const removeFromCart = (id) => {
        setCart(prev => prev.filter(item => item.id !== id));
    };

    const updateQty = (id, delta) => {
        setCart(prev => prev.map(item => {
            if (item.id === id) {
                return { ...item, qty: Math.max(0, item.qty + delta) };
            }
            return item;
        }).filter(item => item.qty > 0));
    };

    const cartTotal = cart.reduce((total, item) => total + (item.price * item.qty), 0);

    React.useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth < 768);
        };
        window.addEventListener('resize', handleResize);

        // Get User Location
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    const { latitude, longitude } = pos.coords;
                    const newPos = [latitude, longitude];
                    setUserLocation(newPos);
                    setMapCenter(newPos);
                },
                (err) => console.error("Error getting location:", err)
            );
        }

        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Mock Pharmacies Data - Comprehensive List for India
    const MOCK_INDIA_PHARMACIES = [
        // Udaipur
        { id: 'ud1', name: "DocAI Udaipur Central", lat: 24.5854, lng: 73.7125, distance: "1.2 km", city: "Udaipur", isOpen: true },
        { id: 'ud2', name: "DocAI Fateh Sagar", lat: 24.6023, lng: 73.6749, distance: "3.5 km", city: "Udaipur", isOpen: true },
        { id: 'ud3', name: "DocAI City Palace", lat: 24.5764, lng: 73.6835, distance: "2.8 km", city: "Udaipur", isOpen: false },
        { id: 'ud4', name: "DocAI Hiran Magri", lat: 24.5714, lng: 73.7154, distance: "4.1 km", city: "Udaipur", isOpen: true },
        { id: 'ud5', name: "DocAI Sukher Hub", lat: 24.6293, lng: 73.7188, distance: "6.0 km", city: "Udaipur", isOpen: true },

        // Delhi & NCR
        { id: 'dl1', name: "DocAI Delhi Cannaught", lat: 28.6304, lng: 77.2177, distance: "1.5 km", city: "Delhi", isOpen: true },
        { id: 'dl2', name: "DocAI South Ex", lat: 28.5665, lng: 77.2287, distance: "5.2 km", city: "Delhi", isOpen: true },
        { id: 'dl3', name: "DocAI Rohini Sector", lat: 28.7041, lng: 77.1025, distance: "8.0 km", city: "Delhi", isOpen: false },
        { id: 'dl4', name: "DocAI Dwarka Mor", lat: 28.6186, lng: 77.0345, distance: "12.0 km", city: "Delhi", isOpen: true },
        { id: 'dl5', name: "DocAI Noida Sector 18", lat: 28.5708, lng: 77.3271, distance: "14.0 km", city: "Noida", isOpen: true },
        { id: 'dl6', name: "DocAI Gurugram Cyber City", lat: 28.4950, lng: 77.0895, distance: "18.0 km", city: "Gurugram", isOpen: true },

        // Mumbai
        { id: 'mum1', name: "DocAI Mumbai Bandra", lat: 19.0596, lng: 72.8295, distance: "3.5 km", city: "Mumbai", isOpen: true },
        { id: 'mum2', name: "DocAI Colaba", lat: 18.9067, lng: 72.8147, distance: "14.2 km", city: "Mumbai", isOpen: true },
        { id: 'mum3', name: "DocAI Andheri East", lat: 19.1136, lng: 72.8697, distance: "6.8 km", city: "Mumbai", isOpen: false },
        { id: 'mum4', name: "DocAI Juhu Beach", lat: 19.0883, lng: 72.8258, distance: "5.1 km", city: "Mumbai", isOpen: true },
        { id: 'mum5', name: "DocAI Gateway", lat: 18.9220, lng: 72.8347, distance: "13.5 km", city: "Mumbai", isOpen: true },
        { id: 'mum6', name: "DocAI Navi Mumbai Vashi", lat: 19.0745, lng: 73.0033, distance: "20.1 km", city: "Navi Mumbai", isOpen: true },

        // Bangalore
        { id: 'blr1', name: "DocAI Bengaluru Indiranagar", lat: 12.9719, lng: 77.6412, distance: "3.1 km", city: "Bangalore", isOpen: true },
        { id: 'blr2', name: "DocAI Koramangala", lat: 12.9345, lng: 77.6268, distance: "4.5 km", city: "Bangalore", isOpen: true },
        { id: 'blr3', name: "DocAI Whitefield", lat: 12.9698, lng: 77.7499, distance: "12.5 km", city: "Bangalore", isOpen: false },
        { id: 'blr4', name: "DocAI Mg Road", lat: 12.9756, lng: 77.6067, distance: "1.8 km", city: "Bangalore", isOpen: true },
        { id: 'blr5', name: "DocAI Jayanagar", lat: 12.9250, lng: 77.5938, distance: "5.6 km", city: "Bangalore", isOpen: true },
        { id: 'blr6', name: "DocAI HSR Layout", lat: 12.9121, lng: 77.6446, distance: "7.0 km", city: "Bangalore", isOpen: true },

        // Hyderabad
        { id: 'hyd1', name: "DocAI Hyderabad Hi-Tech", lat: 17.4435, lng: 78.3772, distance: "2.5 km", city: "Hyderabad", isOpen: true },
        { id: 'hyd2', name: "DocAI Jubilee Hills", lat: 17.4326, lng: 78.4071, distance: "4.0 km", city: "Hyderabad", isOpen: true },
        { id: 'hyd3', name: "DocAI Banjara Hills", lat: 17.4126, lng: 78.4397, distance: "3.8 km", city: "Hyderabad", isOpen: false },
        { id: 'hyd4', name: "DocAI Charminar", lat: 17.3616, lng: 78.4747, distance: "9.5 km", city: "Hyderabad", isOpen: true },
        { id: 'hyd5', name: "DocAI Secunderabad", lat: 17.4399, lng: 78.4983, distance: "7.1 km", city: "Hyderabad", isOpen: true },

        // Chennai
        { id: 'chn1', name: "DocAI Chennai T-Nagar", lat: 13.0401, lng: 80.2376, distance: "2.0 km", city: "Chennai", isOpen: true },
        { id: 'chn2', name: "DocAI Adyar", lat: 13.0033, lng: 80.2550, distance: "4.5 km", city: "Chennai", isOpen: true },
        { id: 'chn3', name: "DocAI Anna Nagar", lat: 13.0844, lng: 80.2119, distance: "5.5 km", city: "Chennai", isOpen: true },
        { id: 'chn4', name: "DocAI Velachery", lat: 12.9793, lng: 80.2223, distance: "8.0 km", city: "Chennai", isOpen: true },

        // Kolkata
        { id: 'kol1', name: "DocAI Kolkata Park Street", lat: 22.5550, lng: 88.3517, distance: "1.0 km", city: "Kolkata", isOpen: true },
        { id: 'kol2', name: "DocAI Salt Lake", lat: 22.5867, lng: 88.4170, distance: "6.0 km", city: "Kolkata", isOpen: true },
        { id: 'kol3', name: "DocAI Ballygunge", lat: 22.5280, lng: 88.3610, distance: "4.0 km", city: "Kolkata", isOpen: true },

        // Pune
        { id: 'pun1', name: "DocAI Pune Koregaon Park", lat: 18.5362, lng: 73.8940, distance: "2.5 km", city: "Pune", isOpen: true },
        { id: 'pun2', name: "DocAI Hinjewadi", lat: 18.5913, lng: 73.7389, distance: "12.0 km", city: "Pune", isOpen: true },
        { id: 'pun3', name: "DocAI Viman Nagar", lat: 18.5679, lng: 73.9143, distance: "5.0 km", city: "Pune", isOpen: true },

        // Ahmedabad
        { id: 'ahm1', name: "DocAI Ahmedabad SG Highway", lat: 23.0336, lng: 72.5118, distance: "3.0 km", city: "Ahmedabad", isOpen: true },
        { id: 'ahm2', name: "DocAI Satellite", lat: 23.0305, lng: 72.5173, distance: "4.0 km", city: "Ahmedabad", isOpen: true },
        { id: 'ahm3', name: "DocAI Mani Nagar", lat: 22.9961, lng: 72.6015, distance: "7.0 km", city: "Ahmedabad", isOpen: true },

        // Jaipur
        { id: 'jpr1', name: "DocAI Jaipur C-Scheme", lat: 26.9124, lng: 75.8013, distance: "2.0 km", city: "Jaipur", isOpen: true },
        { id: 'jpr2', name: "DocAI Malviya Nagar", lat: 26.8530, lng: 75.8093, distance: "5.0 km", city: "Jaipur", isOpen: true },
        { id: 'jpr3', name: "DocAI Vaishali Nagar", lat: 26.9056, lng: 75.7517, distance: "6.0 km", city: "Jaipur", isOpen: true },

        // Other Cities
        { id: 'oth1', name: "DocAI Surat Adajan", lat: 21.1959, lng: 72.7933, distance: "3.0 km", city: "Surat", isOpen: true },
        { id: 'oth2', name: "DocAI Lucknow Gomti Nagar", lat: 26.8467, lng: 80.9462, distance: "4.0 km", city: "Lucknow", isOpen: true },
        { id: 'oth3', name: "DocAI Kanpur Mall Road", lat: 26.4699, lng: 80.3541, distance: "2.0 km", city: "Kanpur", isOpen: true },
        { id: 'oth4', name: "DocAI Nagpur Dharampeth", lat: 21.1430, lng: 79.0664, distance: "3.5 km", city: "Nagpur", isOpen: true },
        { id: 'oth5', name: "DocAI Indore Vijay Nagar", lat: 22.7533, lng: 75.8937, distance: "4.2 km", city: "Indore", isOpen: true },
        { id: 'oth6', name: "DocAI Bhopal Arera Colony", lat: 23.2120, lng: 77.4439, distance: "5.0 km", city: "Bhopal", isOpen: true },
        { id: 'oth7', name: "DocAI Visakhapatnam Beach Road", lat: 17.7126, lng: 83.3151, distance: "1.0 km", city: "Visakhapatnam", isOpen: true },
        { id: 'oth8', name: "DocAI Pimpri Chinchwad", lat: 18.6298, lng: 73.7997, distance: "3.0 km", city: "PCMC", isOpen: true },
        { id: 'oth9', name: "DocAI Patna Fraser Road", lat: 25.6095, lng: 85.1374, distance: "2.0 km", city: "Patna", isOpen: true },
        { id: 'oth10', name: "DocAI Vadodara Alkapuri", lat: 22.3107, lng: 73.1709, distance: "2.5 km", city: "Vadodara", isOpen: true },
        { id: 'oth11', name: "DocAI Ghaziabad Indirapuram", lat: 28.6389, lng: 77.3688, distance: "3.0 km", city: "Ghaziabad", isOpen: true },
        { id: 'oth12', name: "DocAI Ludhiana Sarabha Nagar", lat: 30.8870, lng: 75.8171, distance: "2.0 km", city: "Ludhiana", isOpen: true },
        { id: 'oth13', name: "DocAI Agra Taj Ganj", lat: 27.1680, lng: 78.0421, distance: "4.5 km", city: "Agra", isOpen: true },
        { id: 'oth14', name: "DocAI Nashik College Road", lat: 20.0059, lng: 73.7558, distance: "2.5 km", city: "Nashik", isOpen: true }
    ];

    // Fetch Real Pharmacies via Overpass API with Smart Mock Fallback
    React.useEffect(() => {
        if (userLocation) {
            const fetchNearby = async () => {
                const [lat, lng] = userLocation;
                try {
                    // Helper to calc distance
                    const calculateDistance = (lat1, lon1, lat2, lon2) => {
                        const R = 6371; // km
                        const dLat = (lat2 - lat1) * Math.PI / 180;
                        const dLon = (lon2 - lon1) * Math.PI / 180;
                        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                            Math.sin(dLon / 2) * Math.sin(dLon / 2);
                        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
                        return parseFloat((R * c).toFixed(1)); // Return number
                    };

                    let realPharmacies = [];
                    try {
                        // Query for pharmacies within 5km (5000m)
                        const query = `[out:json][timeout:25];node(around:5000,${lat},${lng})["amenity"="pharmacy"];out body;`;
                        const res = await axios.post('https://overpass-api.de/api/interpreter', query, {
                            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
                        });

                        if (res.data && res.data.elements) {
                            realPharmacies = res.data.elements.map(node => ({
                                id: node.id,
                                name: node.tags.name || "Local Pharmacy",
                                lat: node.lat,
                                lng: node.lon,
                                distance: calculateDistance(lat, lng, node.lat, node.lon),
                                isOpen: true // Default as Overpass doesn't always have reliable hours
                            }));
                        }
                    } catch (apiError) {
                        console.warn("Overpass API failed, using mocks only", apiError);
                    }

                    // Calculate distance for ALL mocks relative to user
                    const updatedMocks = MOCK_INDIA_PHARMACIES.map(m => ({
                        ...m,
                        distance: calculateDistance(lat, lng, m.lat, m.lng)
                    }));

                    // Combine Real + Mocks
                    let allPharmacies = [...realPharmacies, ...updatedMocks];

                    // Sort by distance (ASC)
                    allPharmacies.sort((a, b) => a.distance - b.distance);

                    // Filter Logic:
                    // 1. If we have real pharmacies < 5km, show them first.
                    // 2. We want to show "nearest". By sorting, we naturally get the nearest.
                    // 3. User request: "only nearest... no pharmacies from delhi if in udaipur"
                    //    Since sorting puts far away cities at bottom (hundreds of km away), 
                    //    we just need to take the top N results. 
                    //    However, if user is in a "mock city", we want to ensure THOSE mock ones appear.

                    // Filter out anything > 100km away (to prevent showing Delhi results in Udaipur if lists are merged weirdly)
                    // UNLESS user location is weird and everything is far.
                    // Let's assume user is either in one of these cities or near real pharmacies.

                    // Filter to reasonable radius (e.g. 50km) to exclude cross-country results
                    const nearbyPharmacies = allPharmacies.filter(p => p.distance < 50);

                    // If we found nearby pharmacies (real or mock), show them.
                    // If 0, it means user is far from any mock city AND overpass found nothing.
                    // In that edge case, we might show nothing or the closest global ones.
                    // User said "if i am in udaipur... minimum 5 pharmacies should appear".
                    // Since we have mocks in Udaipur, if user is in Udaipur, dist < 50 condition is met.

                    let finalDisplay = nearbyPharmacies;

                    if (finalDisplay.length === 0) {
                        // Fallback: If absolutely nothing nearby, show the closest ones globally 
                        // (so map isn't empty, but user sees they are far)
                        finalDisplay = allPharmacies;
                    }

                    // Format distance string for display
                    const formatted = finalDisplay.slice(0, 10).map(p => ({
                        ...p,
                        distance: `${p.distance} km`
                    }));

                    setPharmacies(formatted);

                } catch (e) {
                    console.error("Error in pharmacy logic:", e);
                    setPharmacies(MOCK_INDIA_PHARMACIES.slice(0, 5).map(p => ({ ...p, distance: "Unknown" })));
                }
            };
            fetchNearby();
        } else {
            // Default view if no location (maybe just random or empty)
            setPharmacies(MOCK_INDIA_PHARMACIES.slice(0, 5)); // Just show some defaults
        }
    }, [userLocation]);

    // Orders State
    const [orders, setOrders] = React.useState([]);

    React.useEffect(() => {
        if (selectedCategory === 'Orders') {
            fetchOrders();
        }
    }, [selectedCategory]);

    // Fetch Inventory when selected
    React.useEffect(() => {
        if (selectedPharmacy) {
            fetchInventory();
        }
    }, [selectedPharmacy]);

    const fetchOrders = async () => {
        setLoading(true);
        try {
            const res = await axios.get('http://localhost:8003/pharmacy/orders', {
                params: { patient_id: "P-CURRENT-USER" }
            });
            const backendOrders = res.data.orders || [];
            // Merge: keep local orders that aren't in backend
            setOrders(prev => {
                const backendIds = new Set(backendOrders.map(o => o.id));
                const localOnly = prev.filter(o => !backendIds.has(o.id));
                return [...backendOrders, ...localOnly];
            });
        } catch (error) {
            console.error("Error fetching orders:", error);
            // Don't clear — keep any local orders
        } finally {
            setLoading(false);
        }
    };

    // Generate deterministic mock inventory based on pharmacy ID
    const generateMockInventory = (pharmacyId) => {
        // Simple hash function to get a seed from the ID
        let seed = 0;
        const str = pharmacyId.toString();
        for (let i = 0; i < str.length; i++) {
            seed = ((seed << 5) - seed) + str.charCodeAt(i);
            seed |= 0;
        }

        const allMedicines = [
            { id: '1', name: 'Paracetamol 500mg', description: 'Pain reliever', price: 5.99, category: 'OTC' },
            { id: '2', name: 'Amoxicillin 250mg', description: 'Antibiotic', price: 12.50, category: 'Prescription' },
            { id: '3', name: 'Vitamin C 1000mg', description: 'Immunity booster', price: 8.00, category: 'Wellness' },
            { id: '4', name: 'Ibuprofen 400mg', description: 'Anti-inflammatory', price: 6.50, category: 'OTC' },
            { id: '5', name: 'Cetirizine 10mg', description: 'Allergy relief', price: 4.25, category: 'OTC' },
            { id: '6', name: 'Metformin 500mg', description: 'Diabetes management', price: 15.00, category: 'Prescription' },
            { id: '7', name: 'Aspirin 75mg', description: 'Blood thinner', price: 3.50, category: 'OTC' },
            { id: '8', name: 'Omeprazole 20mg', description: 'Acid reflux', price: 9.75, category: 'OTC' },
            { id: '9', name: 'Atorvastatin 10mg', description: 'Cholesterol', price: 18.25, category: 'Prescription' },
            { id: '10', name: 'Multivitamin Complex', description: 'Daily supplement', price: 11.50, category: 'Wellness' },
            { id: '11', name: 'Cough Syrup 100ml', description: 'Cough relief', price: 7.25, category: 'OTC' },
            { id: '12', name: 'Azithromycin 500mg', description: 'Antibiotic', price: 22.00, category: 'Prescription' },
            { id: '13', name: 'Pantoprazole 40mg', description: 'Gastritis relief', price: 8.50, category: 'Prescription' },
            { id: '14', name: 'Dolo 650mg', description: 'Fever reducer', price: 2.00, category: 'OTC' },
            { id: '15', name: 'Calcium + D3', description: 'Bone health', price: 14.00, category: 'Wellness' }
        ];

        // Randomly select 6-12 items based on seed
        const absSeed = Math.abs(seed);
        const count = 6 + (absSeed % 7);
        const shuffled = [...allMedicines].sort((a, b) => {
            const valA = (a.id.charCodeAt(0) + absSeed) % 100;
            const valB = (b.id.charCodeAt(0) + absSeed) % 100;
            return valA - valB;
        });

        return shuffled.slice(0, count).map((item, idx) => ({
            ...item,
            id: `${pharmacyId}-${item.id}`,
            batchNo: `B${Math.abs(seed + idx).toString().slice(0, 4)}`,
            expiryDate: `202${5 + (idx % 3)}-${10 + (idx % 2)}-${15 + (idx % 12)}`
        }));
    };

    const fetchInventory = async () => {
        setLoading(true);
        try {
            // Try fetching from backend first
            const res = await axios.get(`http://localhost:8003/pharmacy/inventory?pharmacy_id=${selectedPharmacy.id}`);
            if (res.data && res.data.medicines && res.data.medicines.length > 0) {
                setProducts(res.data.medicines);
            } else {
                setProducts(generateMockInventory(selectedPharmacy.id));
            }
        } catch (error) {
            console.error("Error fetching inventory, using mock:", error);
            if (selectedPharmacy) {
                setProducts(generateMockInventory(selectedPharmacy.id));
            }
        } finally {
            setLoading(false);
        }
    };

    const handleCheckout = () => {
        setIsAddressModalOpen(true);
    };

    const confirmOrder = async () => {
        if (!deliveryAddress.trim()) {
            showToast("⚠️ Please enter a valid delivery address.");
            return;
        }

        setCheckoutStatus('processing');
        const orderPayload = {
            patient_id: "P-CURRENT-USER",
            patient_name: "Current Patient",
            items: cart.map(i => ({
                id: i.id,
                name: i.name,
                price: i.price,
                qty: i.qty,
                info: i.description
            })),
            total: cartTotal,
            delivery_address: deliveryAddress
        };

        let orderId = `local-${Date.now()}`;
        try {
            const res = await axios.post('http://localhost:8003/pharmacy/orders', orderPayload);
            if (res.data && res.data.order_id) orderId = res.data.order_id;
        } catch (error) {
            console.warn("Backend order failed, saving locally:", error);
        }

        // Always save locally so it shows immediately in Orders tab
        const newOrder = {
            id: orderId,
            ...orderPayload,
            status: "PENDING",
            created_at: new Date().toISOString()
        };
        setOrders(prev => [newOrder, ...prev]);

        setCheckoutStatus('success');
        setCart([]);
        setDeliveryAddress("");
        showToast("🎉 Order placed successfully!");

        setTimeout(() => {
            setCheckoutStatus('idle');
            setIsAddressModalOpen(false);
            setIsCartOpen(false);
            setSelectedCategory('Orders');
        }, 1500);
    };

    const categories = ["All", "Prescription", "Orders"];
    const filteredProducts = products.filter(product => {
        const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = selectedCategory === "All" || product.category === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    const itemVariant = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0 }
    };

    return (
        <div style={{
            padding: isMobile ? '1rem' : '2rem',
            paddingTop: '100px',
            maxWidth: '1200px',
            margin: '0 auto',
            position: 'relative',
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column'
        }}>
            {selectedPharmacy ? (
                // PRODUCT VIEW
                <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <button
                                onClick={() => setSelectedPharmacy(null)}
                                style={{
                                    background: '#f1f5f9', border: 'none', borderRadius: '50%',
                                    width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    cursor: 'pointer'
                                }}
                            >
                                <ArrowLeft size={20} color="#1e293b" />
                            </button>
                            <div>
                                <h1 style={{ fontSize: isMobile ? '1.5rem' : '2rem', fontWeight: 'bold', color: '#1e293b', margin: 0 }}>
                                    {selectedPharmacy.name}
                                </h1>
                                <p style={{ color: '#64748b', margin: 0 }}> medicines available</p>
                            </div>
                        </div>

                        <motion.button
                            animate={isCartAnimating ? { scale: [1, 1.2, 1], rotate: [0, 10, -10, 0] } : {}}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setIsCartOpen(true)}
                            style={{
                                position: 'relative', padding: '12px', borderRadius: '12px',
                                border: '1px solid #e2e8f0', background: isCartAnimating ? '#ecfdf5' : 'white', cursor: 'pointer',
                                transition: 'background-color 0.3s'
                            }}
                        >
                            <ShoppingCart size={24} color={isCartAnimating ? "#10b981" : "#1e293b"} />
                            {cart.length > 0 && (
                                <span style={{
                                    position: 'absolute', top: -5, right: -5,
                                    background: '#ef4444', color: 'white',
                                    width: '20px', height: '20px', borderRadius: '50%',
                                    fontSize: '0.75rem', display: 'flex', alignItems: 'center',
                                    justifyContent: 'center', fontWeight: 'bold'
                                }}>
                                    {cart.reduce((total, item) => total + item.qty, 0)}
                                </span>
                            )}
                        </motion.button>
                    </div>

                    {/* Filters */}
                    <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
                        <div style={{ flex: 1, position: 'relative' }}>
                            <Search style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} size={20} />
                            <input
                                type="text"
                                placeholder="Search medicines..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                style={{
                                    width: '100%', padding: '12px 12px 12px 48px',
                                    borderRadius: '12px', border: '1px solid #e2e8f0',
                                    fontSize: '1rem', outline: 'none'
                                }}
                            />
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '4px' }}>
                            {categories.map(cat => (
                                <button
                                    key={cat}
                                    onClick={() => setSelectedCategory(cat)}
                                    style={{
                                        padding: '8px 16px', borderRadius: '20px', border: 'none', cursor: 'pointer',
                                        background: selectedCategory === cat ? 'var(--color-primary)' : '#f1f5f9',
                                        color: selectedCategory === cat ? 'white' : '#64748b',
                                        fontWeight: '500', whiteSpace: 'nowrap'
                                    }}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Content View: Products or Orders */}
                    {selectedCategory === 'Orders' ? (
                        <div style={{ borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', background: 'white', padding: '1rem' }}>
                            <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem', color: '#1e293b' }}>My Orders</h2>
                            {orders.length === 0 ? (
                                <p style={{ color: '#94a3b8', textAlign: 'center', padding: '2rem' }}>No orders yet.</p>
                            ) : isMobile ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                    {orders.map(order => (
                                        <motion.div key={order.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                                            style={{ background: '#f8fafc', borderRadius: '12px', padding: '1rem', border: '1px solid #e2e8f0' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                                                <span style={{ fontWeight: 'bold', color: '#0f172a', fontSize: '0.9rem' }}>#{order.id.substring(0, 8)}</span>
                                                <span style={{
                                                    padding: '4px 10px', borderRadius: '12px',
                                                    background: ['COMPLETED', 'DELIVERED', 'READY'].includes(order.status?.toUpperCase()) ? '#dcfce7' : '#fff7ed',
                                                    color: ['COMPLETED', 'DELIVERED', 'READY'].includes(order.status?.toUpperCase()) ? '#16a34a' : '#c2410c',
                                                    fontSize: '0.8rem', fontWeight: '600'
                                                }}>{order.status || 'Pending'}</span>
                                            </div>
                                            <p style={{ color: '#64748b', fontSize: '0.85rem', margin: '0 0 4px 0' }}>
                                                {order.created_at ? new Date(order.created_at).toLocaleDateString() : 'N/A'}
                                            </p>
                                            <p style={{ color: '#334155', fontSize: '0.9rem', margin: '0 0 8px 0', lineHeight: '1.4' }}>
                                                {Array.isArray(order.items) ? order.items.map(i => i.name).join(', ') : order.items}
                                            </p>
                                            <div style={{ fontWeight: '700', fontSize: '1.1rem', color: '#0f172a' }}>₹{order.total?.toFixed(2)}</div>
                                        </motion.div>
                                    ))}
                                </div>
                            ) : (
                                <div style={{ overflowX: 'auto' }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '600px' }}>
                                        <thead>
                                            <tr style={{ borderBottom: '2px solid #f1f5f9', color: '#64748b', textAlign: 'left' }}>
                                                <th style={{ padding: '12px' }}>Order ID</th>
                                                <th style={{ padding: '12px' }}>Date</th>
                                                <th style={{ padding: '12px' }}>Items</th>
                                                <th style={{ padding: '12px' }}>Total</th>
                                                <th style={{ padding: '12px' }}>Status</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {orders.map(order => (
                                                <tr key={order.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                                    <td style={{ padding: '12px', fontWeight: 'bold', color: '#0f172a' }}>{order.id.substring(0, 8)}...</td>
                                                    <td style={{ padding: '12px', color: '#64748b' }}>{order.created_at ? new Date(order.created_at).toLocaleDateString() : 'N/A'}</td>
                                                    <td style={{ padding: '12px', color: '#334155' }}>{Array.isArray(order.items) ? order.items.map(i => i.name).join(', ') : order.items}</td>
                                                    <td style={{ padding: '12px', fontWeight: '600' }}>₹{order.total?.toFixed(2)}</td>
                                                    <td style={{ padding: '12px' }}>
                                                        <span style={{
                                                            padding: '4px 8px', borderRadius: '12px',
                                                            background: ['COMPLETED', 'DELIVERED', 'READY'].includes(order.status?.toUpperCase()) ? '#dcfce7' : '#fff7ed',
                                                            color: ['COMPLETED', 'DELIVERED', 'READY'].includes(order.status?.toUpperCase()) ? '#16a34a' : '#c2410c',
                                                            fontSize: '0.85rem', fontWeight: '600'
                                                        }}>{order.status || 'Pending'}</span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    ) : (
                        loading ? (
                            <div style={{ textAlign: 'center', padding: '4rem' }}>Loading medicines...</div>
                        ) : isMobile ? (
                            /* Mobile Card Layout */
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                {filteredProducts.map((product, index) => (
                                    <motion.div
                                        key={product.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.03 }}
                                        style={{
                                            background: 'white', borderRadius: '12px', padding: '1rem',
                                            border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
                                        }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '0.75rem' }}>
                                            <div style={{ width: '40px', height: '40px', background: '#f1f5f9', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                <Pill size={20} color="#94a3b8" />
                                            </div>
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{ fontWeight: '600', color: '#0f172a', fontSize: '0.95rem' }}>{product.name}</div>
                                                <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{product.category}</div>
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                                            <div style={{ display: 'flex', gap: '1rem', fontSize: '0.8rem', color: '#64748b' }}>
                                                <span>Batch: {product.batchNo || 'N/A'}</span>
                                                <span>Exp: {product.expiryDate || 'N/A'}</span>
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid #f1f5f9' }}>
                                            <span style={{ fontWeight: '700', color: '#0f172a', fontSize: '1.1rem' }}>₹{product.price.toFixed(2)}</span>
                                            <button
                                                onClick={() => addToCart(product)}
                                                style={{
                                                    background: 'var(--color-primary)', color: 'white',
                                                    border: 'none', padding: '10px 20px', borderRadius: '8px',
                                                    fontWeight: '600', cursor: 'pointer', display: 'inline-flex',
                                                    alignItems: 'center', gap: '4px', fontSize: '0.9rem'
                                                }}
                                            >
                                                <Plus size={16} /> Add
                                            </button>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        ) : (
                            /* Desktop Table Layout */
                            <div style={{ overflowX: 'auto', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '800px' }}>
                                    <thead>
                                        <tr style={{ background: '#f8fafc', color: '#64748b', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                            <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600' }}>Medicine Name</th>
                                            <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600' }}>Batch No</th>
                                            <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600' }}>Expiry Date</th>
                                            <th style={{ padding: '16px', textAlign: 'right', fontWeight: '600' }}>Price / Unit</th>
                                            <th style={{ padding: '16px', textAlign: 'center', fontWeight: '600' }}>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredProducts.map((product, index) => (
                                            <motion.tr
                                                key={product.id}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: index * 0.05 }}
                                                style={{ borderTop: '1px solid #e2e8f0', background: 'white' }}
                                            >
                                                <td style={{ padding: '16px' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                        <div style={{ width: '40px', height: '40px', background: '#f1f5f9', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                            <Pill size={20} color="#94a3b8" />
                                                        </div>
                                                        <div>
                                                            <div style={{ fontWeight: '600', color: '#0f172a' }}>{product.name}</div>
                                                            <div style={{ fontSize: '0.85rem', color: '#64748b' }}>{product.category}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td style={{ padding: '16px', color: '#64748b' }}>{product.batchNo || 'N/A'}</td>
                                                <td style={{ padding: '16px', color: '#64748b' }}>{product.expiryDate || 'N/A'}</td>
                                                <td style={{ padding: '16px', textAlign: 'right', fontWeight: '600', color: '#0f172a' }}>₹{product.price.toFixed(2)}</td>
                                                <td style={{ padding: '16px', textAlign: 'center' }}>
                                                    <button
                                                        onClick={() => addToCart(product)}
                                                        style={{
                                                            background: 'var(--color-primary)', color: 'white',
                                                            border: 'none', padding: '8px 16px', borderRadius: '8px',
                                                            fontWeight: '600', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px'
                                                        }}
                                                    >
                                                        <Plus size={16} /> Add to Cart
                                                    </button>
                                                </td>
                                            </motion.tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )
                    )}
                </>
            ) : (
                // MAP VIEW
                <>
                    <div style={{
                        display: 'flex',
                        flexDirection: isMobile ? 'column' : 'row',
                        justifyContent: 'space-between',
                        alignItems: isMobile ? 'flex-start' : 'center',
                        marginBottom: isMobile ? '1rem' : '2rem',
                        gap: isMobile ? '1rem' : '0'
                    }}>
                        <div>
                            <h1 style={{
                                fontSize: isMobile ? '1.75rem' : '2.5rem',
                                fontWeight: 'bold',
                                color: '#1e293b',
                                marginBottom: '0.5rem'
                            }}>
                                Pharmacy Locations
                            </h1>
                            <p style={{ color: '#64748b', fontSize: isMobile ? '0.9rem' : '1rem' }}>
                                Find a DocAI pharmacy near you
                            </p>
                        </div>
                    </div>

                    <div style={{
                        height: isMobile ? '50vh' : '60vh',
                        width: '100%',
                        borderRadius: '16px',
                        overflow: 'hidden',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                        border: '1px solid #e2e8f0',
                        marginBottom: '2rem',
                        flexShrink: 0
                    }}>
                        <MapComponent pharmacies={pharmacies} userLocation={userLocation} mapCenter={mapCenter} />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', paddingBottom: '2rem' }}>
                        <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1e293b', marginBottom: '0.5rem' }}>
                            Nearby Pharmacies
                        </h2>

                        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                            {pharmacies.map(pharmacy => (
                                <motion.div
                                    key={pharmacy.id}
                                    whileHover={{ scale: 1.02 }}
                                    onClick={() => setSelectedPharmacy(pharmacy)}
                                    style={{
                                        background: 'white',
                                        borderRadius: '16px',
                                        border: '1px solid #e2e8f0',
                                        padding: '1.5rem',
                                        boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '0.75rem',
                                        cursor: 'pointer'
                                    }}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <h3 style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#0f172a', margin: 0 }}>{pharmacy.name}</h3>
                                        {pharmacy.isOpen ? (
                                            <span style={{ background: '#dcfce7', color: '#16a34a', fontSize: '0.75rem', padding: '4px 8px', borderRadius: '12px', fontWeight: '600' }}>Open</span>
                                        ) : (
                                            <span style={{ background: '#f1f5f9', color: '#64748b', fontSize: '0.75rem', padding: '4px 8px', borderRadius: '12px', fontWeight: '600' }}>Closed</span>
                                        )}
                                    </div>

                                    {/* Removed Address/Hours/Phone as requested */}

                                    <div style={{ marginTop: 'auto', paddingTop: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ fontWeight: '600', color: '#0f172a' }}>{pharmacy.distance}</span>
                                        <button style={{
                                            display: 'flex', alignItems: 'center', gap: '0.5rem',
                                            padding: '8px 16px', borderRadius: '8px',
                                            background: '#f1f5f9', color: '#1e293b',
                                            border: 'none', fontWeight: '500', cursor: 'pointer'
                                        }}>
                                            <Navigation size={16} />
                                            Visit Store
                                        </button>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </>
            )}

            {/* Cart Sidebar Modal (Same as before) */}
            {isAddressModalOpen && (
                <div style={{
                    position: 'fixed', inset: 0, zIndex: 3000,
                    backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                        style={{
                            background: 'white', padding: '2rem', borderRadius: '16px',
                            width: '90%', maxWidth: '500px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
                        }}
                    >
                        <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem', color: '#1e293b' }}>Enter Delivery Address</h2>
                        <textarea
                            value={deliveryAddress}
                            onChange={(e) => setDeliveryAddress(e.target.value)}
                            placeholder="Enter your full address here..."
                            style={{
                                width: '100%', height: '100px', padding: '12px',
                                borderRadius: '8px', border: '1px solid #e2e8f0',
                                marginBottom: '1.5rem', resize: 'none', fontSize: '1rem', fontFamily: 'inherit'
                            }}
                        />
                        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                            <button
                                onClick={() => setIsAddressModalOpen(false)}
                                style={{
                                    padding: '10px 20px', borderRadius: '8px',
                                    border: '1px solid #e2e8f0', background: 'white',
                                    cursor: 'pointer', fontWeight: '600', color: '#64748b'
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmOrder}
                                disabled={checkoutStatus === 'processing'}
                                style={{
                                    padding: '10px 20px', borderRadius: '8px',
                                    border: 'none', background: 'var(--color-primary)',
                                    color: 'white', cursor: 'pointer', fontWeight: '600'
                                }}
                            >
                                {checkoutStatus === 'processing' ? 'Processing...' : 'Confirm Order'}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}

            {isCartOpen && (
                <div style={{
                    position: 'fixed', inset: 0, zIndex: 2000,
                    backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'flex-end'
                }}>
                    <motion.div
                        initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
                        style={{
                            width: isMobile ? '100%' : '100%', maxWidth: isMobile ? '100%' : '400px', background: 'white',
                            height: '100%', padding: isMobile ? '1rem' : '2rem', display: 'flex', flexDirection: 'column',
                            boxShadow: '-4px 0 15px rgba(0,0,0,0.1)'
                        }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                            <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Your Cart</h2>
                            <button onClick={() => setIsCartOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                                <X size={24} />
                            </button>
                        </div>

                        <div style={{ flex: 1, overflowY: 'auto' }}>
                            {cart.length === 0 ? (
                                <p style={{ color: '#64748b', textAlign: 'center', marginTop: '2rem' }}>Your cart is empty.</p>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                    {cart.map(item => (
                                        <div key={item.id} style={{ display: 'flex', gap: '1rem', paddingBottom: '1rem', borderBottom: '1px solid #f1f5f9' }}>
                                            <div style={{ width: '60px', height: '60px', background: '#f8fafc', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                <Pill size={24} color="#cbd5e1" />
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <h4 style={{ margin: '0 0 4px 0', fontWeight: '600' }}>{item.name}</h4>
                                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                                    <span style={{ fontWeight: 'bold', color: 'var(--color-primary)' }}>₹{item.price.toFixed(2)}</span>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                        <button onClick={() => updateQty(item.id, -1)} style={{ padding: '2px', borderRadius: '4px', border: '1px solid #e2e8f0', cursor: 'pointer', background: 'white' }}><Minus size={14} /></button>
                                                        <span style={{ fontSize: '0.9rem' }}>{item.qty}</span>
                                                        <button onClick={() => updateQty(item.id, 1)} style={{ padding: '2px', borderRadius: '4px', border: '1px solid #e2e8f0', cursor: 'pointer', background: 'white' }}><Plus size={14} /></button>
                                                    </div>
                                                </div>
                                            </div>
                                            <button onClick={() => removeFromCart(item.id)} style={{ alignSelf: 'start', background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}>
                                                <X size={16} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div style={{ marginTop: '2rem', borderTop: '2px solid #f1f5f9', paddingTop: '1rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', fontSize: '1.2rem', fontWeight: 'bold' }}>
                                <span>Total</span>
                                <span>₹{cartTotal.toFixed(2)}</span>
                            </div>
                            <button
                                onClick={handleCheckout}
                                disabled={cart.length === 0 || checkoutStatus === 'processing'}
                                style={{
                                    width: '100%', padding: '16px', borderRadius: '12px',
                                    background: checkoutStatus === 'success' ? '#10b981' : 'var(--color-primary)',
                                    color: 'white', border: 'none', fontWeight: 'bold', fontSize: '1.1rem',
                                    cursor: cart.length === 0 ? 'not-allowed' : 'pointer',
                                    opacity: cart.length === 0 ? 0.5 : 1
                                }}
                            >
                                {checkoutStatus === 'processing' ? 'Processing...' :
                                    checkoutStatus === 'success' ? 'Order Placed!' :
                                        'Place Order'}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
            {/* Toast Notification */}
            {toast && (
                <div style={{
                    position: 'fixed', bottom: '2rem', left: '50%', transform: 'translateX(-50%)',
                    background: '#334155', color: 'white', padding: isMobile ? '10px 16px' : '12px 24px', borderRadius: '50px',
                    boxShadow: '0 4px 6px rgba(0,0,0,0.1)', zIndex: 4000, display: 'flex', alignItems: 'center', gap: '8px',
                    animation: 'fadeIn 0.3s ease-out', maxWidth: isMobile ? '90vw' : 'auto', fontSize: isMobile ? '0.9rem' : '1rem'
                }}>
                    <span style={{ fontSize: '1.2rem' }}>✅</span>
                    {toast}
                </div>
            )}
        </div>
    );
};

export default Pharmacy;
