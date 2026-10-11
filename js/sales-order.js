
const API_BASE = "http://localhost:8080/api";

const orderForm = document.getElementById("salesOrderForm");
const orderTableBody = document.getElementById("salesOrderTableBody");
const orderItemsBody = document.getElementById("orderItemsBody");
const messageBox = document.getElementById("message");
const formMessage = document.getElementById("formMessage");

let products = [];

function authHeaders() {
    const token = localStorage.getItem("token");

    return {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {})
    };
}

function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, character => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
    })[character]);
}

function showMessage(element, message, type = "success") {
    element.textContent = message;
    element.className = `alert alert-${type}`;
}

function hideMessage(element) {
    element.textContent = "";
    element.className = "alert d-none";
}

async function apiGet(path) {
    const response = await fetch(`${API_BASE}${path}`, {
        headers: authHeaders()
    });

    if (!response.ok) {
        throw new Error(`Request failed for ${path} (${response.status})`);
    }

    return response.json();
}

async function loadDropdowns() {
    try {
        const [customers, warehouses, productList] = await Promise.all([
            apiGet("/customers"),
            apiGet("/warehouses"),
            apiGet("/products")
        ]);

        products = productList;

        fillDropdown(
            document.getElementById("customerId"),
            customers,
            "Select customer",
            customer => customer.name
        );

        fillDropdown(
            document.getElementById("warehouseId"),
            warehouses,
            "Select warehouse",
            warehouse => warehouse.name
        );

        if (!products.length) {
            showMessage(formMessage, "No products found. Add products before creating an order.", "warning");
        } else {
            hideMessage(formMessage);
        }

        if (orderItemsBody.children.length === 0) {
            addOrderItem();
        } else {
            refreshProductDropdowns();
        }
    } catch (error) {
        console.error("Dropdown loading error:", error);
        showMessage(
            formMessage,
            "Could not load customers, warehouses, or products. Check your API and permissions.",
            "danger"
        );
    }
}

function fillDropdown(select, records, placeholder, getLabel) {
    select.innerHTML = `<option value="">${escapeHtml(placeholder)}</option>`;

    records.forEach(record => {
        const option = document.createElement("option");
        option.value = record.id;
        option.textContent = getLabel(record);
        select.appendChild(option);
    });
}

function productOptions(selectedId = "") {
    return `
        <option value="">Select product</option>
        ${products.map(product => `
            <option value="${escapeHtml(product.id)}"
                ${String(product.id) === String(selectedId) ? "selected" : ""}>
                ${escapeHtml(product.name)}
            </option>
        `).join("")}
    `;
}

function refreshProductDropdowns() {
    orderItemsBody.querySelectorAll(".item-product").forEach(select => {
        const previousValue = select.value;
        select.innerHTML = productOptions(previousValue);
    });
}

function addOrderItem() {
    const row = document.createElement("tr");

    row.innerHTML = `
        <td>
            <select class="form-select item-product" required>
                ${productOptions()}
            </select>
        </td>
        <td>
            <input type="number" class="form-control item-quantity"
                   min="0.01" step="any" value="1" required>
        </td>
        <td>
            <input type="number" class="form-control item-price"
                   min="0.01" step="any" placeholder="Unit price" required>
        </td>
        <td class="item-subtotal">0.00</td>
        <td>
            <button type="button" class="btn btn-outline-danger btn-sm remove-item">
                Remove
            </button>
        </td>
    `;

    orderItemsBody.appendChild(row);

    row.querySelector(".item-quantity").addEventListener("input", calculateTotal);
    row.querySelector(".item-price").addEventListener("input", calculateTotal);

    row.querySelector(".remove-item").addEventListener("click", () => {
        if (orderItemsBody.children.length === 1) {
            showMessage(formMessage, "A sales order must contain at least one item.", "warning");
            return;
        }

        row.remove();
        calculateTotal();
        hideMessage(formMessage);
    });

    calculateTotal();
}

function calculateTotal() {
    let total = 0;

    orderItemsBody.querySelectorAll("tr").forEach(row => {
        const quantity = Number(row.querySelector(".item-quantity").value);
        const price = Number(row.querySelector(".item-price").value);
        const subtotal = quantity > 0 && price > 0 ? quantity * price : 0;

        row.querySelector(".item-subtotal").textContent = subtotal.toFixed(2);
        total += subtotal;
    });

    document.getElementById("orderTotal").textContent = total.toFixed(2);
}

function collectOrderItems() {
    const rows = [...orderItemsBody.querySelectorAll("tr")];

    return rows.map(row => {
        const productId = row.querySelector(".item-product").value;
        const quantity = Number(row.querySelector(".item-quantity").value);
        const unitPrice = Number(row.querySelector(".item-price").value);

        if (!productId || !Number.isFinite(quantity) || quantity <= 0 ||
            !Number.isFinite(unitPrice) || unitPrice <= 0) {
            throw new Error("Select a product and enter a quantity and unit price greater than zero for every item.");
        }

        return {
            productId: Number(productId),
            quantity,
            unitPrice
        };
    });
}

async function updateSalesOrderStatus(orderId, newStatus) {
    if (!newStatus) return;

    const confirmed = confirm(
        `Change this sales order status to ${newStatus}?`
    );

    if (!confirmed) {
        await loadSalesOrders();
        return;
    }

    try {
        const response = await fetch(
            `${API_BASE}/sales-orders/${orderId}/status?status=${encodeURIComponent(newStatus)}`,
            {
                method: "PUT",
                headers: authHeaders()
            }
        );

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(
                errorText || `Status update failed (${response.status}).`
            );
        }

        showMessage(
            messageBox,
            `Sales order status updated to ${newStatus}.`,
            "success"
        );

        await loadSalesOrders();
    } catch (error) {
        console.error("Status update error:", error);
        showMessage(messageBox, error.message, "danger");
        await loadSalesOrders();
    }
}

