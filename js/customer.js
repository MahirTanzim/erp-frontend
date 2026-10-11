
const API_URL = "http://localhost:8080/api/customers";

const customerForm = document.getElementById("customerForm");
const customerTableBody = document.getElementById("customerTableBody");
const messageBox = document.getElementById("message");
const refreshBtn = document.getElementById("refreshBtn");

function getAuthHeaders() {
    const token = localStorage.getItem("token");

    return {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {})
    };
}

function showMessage(message, type = "success") {
    messageBox.textContent = message;
    messageBox.className = `alert alert-${type}`;
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

async function loadCustomers() {
    customerTableBody.innerHTML = `
        <tr>
            <td colspan="6" class="text-center">Loading customers...</td>
        </tr>
    `;

    try {
        const response = await fetch(API_URL, {
            method: "GET",
            headers: getAuthHeaders()
        });

        if (!response.ok) {
            throw new Error(
                response.status === 401 || response.status === 403
                    ? `Access denied (${response.status}). Check your login and permissions.`
                    : `Could not load customers (${response.status}).`
            );
        }

        const customers = await response.json();

        if (!Array.isArray(customers) || customers.length === 0) {
            customerTableBody.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center">No customers found.</td>
                </tr>
            `;
            return;
        }

        customerTableBody.innerHTML = customers.map(customer => `
            <tr>
                <td>${escapeHtml(customer.id)}</td>
                <td>${escapeHtml(customer.customerCode)}</td>
                <td>${escapeHtml(customer.name)}</td>
                <td>${escapeHtml(customer.email)}</td>
                <td>${escapeHtml(customer.phone)}</td>
                <td>${escapeHtml(customer.address)}</td>
            </tr>
        `).join("");

    } catch (error) {
        console.error("Customer loading error:", error);

        customerTableBody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center text-danger">
                    ${escapeHtml(error.message)}
                </td>
            </tr>
        `;
    }
}

customerForm.addEventListener("submit", async event => {
    event.preventDefault();

    const customer = {
        customerCode: document.getElementById("customerCode").value.trim(),
        name: document.getElementById("name").value.trim(),
        email: document.getElementById("email").value.trim(),
        phone: document.getElementById("phone").value.trim(),
        address: document.getElementById("address").value.trim()
    };

    if (!customer.customerCode || !customer.name) {
        showMessage("Customer code and name are required.", "danger");
        return;
    }

    try {
        const response = await fetch(API_URL, {
            method: "POST",
            headers: getAuthHeaders(),
            body: JSON.stringify(customer)
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(
                errorText || `Could not create customer (${response.status}).`
            );
        }

        customerForm.reset();

        const modalElement = document.getElementById("customerModal");
        const modal = bootstrap.Modal.getInstance(modalElement);

        if (modal) {
            modal.hide();
        }

        showMessage("Customer added successfully.", "success");
        await loadCustomers();

    } catch (error) {
        console.error("Customer creation error:", error);
        showMessage(error.message, "danger");
    }
});

refreshBtn.addEventListener("click", loadCustomers);

loadCustomers();