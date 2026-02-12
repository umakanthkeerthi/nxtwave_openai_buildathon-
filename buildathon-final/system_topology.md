# System Topology and Architecture

## 1. System Overview

The system consists of three functional portals organized under a split deployment and repository topology:

*   **Doctor Portal**
*   **Patient Portal**
*   **Pharmacy Portal**

Despite infrastructure separation, logical integration is achieved through a shared database acting as the cross-portal communication layer.

## 2. Deployment and Repository Topology

### Doctor and Patient Portals (Unified)
*   **Repository**: Co-located within the same source code repository.
*   **Build Pipeline**: Shared build pipelines.
*   **Deployment**: Deployed together using the same Vercel and Render infrastructure.
*   **Runtime**: Operate within a unified runtime, configuration space, and CI/CD workflow.

### Pharmacy Portal (Isolated)
*   **Repository**: Resides in a separate GitHub repository with independent version control.
*   **Build Pipeline**: Independent build pipelines.
*   **Deployment**: Deployed through distinct Vercel and Render services.
*   **Benefit**: This separation allows independent iteration and lifecycle management of pharmacy functionality without affecting patient or doctor components.

## 3. Integration Strategy

*   **Mechanism**: A single shared database functions as the cross-portal communication layer.
*   **Communication Style**: Indirect data exchange. Portals do not communicate directly through service-to-service API calls.
*   **Protocol**: Interaction occurs by reading from and writing to common data structures governed by shared schema conventions.

## 4. Operational Data Flow

1.  **Inventory Query**: The patient portal queries pharmacy inventory datasets stored in the database to determine medicine availability (optionally filtered by geospatial metadata).
2.  **Order Creation**: When an order is placed, a structured transaction record is written to the database (including identifiers, routing attributes, timestamps, and lifecycle status).
3.  **Order Monitoring**: The pharmacy portal continuously monitors the database for new orders.
4.  **Fulfillment**: The pharmacy portal validates stock and updates order lifecycle states (acceptance, packaging, dispatch, completion).
5.  **State Reflection**: These updates propagate through the shared data layer and are subsequently reflected in the patient and doctor interfaces.

## 5. Architecture Intent

*   **Stage**: Pre-production.
*   **Goal**: Rapid integration with minimal infrastructure complexity.
*   **Priorities**: Execution speed, modular repository isolation, and deployment independence.
*   **Future Path**: Extensible toward future migration into a centralized orchestration backend or service gateway when scaling requirements increase.

---

## Summary Configuration

```yaml
system_topology:
  doctor_patient_portals:
    repository: shared
    deployment:
      vercel: shared_instance
      render: shared_instance

  pharmacy_portal:
    repository: independent
    deployment:
      vercel: independent_instance
      render: independent_instance

integration_layer:
  type: shared_database
  communication: indirect_data_exchange

data_flow:
  - patient_queries_inventory_from_database
  - patient_creates_order_record
  - pharmacy_reads_order_record
  - pharmacy_updates_fulfillment_status
  - updates_reflected_back_to_patient_doctor

architecture_intent:
  stage: pre_production
  goal: rapid integration_with_minimal_infrastructure_complexity
  future_path: centralized_backend_orchestration
```
