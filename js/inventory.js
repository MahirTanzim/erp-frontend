
const inventoryToken = localStorage.getItem("token");

if (!inventoryToken) {
    window.location.href = "index.html";
}

const inventoryHeaders = {
    "Authorization": "Bearer " + inventoryToken
};

function showInventoryError(message, elementId = "inventoryError") {
    const element = document.getElementById(elementId);
    element.textContent = message;
    element.classList.remove("d-none");
}

async function loadInventory() {
    const tableBody = document.getElementById("inventoryTableBody");
    const errorBox = document.getElementById("inventoryError");

    errorBox.classList.add("d-none");
    tableBody.innerHTML = "";

    try {
        const response = await fetch(API_BASE_URL + "/inventory", {
            headers: inventoryHeaders
        });

        if (!response.ok) {
            throw new Error("Could not load inventory (HTTP " + response.status + ")");
        }

        const items = await response.json();

        if (!Array.isArray(items)) {
            throw new Error("Unexpected inventory response from server.");
        }

        if (items.length === 0) {
            tableBody.innerHTML =
                '<tr><td colspan="4" class="text-center">No inventory records found.</td></tr>';
            return;
        }

        items.forEach(item => {
            const row = document.createElement("tr");

            [
                item.id,
                item.productName ?? "",
                item.warehouseName ?? "",
                item.quantity ?? 0
            ].forEach(value => {
                const cell = document.createElement("td");
                cell.textContent = value;
                row.appendChild(cell);
            });

            tableBody.appendChild(row);
        });
    } catch (error) {
        console.error("Inventory loading error:", error);
        showInventoryError(error.message);
    }
}

async function loadProductOptions() {
    const select = document.getElementById("productId");

    try {
        const response = await fetch(API_BASE_URL + "/products", {
            headers: inventoryHeaders
        });

        if (!response.ok) {
            throw new Error("Could not load products (HTTP " + response.status + ")");
        }

        const products = await response.json();
        select.innerHTML = '<option value="">Select a product</option>';

        products.forEach(product => {
            const option = document.createElement("option");
            option.value = product.id;
            option.textContent = product.name;
            select.appendChild(option);
        });
    } catch (error) {
        console.error(error);
        select.innerHTML = '<option value="">Failed to load products</option>';
        showInventoryError(error.message, "formError");
    }
}

async function loadWarehouseOptions() {
    const select = document.getElementById("warehouseId");

    try {
        const response = await fetch(API_BASE_URL + "/warehouses", {
            headers: inventoryHeaders
        });
        if (!response.ok) {
            throw new Error("Could not load warehouses (HTTP " + response.status + ")");
        }
        const warehouses = await response.json();
        select.innerHTML = '<option value="">Select a warehouse</option>';
        warehouses.forEach(warehouse => {
            const option = document.createElement("option");
            option.value = warehouse.id;
            option.textContent =
                warehouse.name + " (" + warehouse.warehouseCode + ")";
            select.appendChild(option);
        });
    } catch (error) {
        console.error(error);
        select.innerHTML = '<option value="">Failed to load warehouses</option>';
        showInventoryError(error.message, "formError");
    }
}

async function addInventory() {
    const formError = document.getElementById("formError");
    formError.classList.add("d-none");

    const productId = document.getElementById("productId").value;
    const warehouseId = document.getElementById("warehouseId").value;
    const quantity = Number(document.getElementById("quantity").value);

    if (!productId || !warehouseId || !Number.isFinite(quantity) || quantity <= 0) {
        showInventoryError(
            "Select a product and warehouse, and enter a quantity greater than zero.",
            "formError"
        );
        return;
    }

    try {
        const response = await fetch(API_BASE_URL + "/inventory", {
            method: "POST",
            headers: {
                ...inventoryHeaders,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                productId: Number(productId),
                warehouseId: Number(warehouseId),
                quantity: quantity
            })
        });

        if (!response.ok) {
            let message = "Could not save inventory (HTTP " + response.status + ")";

            try {
                const result = await response.json();
                message = result.message || message;
            } catch (_) { }

            throw new Error(message);
        }

        document.getElementById("quantity").value = "";

        bootstrap.Modal.getOrCreateInstance(
            document.getElementById("addInventoryModal")
        ).hide();

        await loadInventory();
    } catch (error) {
        console.error("Inventory save error:", error);
        showInventoryError(error.message, "formError");
    }
}

function logout() {
    localStorage.removeItem("token");
    window.location.href = "index.html";
}

loadInventory();
loadProductOptions();
loadWarehouseOptions();
