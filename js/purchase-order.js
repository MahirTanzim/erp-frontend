
const poToken = localStorage.getItem("token");

if (!poToken) {
    window.location.href = "index.html";
}

const poHeaders = {
    "Authorization": "Bearer " + poToken
};

let poProducts = [];

function showPOError(message, elementId = "poError") {
    const element = document.getElementById(elementId);
    element.textContent = message;
    element.classList.remove("d-none");
}

async function fetchPOData(path) {
    const response = await fetch(API_BASE_URL + path, {
        headers: poHeaders
    });

    if (!response.ok) {
        throw new Error("Request failed for " + path + " (HTTP " + response.status + ")");
    }

    return response.json();
}

async function loadPOOptions() {
    try {
        const [suppliers, warehouses, products] = await Promise.all([
            fetchPOData("/suppliers"),
            fetchPOData("/warehouses"),
            fetchPOData("/products")
        ]);

        poProducts = products;

        const supplierSelect = document.getElementById("supplierId");
        supplierSelect.innerHTML = '<option value="">Select supplier</option>';

        suppliers.forEach(supplier => {
            const option = document.createElement("option");
            option.value = supplier.id;
            option.textContent = supplier.name;
            supplierSelect.appendChild(option);
        });

        const warehouseSelect = document.getElementById("warehouseId");
        warehouseSelect.innerHTML = '<option value="">Select warehouse</option>';

        warehouses.forEach(warehouse => {
            const option = document.createElement("option");
            option.value = warehouse.id;
            option.textContent = warehouse.name;
            warehouseSelect.appendChild(option);
        });

        if (poProducts.length === 0 || suppliers.length === 0 || warehouses.length === 0) {
            showPOError("Add at least one product, supplier, and warehouse before creating an order.", "poFormError");
        }
    } catch (error) {
        console.error("Purchase order options error:", error);
        showPOError(error.message, "poFormError");
    }
}

function addPOItem() {
    if (poProducts.length === 0) {
        showPOError("No products are available. Create a product first.", "poFormError");
        return;
    }

    const row = document.createElement("tr");

    const productCell = document.createElement("td");
    const productSelect = document.createElement("select");
    productSelect.className = "form-select po-product";
    productSelect.required = true;
    productSelect.innerHTML = '<option value="">Select product</option>';

    poProducts.forEach(product => {
        const option = document.createElement("option");
        option.value = product.id;
        option.textContent = product.name;
        productSelect.appendChild(option);
    });

    productCell.appendChild(productSelect);

    const quantityCell = document.createElement("td");
    const quantityInput = document.createElement("input");
    quantityInput.type = "number";
    quantityInput.className = "form-control po-quantity";
    quantityInput.min = "0.01";
    quantityInput.step = "any";
    quantityInput.placeholder = "Quantity";
    quantityInput.required = true;
    quantityCell.appendChild(quantityInput);

    const priceCell = document.createElement("td");
    const priceInput = document.createElement("input");
    priceInput.type = "number";
    priceInput.className = "form-control po-price";
    priceInput.min = "0";
    priceInput.step = "any";
    priceInput.placeholder = "Unit price";
    priceInput.required = true;
    priceCell.appendChild(priceInput);

    const actionCell = document.createElement("td");
    const removeButton = document.createElement("button");
    removeButton.type = "button";
    removeButton.className = "btn btn-outline-danger btn-sm";
    removeButton.textContent = "Remove";
    removeButton.onclick = () => row.remove();
    actionCell.appendChild(removeButton);

    row.append(productCell, quantityCell, priceCell, actionCell);
    document.getElementById("poItemsBody").appendChild(row);
}

async function loadPurchaseOrders() {
    const tableBody = document.getElementById("poTableBody");
    const errorBox = document.getElementById("poError");

    errorBox.classList.add("d-none");
    tableBody.innerHTML = "";

    try {
        const orders = await fetchPOData("/purchase-orders");

        if (!Array.isArray(orders)) {
            throw new Error("Unexpected purchase order response.");
        }

        if (orders.length === 0) {
            tableBody.innerHTML =
                '<tr><td colspan="9" class="text-center">No purchase orders found.</td></tr>';
            return;
        }

        orders.forEach(order => {
            const row = document.createElement("tr");

            const values = [
                order.id,
                order.orderNumber,
                order.supplierName,
                order.warehouseName,
                order.orderDate,
                order.totalAmount,
                order.status
            ];

            values.forEach((value, index) => {
                const cell = document.createElement("td");
                cell.textContent = index === 5 && value != null
                    ? "৳" + Number(value).toLocaleString("en-BD")
                    : (value ?? "");
                row.appendChild(cell);
            });

            const itemsCell = document.createElement("td");
            const detailsButton = document.createElement("button");
            detailsButton.className = "btn btn-sm btn-outline-primary";
            detailsButton.textContent = "View";
            detailsButton.onclick = () => showPOItems(order);
            itemsCell.appendChild(detailsButton);
            row.appendChild(itemsCell);

            const statusCell = document.createElement("td");
            const statusSelect = document.createElement("select");
            statusSelect.className = "form-select form-select-sm";
            ["DRAFT", "ORDERED", "RECEIVED", "CANCELLED"].forEach(status => {
                const option = document.createElement("option");
                option.value = status;
                option.textContent = status;
                statusSelect.appendChild(option);
            });
            statusSelect.value = order.status;
            statusSelect.onchange = () => updatePOStatus(order.id, statusSelect.value);
            statusCell.appendChild(statusSelect);
            row.appendChild(statusCell);

            tableBody.appendChild(row);
        });
    } catch (error) {
        console.error("Purchase order loading error:", error);
        showPOError(error.message);
    }
}

