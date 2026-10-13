
const INVOICE_API = API_BASE_URL;

const invoiceForm = document.getElementById("invoiceForm");
const invoiceTableBody = document.getElementById("invoiceTableBody");
const salesOrderSelect = document.getElementById("salesOrderId");
const messageBox = document.getElementById("message");
const formMessage = document.getElementById("formMessage");
let displayedInvoices = [];

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
        <tr><td colspan="9" class="text-center">Loading invoices...</td></tr>`;

    try {
        const invoices = await invoiceGet("/invoices");

        if (!Array.isArray(invoices) || invoices.length === 0) {
            displayedInvoices = [];
            invoiceTableBody.innerHTML = `
                <tr><td colspan="9" class="text-center">No invoices found.</td></tr>`;
            return;
        }

        displayedInvoices = invoices;
        invoiceTableBody.innerHTML = invoices.map((invoice, index) => {
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
                    <td>
                        <button type="button"
                                class="btn btn-sm btn-outline-primary"
                                data-invoice-index="${index}"
                                aria-label="Download PDF for invoice ${invoiceEscape(invoice.invoiceNumber)}">
                            Download PDF
                        </button>
                    </td>
                </tr>`;
        }).join("");
    } catch (error) {
        console.error("Invoice loading error:", error);
        displayedInvoices = [];
        invoiceTableBody.innerHTML = `
            <tr><td colspan="9" class="text-danger text-center">
                ${invoiceEscape(error.message)}
            </td></tr>`;
    }
}

function downloadInvoicePdf(invoice) {
    const JsPDF = window.jspdf && window.jspdf.jsPDF;
    if (!JsPDF) {
        const error = new Error("PDF download is unavailable. Please reload the page and try again.");
        console.error("Invoice PDF generation error:", error);
        invoiceShowMessage(messageBox, error.message, "danger");
        return;
    }

    const pdf = new JsPDF();
    const pageWidth = pdf.internal.pageSize.getWidth();
    const margin = 20;
    const invoiceNumber = String(invoice.invoiceNumber || invoice.id || "invoice");
    const totalAmount = Number(invoice.totalAmount);

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(22);
    pdf.setTextColor(31, 54, 88);
    pdf.text("INVOICE", margin, 28);

    pdf.setFontSize(10);
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(100, 112, 130);
    pdf.text("Mini ERP", margin, 36);
    pdf.text(`Invoice No: ${invoiceNumber}`, margin, 52);
    pdf.text(`Sales Order: ${String(invoice.salesOrderNumber || "—")}`, margin, 60);
    pdf.text(`Customer: ${String(invoice.customerName || "—")}`, margin, 68);
    pdf.text(`Invoice Date: ${String(invoice.invoiceDate || "—")}`, margin, 76);
    pdf.text(`Due Date: ${String(invoice.dueDate || "—")}`, margin, 84);

    pdf.setDrawColor(220, 226, 235);
    pdf.line(margin, 94, pageWidth - margin, 94);

    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(60, 72, 90);
    pdf.text("Status", margin, 106);
    pdf.text("Total Amount", pageWidth - margin, 106, { align: "right" });

    pdf.setFont("helvetica", "normal");
    pdf.text(String(invoice.status || "—"), margin, 115);
    pdf.text(
        Number.isFinite(totalAmount) ? totalAmount.toFixed(2) : "0.00",
        pageWidth - margin,
        115,
        { align: "right" }
    );

    pdf.setFontSize(9);
    pdf.setTextColor(130, 140, 153);
    pdf.text("Generated by Mini ERP", margin, 280);

    const safeInvoiceNumber = invoiceNumber
        .replace(/[<>:"/\\|?*\u0000-\u001F]/g, "-")
        .replace(/\s+/g, "-");
    pdf.save(`invoice-${safeInvoiceNumber}.pdf`);
}

invoiceTableBody.addEventListener("click", event => {
    const button = event.target.closest("[data-invoice-index]");
    if (!button) return;

    const invoice = displayedInvoices[Number(button.dataset.invoiceIndex)];
    if (invoice) {
        downloadInvoicePdf(invoice);
    }
});

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