async function loadSalesOrders() {
    orderTableBody.innerHTML = `
        <tr>
            <td colspan="9" class="text-center">Loading sales orders...</td>
        </tr>
    `;

    try {
        const orders = await apiGet("/sales-orders");

        if (!Array.isArray(orders) || orders.length === 0) {
            orderTableBody.innerHTML = `
                <tr>
                    <td colspan="9" class="text-center">No sales orders found.</td>
                </tr>
            `;
            return;
        }

        // Build all table rows first
        orderTableBody.innerHTML = orders.map(order => {
            const items = Array.isArray(order.items) ? order.items : [];

            const itemSummary = items.map(item =>
                `${escapeHtml(item.productName)} × ${escapeHtml(item.quantity)}`
            ).join("<br>");

            const statusClass =
                order.status === "DELIVERED" ? "bg-success" :
                order.status === "CONFIRMED" ? "bg-primary" :
                order.status === "CANCELLED" ? "bg-danger" :
                "bg-secondary";

            return `
                <tr>
                    <td>${escapeHtml(order.id)}</td>
                    <td>${escapeHtml(order.orderNumber)}</td>
                    <td>${escapeHtml(order.customerName)}</td>
                    <td>${escapeHtml(order.warehouseName)}</td>
                    <td>${escapeHtml(order.orderDate)}</td>
                    <td>${itemSummary || "—"}</td>
                    <td>${Number(order.totalAmount || 0).toFixed(2)}</td>

                    <td>
                        <span class="badge ${statusClass}">
                            ${escapeHtml(order.status)}
                        </span>
                    </td>

                    <td>
                        <select
                            class="form-select form-select-sm status-select"
                            data-order-id="${escapeHtml(order.id)}"
                            aria-label="Change status for order ${escapeHtml(order.orderNumber)}"
                        >
                            ${["DRAFT", "CONFIRMED", "DELIVERED", "CANCELLED"]
                                .map(status => `
                                    <option value="${status}"
                                        ${order.status === status ? "selected" : ""}>
                                        ${status}
                                    </option>
                                `).join("")}
                        </select>
                    </td>
                </tr>
            `;
        }).join("");

        // Attach event listeners AFTER the rows exist
        orderTableBody.querySelectorAll(".status-select").forEach(select => {
            select.addEventListener("change", async () => {
                await updateSalesOrderStatus(
                    select.dataset.orderId,
                    select.value
                );
            });
        });

    } catch (error) {
        console.error("Sales order loading error:", error);

        orderTableBody.innerHTML = `
            <tr>
                <td colspan="9" class="text-center text-danger">
                    ${escapeHtml(error.message)}
                </td>
            </tr>
        `;
    }
}

orderForm.addEventListener("submit", async event => {
    event.preventDefault();
    hideMessage(formMessage);

    let items;

    try {
        items = collectOrderItems();
    } catch (error) {
        showMessage(formMessage, error.message, "danger");
        return;
    }

    const order = {
        orderNumber: document.getElementById("orderNumber").value.trim(),
        customerId: Number(document.getElementById("customerId").value),
        warehouseId: Number(document.getElementById("warehouseId").value),
        orderDate: document.getElementById("orderDate").value,
        status: document.getElementById("status").value,
        items
    };

    if (!order.orderNumber || !order.customerId || !order.warehouseId || !order.orderDate) {
        showMessage(formMessage, "Please complete all required fields.", "danger");
        return;
    }

    const saveButton = document.getElementById("saveOrderBtn");
    saveButton.disabled = true;
    saveButton.textContent = "Saving...";

    try {
        const response = await fetch(`${API_BASE}/sales-orders`, {
            method: "POST",
            headers: authHeaders(),
            body: JSON.stringify(order)
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText || `Could not save sales order (${response.status}).`);
        }

        orderForm.reset();
        orderItemsBody.innerHTML = "";
        addOrderItem();
        document.getElementById("orderDate").value = new Date().toLocaleDateString("en-CA");

        bootstrap.Modal.getOrCreateInstance(
            document.getElementById("salesOrderModal")
        ).hide();

        showMessage(messageBox, "Sales order created successfully.", "success");

        await loadSalesOrders();
    } catch (error) {
        console.error("Sales order creation error:", error);
        showMessage(formMessage, error.message, "danger");
    } finally {
        saveButton.disabled = false;
        saveButton.textContent = "Save Sales Order";
    }
});

document.getElementById("addItemBtn").addEventListener("click", addOrderItem);
document.getElementById("refreshBtn").addEventListener("click", loadSalesOrders);

document.getElementById("salesOrderModal").addEventListener("show.bs.modal", async () => {
    hideMessage(formMessage);
    document.getElementById("orderDate").value = new Date().toLocaleDateString("en-CA");
    await loadDropdowns();
});

document.getElementById("salesOrderModal").addEventListener("hidden.bs.modal", () => {
    hideMessage(formMessage);
});

async function initializeSalesOrders() {
    document.getElementById("orderDate").value = new Date().toLocaleDateString("en-CA");
    await Promise.all([loadDropdowns(), loadSalesOrders()]);
}

initializeSalesOrders();