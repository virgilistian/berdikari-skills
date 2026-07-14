import { defineStore } from 'pinia';
import { ref, computed, watch } from 'vue';
import { useLocalStorage, useOnline } from '@vueuse/core';
import { useAuthStore } from '~/stores/auth';

export interface CartItem {
    product_id: string;
    name: string;
    unit_price: number;
    quantity: number;
    subtotal: number;
}

/** A checkout captured while offline, waiting to be synced to the API. */
export interface PendingOrder {
    /** Idempotency key — the API refuses to create the same order twice. */
    client_uuid: string;
    payload: Record<string, any>;
    total_amount: number;
    created_at: string;
    /** 'queued' retries on reconnect; 'failed' was rejected by the server. */
    status: 'queued' | 'failed';
    error?: string;
}

export interface SaleOrder {
    id: string;
    order_no: string | null;
    status: string;
    payment_status: string;
    total_amount: string;
    paid_amount: string;
    change_amount: string;
    balance_due: number;
    customer_name: string | null;
    items: any[];
    payments: any[];
    created_at: string;
}

export const useCartStore = defineStore('cart', () => {
    const items = ref<any[]>([]);
    const submitting = ref(false);
    const lastOrder = ref<SaleOrder | null>(null);
    const customerName = ref('');

    // ── Offline queue ────────────────────────────────────────────────────────
    // Transactions captured while the network is down. Persisted in
    // localStorage so nothing is lost across reloads; synced automatically
    // on reconnect. client_uuid makes every retry idempotent server-side.
    const pendingOrders = useLocalStorage<PendingOrder[]>('berdikari_pos_queue', []);
    const syncing = ref(false);
    const online = import.meta.client ? useOnline() : ref(true);
    const isOffline = computed(() => !online.value);
    const queuedCount = computed(() =>
        pendingOrders.value.filter(o => o.status === 'queued').length);

    /** True when the last submitted order was stored offline (not yet synced). */
    const lastOrderQueued = ref(false);

    const addToCart = (product: any) => {
        const existing = items.value.find(item => item.product_id === product.id);
        if (existing) {
            existing.quantity++;
            existing.subtotal = existing.quantity * existing.unit_price;
        } else {
            items.value.push({
                product_id: product.id,
                name: product.name,
                unit_price: product.price,
                quantity: 1,
                subtotal: product.price,
            });
        }
    };

    const removeFromCart = (productId: string) => {
        items.value = items.value.filter(item => item.product_id !== productId);
    };

    const increaseQuantity = (productId: string) => {
        const item = items.value.find(item => item.product_id === productId);
        if (item) {
            item.quantity++;
            item.subtotal = item.quantity * item.unit_price;
        }
    };

    const decreaseQuantity = (productId: string) => {
        const item = items.value.find(item => item.product_id === productId);
        if (item) {
            if (item.quantity > 1) {
                item.quantity--;
                item.subtotal = item.quantity * item.unit_price;
            } else {
                removeFromCart(productId);
            }
        }
    };

    const clearCart = () => {
        items.value = [];
        customerName.value = '';
    };

    const totalAmount = computed(() => {
        return items.value.reduce((total, item) => total + item.subtotal, 0);
    });

    const totalItems = computed(() => {
        return items.value.reduce((total, item) => total + item.quantity, 0);
    });

    /**
     * Submit the current cart to the Sales API.
     *
     * @param action    'complete' finalizes the order (goods out), 'hold' saves it.
     * @param payment    Amount tendered. undefined = pay later (no payment).
     * @param method     Payment method (cash | qris | transfer).
     * @param customerName Optional customer label for pay-later / receipts.
     */
    async function submitOrder(opts: {
        action?: 'complete' | 'hold';
        payment?: number;
        method?: string;
        customerName?: string;
    } = {}): Promise<SaleOrder> {
        if (items.value.length === 0) throw new Error('Keranjang kosong');
        const auth = useAuthStore();
        const api = useApi();
        submitting.value = true;
        lastOrderQueued.value = false;
        try {
            const payments = (opts.payment && opts.payment > 0)
                ? [{ amount: opts.payment, method: opts.method ?? 'cash' }]
                : [];

            const payload = {
                business_id: auth.user?.business_id,
                client_uuid: crypto.randomUUID(),
                action: opts.action ?? 'complete',
                customer_name: opts.customerName ?? (customerName.value || null),
                items: items.value.map(i => ({
                    product_id: i.product_id,
                    quantity: i.quantity,
                    unit_price: i.unit_price,
                })),
                payments,
            };

            try {
                const res = await api<{ data: SaleOrder }>('/v1/sales/orders', {
                    method: 'POST',
                    body: payload,
                });
                lastOrder.value = res.data;
                clearCart();
                return res.data;
            } catch (err: any) {
                // Server answered (4xx/5xx): a real rejection — do NOT queue.
                if (err?.response) throw err;

                // No response = network down. Store the transaction locally;
                // it will sync automatically when the connection returns.
                const queued = enqueueOffline(payload);
                lastOrder.value = queued;
                lastOrderQueued.value = true;
                clearCart();
                return queued;
            }
        } finally {
            submitting.value = false;
        }
    }

    /** Persist an offline transaction and return a receipt-shaped order. */
    function enqueueOffline(payload: Record<string, any>): SaleOrder {
        const total = (payload.items as any[]).reduce(
            (sum, i) => sum + i.quantity * i.unit_price, 0);
        const paid = (payload.payments as any[]).reduce(
            (sum, p) => sum + Number(p.amount ?? 0), 0);

        pendingOrders.value = [...pendingOrders.value, {
            client_uuid: payload.client_uuid,
            payload,
            total_amount: total,
            created_at: new Date().toISOString(),
            status: 'queued',
        }];

        return {
            id: payload.client_uuid,
            order_no: null,
            status: payload.action === 'hold' ? 'open' : 'completed',
            payment_status: paid >= total ? 'paid' : (paid > 0 ? 'partial' : 'unpaid'),
            total_amount: String(total),
            paid_amount: String(Math.min(paid, total)),
            change_amount: String(Math.max(0, paid - total)),
            balance_due: Math.max(0, total - paid),
            customer_name: payload.customer_name ?? null,
            items: payload.items,
            payments: payload.payments,
            created_at: new Date().toISOString(),
        };
    }

    /**
     * Push every queued offline transaction to the API. Safe to call any
     * time: the server deduplicates via client_uuid, so a retry after a
     * half-finished sync can never create duplicates.
     */
    async function syncPendingOrders(): Promise<void> {
        if (syncing.value || !online.value) return;
        const queue = pendingOrders.value.filter(o => o.status === 'queued');
        if (queue.length === 0) return;

        const api = useApi();
        syncing.value = true;
        try {
            for (const pending of queue) {
                try {
                    await api('/v1/sales/orders', { method: 'POST', body: pending.payload });
                    pendingOrders.value = pendingOrders.value.filter(
                        o => o.client_uuid !== pending.client_uuid);
                } catch (err: any) {
                    if (err?.response) {
                        // Rejected by the server (e.g. product deleted): keep it
                        // visible as failed instead of retrying forever.
                        pendingOrders.value = pendingOrders.value.map(o =>
                            o.client_uuid === pending.client_uuid
                                ? { ...o, status: 'failed' as const, error: err?.data?.message ?? 'Ditolak server' }
                                : o);
                    } else {
                        // Still offline — stop and retry on the next reconnect.
                        break;
                    }
                }
            }
        } finally {
            syncing.value = false;
        }
    }

    /** Remove a transaction the server rejected (after the kasir reviewed it). */
    function discardPendingOrder(clientUuid: string) {
        pendingOrders.value = pendingOrders.value.filter(o => o.client_uuid !== clientUuid);
    }

    // Auto-sync whenever the connection comes back (and once on app start).
    if (import.meta.client) {
        watch(online, (isOnline) => {
            if (isOnline) void syncPendingOrders();
        });
        void syncPendingOrders();
    }

    /** Add a payment against an existing order (partial payment / settle pay-later). */
    async function payOrder(orderId: string, amount: number, method = 'cash'): Promise<SaleOrder> {
        const api = useApi();
        const res = await api<{ data: SaleOrder }>(`/v1/sales/orders/${orderId}/payments`, {
            method: 'POST',
            body: { amount, method },
        });
        return res.data;
    }

    return {
        items,
        submitting,
        lastOrder,
        customerName,
        // Offline mode
        pendingOrders,
        queuedCount,
        isOffline,
        syncing,
        lastOrderQueued,
        syncPendingOrders,
        discardPendingOrder,
        addToCart,
        removeFromCart,
        increaseQuantity,
        decreaseQuantity,
        clearCart,
        submitOrder,
        payOrder,
        totalAmount,
        totalItems,
    };
});
