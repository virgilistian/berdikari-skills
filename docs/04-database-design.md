# Database Design (ERD)

Pendekatan Multi-Tenant: Kita menggunakan **Single Database, Shared Schema** dengan kolom `business_id` sebagai Diskriminator Tenant untuk mempermudah pemeliharaan dan menekan biaya infrastruktur. Keamanan data lintas penyewa (cross-tenant) dijamin melalui implementasi Laravel Global Scope.

```mermaid
erDiagram
    BUSINESS {
        uuid id PK
        string name
        string tax_id
        datetime created_at
    }
    BRANCH {
        uuid id PK
        uuid business_id FK
        string name
        string address
    }
    USER {
        uuid id PK
        uuid business_id FK
        string name
        string email
        string password
        string role "owner, cashier, production"
    }
    PRODUCT {
        uuid id PK
        uuid business_id FK
        string name
        string sku
        decimal price
    }
    INVENTORY {
        uuid id PK
        uuid branch_id FK
        uuid product_id FK
        int quantity
    }
    SALE_ORDER {
        uuid id PK
        uuid branch_id FK
        uuid user_id FK
        decimal total_amount
        string status "pending, completed"
    }
    ORDER_ITEM {
        uuid id PK
        uuid order_id FK
        uuid product_id FK
        int quantity
        decimal unit_price
    }
    PRODUCTION_PLAN {
        uuid id PK
        uuid branch_id FK
        uuid product_id FK
        date target_date
        int recommended_qty
        int actual_qty
    }

    BUSINESS ||--o{ BRANCH : "has"
    BUSINESS ||--o{ USER : "has"
    BUSINESS ||--o{ PRODUCT : "has"
    BRANCH ||--o{ INVENTORY : "stores"
    BRANCH ||--o{ SALE_ORDER : "creates"
    PRODUCT ||--o{ INVENTORY : "tracked in"
    SALE_ORDER ||--|{ ORDER_ITEM : "contains"
    PRODUCT ||--o{ ORDER_ITEM : "ordered as"
    BRANCH ||--o{ PRODUCTION_PLAN : "plans"
    PRODUCT ||--o{ PRODUCTION_PLAN : "planned for"
```
