# Pharmacy Portal Schema

## Design Philosophy
This schema is designed to exist **alongside** the current Doctor/Patient schema without modifying any existing collections. It utilizes the "Shared Database" pattern where the Pharmacy Portal acts as an independent service that reads/writes to these specific collections.

---

## 1. Collection: `pharmacy_inventory`
**Purpose**: Stores available medicines and their stock levels. The Patient Portal queries this to show available medicines. Geo-spatial queries can be performed using the `location` field.

### Document Structure (JSON)
```json
{
  "id": "med_12345",              // Auto-generated Firestore ID
  "name": "Paracetamol 650mg",    // Medicine Name
  "type": "Tablet",               // Tablet, Syrup, Injection, etc.
  "category": "Analgesic",        // General Category
  "description": "For fever and mild pain relief.", 
  "price": 5.00,                  // Unit Price
  "currency": "INR",

  "stock_count": 500,             // Current inventory level
  "is_available": true,           // Computed or manual toggle

  "pharmacy_id": "pharma_001",    // ID of the pharmacy node (if multiple pharmacies exist)
  "location": {                   // Geospatial data for "Pharmacies Near Me"
    "latitude": 28.6139,
    "longitude": 77.2090
  },
  
  "created_at": "2024-02-11T10:00:00Z",
  "updated_at": "2024-02-11T12:00:00Z"
}
```

### Usage Patterns
*   **Patient Portal**: `GET /pharmacy_inventory where stock_count > 0`
*   **Pharmacy Portal**: `UPDATE /pharmacy_inventory` (Stock management)

---

## 2. Collection: `pharmacy_orders`
**Purpose**: The integration bridge. Patients write to this when they checkout. Pharmacy monitors this for incoming requests.

### Document Structure (JSON)
```json
{
  "id": "order_98765",            // Auto-generated Firestore ID
  
  // --- Linkage to Existing System ---
  "patient_id": "user_profile_123", // Matches 'profile_id' in existing system
  "case_id": "case_555",            // (Optional) Link to a specific medical case/consultation
  "doctor_id": "doc_007",           // (Optional) Validating doctor if prescription required
  "prescription_id": "record_abc",   // (Optional) Link to 'medical_records' or 'prescriptions' collection

  // --- Order Details ---
  "items": [
    {
      "medicine_id": "med_12345",
      "name": "Paracetamol 650mg",
      "quantity": 2,
      "price_at_booking": 5.00
    }
  ],
  "total_amount": 10.00,
  "currency": "INR",

  // --- Logistics & Status ---
  "status": "PENDING",            // Lifecycle: PENDING -> ACCEPTED -> PACKED -> DISPATCHED -> COMPLETED
  "delivery_address": {
    "street": "123 Main St",
    "city": "Delhi",
    "zip": "110001",
    "coordinates": { "lat": 28.6, "lon": 77.2 }
  },

  // --- Timestamps for SLA Tracking ---
  "created_at": "2024-02-11T14:30:00Z",
  "accepted_at": null,
  "dispatched_at": null,
  "completed_at": null
}
```

### Usage Patterns
*   **Patient Portal**: `POST /pharmacy_orders` (Create PENDING order)
*   **Patient Portal**: `GET /pharmacy_orders` (Track my orders)
*   **Pharmacy Portal**: `SNAPSHOT_LISTENER` on `where status == 'PENDING'` (Real-time dashboard)
*   **Pharmacy Portal**: `UPDATE status = 'DISPATCHED'` (Fulfillment workflow)

---

## 3. Integration with Existing `medical_records` (Optional)
If a prescription is generated in the Doctor Portal, it is stored in `prescriptions` (or `medical_records` type="prescription").
The `pharmacy_orders` collection references this via `prescription_id`.

**Validation Flow**:
1.  Patient selects "Buy Medicine" from a Prescription record.
2.  Frontend grabs the `record_id` of the prescription.
3.  New Order is created in `pharmacy_orders` with `"prescription_id": "record_id"`.
4.  Pharmacy Portal can fetch `db.collection('prescriptions').document(order.prescription_id)` to verify the script.