function showPOItems(order) {
    const items = order.items || [];

    const details = items.map(item =>
        `${item.productName}: ${item.quantity} × ৳${item.unitPrice} = ৳${item.totalPrice}`
    ).join("\n");

    alert(
        "Purchase Order: " + order.orderNumber + "\n\n" +
        (details || "No items listed.")
    );
}

async function createPurchaseOrder() {
    const errorBox = document.getElementById("poFormError");
    errorBox.classList.add("d-none");

    const orderNumber = document.getElementById("orderNumber").value.trim();
    const supplierId = document.getElementById("supplierId").value;
    const warehouseId = document.getElementById("warehouseId").value;
    const orderDate = document.getElementById("orderDate").value;
    const status = document.getElementById("poStatus").value;

    const rows = [...document.querySelectorAll("#poItemsBody tr")];

    if (!orderNumber || !supplierId || !warehouseId || !orderDate || rows.length === 0) {
        showPOError("Fill in the order details and add at least one product.", "poFormError");
        return;
    }

    const items = [];

    for (const row of rows) {
        const productId = row.querySelector(".po-product").value;
        const quantity = Number(row.querySelector(".po-quantity").value);
        const unitPrice = Number(row.querySelector(".po-price").value);

        if (!productId || !Number.isFinite(quantity) || quantity <= 0 ||
            !Number.isFinite(unitPrice) || unitPrice < 0) {
            showPOError("Choose a product and enter a valid quantity and unit price for every row.", "poFormError");
            return;
        }

        items.push({
            productId: Number(productId),
            quantity,
            unitPrice
        });
    }

    const payload = {
        orderNumber,
        supplierId: Number(supplierId),
        warehouseId: Number(warehouseId),
        orderDate,
        status,
        items
    };

    try {
        const response = await fetch(API_BASE_URL + "/purchase-orders", {
            method: "POST",
            headers: {
                ...poHeaders,
                "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            let message = "Could not create purchase order (HTTP " + response.status + ")";
            try {
                const result = await response.json();
                message = result.message || message;
                if (result.errors) {
                    message += ": " + Object.values(result.errors).join(", ");
                }
            } catch (_) {}
            throw new Error(message);
        }

        document.getElementById("orderNumber").value = "";
        document.getElementById("orderDate").value = "";
        document.getElementById("supplierId").value = "";
        document.getElementById("warehouseId").value = "";
        document.getElementById("poStatus").value = "DRAFT";
        document.getElementById("poItemsBody").innerHTML = "";

        bootstrap.Modal.getOrCreateInstance(
            document.getElementById("poModal")
        ).hide();

        await loadPurchaseOrders();
    } catch (error) {
        console.error("Purchase order save error:", error);
        showPOError(error.message, "poFormError");
    }
}

async function updatePOStatus(id, status) {
    if (!confirm("Change this purchase order status to " + status + "?")) {
        await loadPurchaseOrders();
        return;
    }

    try {
        const response = await fetch(
            API_BASE_URL + "/purchase-orders/" + id + "/status?status=" +
            encodeURIComponent(status),
            {
                method: "PUT",
                headers: poHeaders
            }
        );

        if (!response.ok) {
            let message = "Could not update status (HTTP " + response.status + ")";
            try {
                const result = await response.json();
                message = result.message || message;
            } catch (_) {}
            throw new Error(message);
        }

        await loadPurchaseOrders();
    } catch (error) {
        console.error("Purchase order status error:", error);
        showPOError(error.message);
        await loadPurchaseOrders();
    }
}

function logout() {
    localStorage.removeItem("token");
    window.location.href = "index.html";
}

document.getElementById("poModal").addEventListener("show.bs.modal", async () => {
    document.getElementById("poFormError").classList.add("d-none");
    await loadPOOptions();

    if (document.querySelectorAll("#poItemsBody tr").length === 0) {
        addPOItem();
    }

    if (!document.getElementById("orderDate").value) {
        document.getElementById("orderDate").value =
            new Date().toLocaleDateString("en-CA");
    }
});

loadPurchaseOrders();
