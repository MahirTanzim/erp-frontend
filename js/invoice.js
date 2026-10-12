
const INVOICE_API = API_BASE_URL;

const invoiceForm = document.getElementById("invoiceForm");
const invoiceTableBody = document.getElementById("invoiceTableBody");
const salesOrderSelect = document.getElementById("salesOrderId");
const messageBox = document.getElementById("message");
const formMessage = document.getElementById("formMessage");

function invoiceHeaders() {
    const token = localStorage.getItem("token");
    return {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {})
    };
}

function invoiceEscape(value) {
    return String(value ?? "").replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[char]);
}

function invoiceShowMessage(element, message, type = "success") {
    element.innerHTML = `
        <div class="alert alert-${type} alert-dismissible fade show" role="alert">
            ${invoiceEscape(message)}
            <button type="button" class="btn-close"
                    data-bs-dismiss="alert" aria-label="Close"></button>
        </div>`;
}

async function invoiceGet(path) {
    const response = await fetch(`${INVOICE_API}${path}`, {
        headers: invoiceHeaders()
    });

    if (!response.ok) {
        const details = await response.text();
        throw new Error(details || `Request failed (${response.status})`);
    }

    return response.json();
}

async function loadSalesOrders() {
    const orders = await invoiceGet("/sales-orders");

    salesOrderSelect.innerHTML = `
        <option value="">Select sales order</option>
        ${orders.map(order => `
            <option value="${invoiceEscape(order.id)}">
                ${invoiceEscape(order.orderNumber)} —
                ${invoiceEscape(order.customerName || "")} —
                ${invoiceEscape(order.status)}
            </option>
        `).join("")}
    `;
}

async function loadInvoices() {
    invoiceTableBody.innerHTML = `
        <tr><td colspan="8" class="text-center">Loading invoices...</td></tr>`;

    try {
        const invoices = await invoiceGet("/invoices");

        if (!Array.isArray(invoices) || invoices.length === 0) {
            invoiceTableBody.innerHTML = `
                <tr><td colspan="8" class="text-center">No invoices found.</td></tr>`;
            return;
        }

        invoiceTableBody.innerHTML = invoices.map(invoice => {
            const statusClass =
                invoice.status === "PAID" ? "bg-success" :
                invoice.status === "PARTIALLY_PAID" ? "bg-warning text-dark" :
                invoice.status === "OVERDUE" ? "bg-danger" :
                "bg-secondary";

            return `
                <tr>
                    <td>${invoiceEscape(invoice.id)}</td>
                    <td>${invoiceEscape(invoice.invoiceNumber)}</td>
                    <td>${invoiceEscape(invoice.salesOrderNumber)}</td>
                    <td>${invoiceEscape(invoice.customerName)}</td>
                    <td>${invoiceEscape(invoice.invoiceDate)}</td>
                    <td>${invoiceEscape(invoice.dueDate || "—")}</td>
                    <td>${Number(invoice.totalAmount || 0).toFixed(2)}</td>
                    <td>
                        <span class="badge ${statusClass}">
                            ${invoiceEscape(invoice.status)}
                        </span>
                    </td>
                </tr>`;
        }).join("");
    } catch (error) {
        console.error("Invoice loading error:", error);
        invoiceTableBody.innerHTML = `
            <tr><td colspan="8" class="text-danger text-center">
                ${invoiceEscape(error.message)}
            </td></tr>`;
    }
}

invoiceForm.addEventListener("submit", async event => {
    event.preventDefault();
    formMessage.innerHTML = "";

    const dueDate = document.getElementById("dueDate").value;

    const payload = {
        invoiceNumber: document.getElementById("invoiceNumber").value.trim(),
        salesOrderId: Number(salesOrderSelect.value),
        invoiceDate: document.getElementById("invoiceDate").value,
        dueDate: dueDate || null
    };

    try {
        const response = await fetch(`${INVOICE_API}/invoices`, {
            method: "POST",
            headers: invoiceHeaders(),
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const details = await response.text();
            throw new Error(details || `Invoice creation failed (${response.status})`);
        }

        invoiceForm.reset();
        document.getElementById("invoiceDate").value =
            new Date().toLocaleDateString("en-CA");

        bootstrap.Modal.getOrCreateInstance(
            document.getElementById("invoiceModal")
        ).hide();

        invoiceShowMessage(messageBox, "Invoice created successfully.");
        await loadInvoices();
    } catch (error) {
        console.error("Invoice creation error:", error);
        invoiceShowMessage(formMessage, error.message, "danger");
    }
});

document.getElementById("invoiceModal").addEventListener("show.bs.modal", () => {
    formMessage.innerHTML = "";
});

document.getElementById("invoiceDate").value =
    new Date().toLocaleDateString("en-CA");

(async function initializeInvoices() {
    try {
        await loadSalesOrders();
        await loadInvoices();
    } catch (error) {
        console.error("Invoice page initialization error:", error);
        invoiceShowMessage(messageBox, error.message, "danger");
    }
})();
