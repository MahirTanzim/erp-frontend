
const PAYMENT_API = "http://localhost:8080/api";

const paymentForm = document.getElementById("paymentForm");
const paymentTableBody = document.getElementById("paymentTableBody");
const invoiceSelect = document.getElementById("invoiceId");
const messageBox = document.getElementById("message");
const formMessage = document.getElementById("formMessage");

function paymentHeaders() {
    const token = localStorage.getItem("token");

    return {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {})
    };
}

function paymentEscape(value) {
    return String(value ?? "").replace(/[&<>"']/g, character => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[character]);
}

function paymentMessage(element, message, type = "success") {
    element.innerHTML = `
        <div class="alert alert-${type} alert-dismissible fade show" role="alert">
            ${paymentEscape(message)}
            <button type="button" class="btn-close"
                    data-bs-dismiss="alert" aria-label="Close"></button>
        </div>
    `;
}

async function paymentGet(path) {
    const response = await fetch(`${PAYMENT_API}${path}`, {
        headers: paymentHeaders()
    });

    if (!response.ok) {
        const details = await response.text();
        throw new Error(details || `Request failed (${response.status})`);
    }

    return response.json();
}

async function loadInvoices() {
    const invoices = await paymentGet("/invoices");

    invoiceSelect.innerHTML = `
        <option value="">Select invoice</option>
        ${invoices.map(invoice => `
            <option value="${paymentEscape(invoice.id)}">
                ${paymentEscape(invoice.invoiceNumber)}
                — ${paymentEscape(invoice.customerName || "")}
                — Total: ${paymentEscape(invoice.totalAmount)}
                — ${paymentEscape(invoice.status)}
            </option>
        `).join("")}
    `;
}

async function loadPayments() {
    paymentTableBody.innerHTML = `
        <tr><td colspan="6" class="text-center">Loading payments...</td></tr>
    `;

    try {
        const payments = await paymentGet("/payments");

        if (!Array.isArray(payments) || payments.length === 0) {
            paymentTableBody.innerHTML = `
                <tr><td colspan="6" class="text-center">No payments found.</td></tr>
            `;
            return;
        }

        paymentTableBody.innerHTML = payments.map(payment => `
            <tr>
                <td>${paymentEscape(payment.id)}</td>
                <td>${paymentEscape(payment.invoiceNumber)}</td>
                <td>${Number(payment.amount || 0).toFixed(2)}</td>
                <td>${paymentEscape(payment.method)}</td>
                <td>${paymentEscape(payment.paymentDate)}</td>
                <td>${paymentEscape(payment.reference || "—")}</td>
            </tr>
        `).join("");
    } catch (error) {
        console.error("Payment loading error:", error);
        paymentTableBody.innerHTML = `
            <tr>
                <td colspan="6" class="text-danger text-center">
                    ${paymentEscape(error.message)}
                </td>
            </tr>
        `;
    }
}

paymentForm.addEventListener("submit", async event => {
    event.preventDefault();
    formMessage.innerHTML = "";

    const payload = {
        invoiceId: Number(invoiceSelect.value),
        amount: Number(document.getElementById("amount").value),
        method: document.getElementById("method").value,
        paymentDate: document.getElementById("paymentDate").value,
        reference: document.getElementById("reference").value.trim() || null
    };

    try {
        const response = await fetch(`${PAYMENT_API}/payments`, {
            method: "POST",
            headers: paymentHeaders(),
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const details = await response.text();
            throw new Error(details || `Payment creation failed (${response.status})`);
        }

        paymentForm.reset();
        document.getElementById("paymentDate").value =
            new Date().toLocaleDateString("en-CA");

        bootstrap.Modal.getOrCreateInstance(
            document.getElementById("paymentModal")
        ).hide();

        paymentMessage(messageBox, "Payment recorded successfully.");
        await loadPayments();
        await loadInvoices();
    } catch (error) {
        console.error("Payment creation error:", error);
        paymentMessage(formMessage, error.message, "danger");
    }
});

document.getElementById("paymentModal").addEventListener("show.bs.modal", () => {
    formMessage.innerHTML = "";
});

document.getElementById("paymentDate").value =
    new Date().toLocaleDateString("en-CA");

(async function initializePayments() {
    try {
        await loadInvoices();
        await loadPayments();
    } catch (error) {
        console.error("Payment page initialization error:", error);
        paymentMessage(messageBox, error.message, "danger");
    }
})();

