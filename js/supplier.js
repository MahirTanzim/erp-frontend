
const supplierToken = localStorage.getItem("token");

if (!supplierToken) {
    window.location.href = "index.html";
}

function showSupplierError(message, elementId = "supplierError") {
    const element = document.getElementById(elementId);
    element.textContent = message;
    element.classList.remove("d-none");
}

async function loadSuppliers() {
    const tableBody = document.getElementById("supplierTableBody");
    const errorBox = document.getElementById("supplierError");

    errorBox.classList.add("d-none");
    tableBody.innerHTML = "";

    try {
        const response = await fetch(API_BASE_URL + "/suppliers", {
            headers: {
                "Authorization": "Bearer " + supplierToken
            }
        });

        if (!response.ok) {
            throw new Error("Failed to load suppliers (HTTP " + response.status + ")");
        }

        const suppliers = await response.json();

        if (!Array.isArray(suppliers)) {
            throw new Error("Unexpected supplier response from server.");
        }

        if (suppliers.length === 0) {
            tableBody.innerHTML =
                '<tr><td colspan="7" class="text-center">No suppliers found.</td></tr>';
            return;
        }

        suppliers.forEach(supplier => {
            const row = document.createElement("tr");

            [
                supplier.id,
                supplier.supplierCode,
                supplier.name,
                supplier.contactPerson,
                supplier.email,
                supplier.phone,
                supplier.address
            ].forEach(value => {
                const cell = document.createElement("td");
                cell.textContent = value ?? "";
                row.appendChild(cell);
            });

            tableBody.appendChild(row);
        });
    } catch (error) {
        console.error("Supplier loading error:", error);
        showSupplierError(error.message);
    }
}

async function addSupplier() {
    const formError = document.getElementById("supplierFormError");
    formError.classList.add("d-none");

    const supplier = {
        supplierCode: document.getElementById("supplierCode").value.trim(),
        name: document.getElementById("supplierName").value.trim(),
        contactPerson: document.getElementById("contactPerson").value.trim(),
        email: document.getElementById("supplierEmail").value.trim(),
        phone: document.getElementById("supplierPhone").value.trim(),
        address: document.getElementById("supplierAddress").value.trim()
    };

    if (!supplier.supplierCode || !supplier.name) {
        showSupplierError("Supplier code and name are required.", "supplierFormError");
        return;
    }

    try {
        const response = await fetch(API_BASE_URL + "/suppliers", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + supplierToken
            },
            body: JSON.stringify(supplier)
        });

        if (!response.ok) {
            let message = "Failed to add supplier (HTTP " + response.status + ")";

            try {
                const result = await response.json();
                message = result.message || message;
                if (result.errors) {
                    message += ": " + Object.values(result.errors).join(", ");
                }
            } catch (_) { }

            throw new Error(message);
        }

        document.getElementById("supplierForm").reset();

        bootstrap.Modal.getOrCreateInstance(
            document.getElementById("supplierModal")
        ).hide();

        await loadSuppliers();
    } catch (error) {
        console.error("Supplier save error:", error);
        showSupplierError(error.message, "supplierFormError");
    }
}

function logout() {
    localStorage.removeItem("token");
    window.location.href = "index.html";
}

loadSuppliers();

