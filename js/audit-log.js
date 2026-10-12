
const AUDIT_API = API_BASE_URL;

const auditTableBody = document.getElementById("auditLogTableBody");
const auditMessage = document.getElementById("message");
const filterForm = document.getElementById("filterForm");

function auditHeaders() {
    const token = localStorage.getItem("token");
    return {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {})
    };
}

function auditEscape(value) {
    return String(value ?? "").replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[char]);
}

function auditValue(log, ...keys) {
    for (const key of keys) {
        if (log[key] !== undefined && log[key] !== null) {
            return log[key];
        }
    }
    return null;
}

function auditFormatDate(value) {
    if (!value) return "—";

    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleString();
}

function showAuditMessage(message, type = "danger") {
    auditMessage.innerHTML = `
        <div class="alert alert-${type} alert-dismissible fade show" role="alert">
            ${auditEscape(message)}
            <button type="button" class="btn-close"
                    data-bs-dismiss="alert" aria-label="Close"></button>
        </div>`;
}

async function auditRequest(path) {
    const response = await fetch(`${AUDIT_API}${path}`, {
        headers: auditHeaders()
    });

    if (!response.ok) {
        const details = await response.text();
        throw new Error(details || `Request failed (${response.status})`);
    }

    return response.json();
}

function renderAuditLogs(logs) {
    if (!Array.isArray(logs) || logs.length === 0) {
        auditTableBody.innerHTML = `
            <tr><td colspan="7" class="text-center">No audit logs found.</td></tr>`;
        return;
    }

    auditTableBody.innerHTML = logs.map(log => {
        const id = auditValue(log, "id");
        const action = auditValue(log, "action");
        const entityName = auditValue(log, "entityName", "entity");
        const entityId = auditValue(log, "entityId");
        const username = auditValue(log, "username", "userName", "performedBy");
        const details = auditValue(log, "details", "description", "message");
        const timestamp = auditValue(
            log, "timestamp", "createdAt", "createdDate", "dateTime"
        );

        return `
            <tr>
                <td>${auditEscape(id ?? "—")}</td>
                <td>${auditEscape(action ?? "—")}</td>
                <td>${auditEscape(entityName ?? "—")}</td>
                <td>${auditEscape(entityId ?? "—")}</td>
                <td>${auditEscape(
                    typeof username === "object"
                        ? username?.username ?? username?.email ?? "—"
                        : username ?? "—"
                )}</td>
                <td class="text-break">${auditEscape(details ?? "—")}</td>
                <td>${auditEscape(auditFormatDate(timestamp))}</td>
            </tr>`;
    }).join("");
}

async function loadAuditLogs(path = "/audit-logs") {
    auditTableBody.innerHTML = `
        <tr><td colspan="7" class="text-center">Loading audit logs...</td></tr>`;

    auditMessage.innerHTML = "";

    try {
        const logs = await auditRequest(path);
        renderAuditLogs(logs);
    } catch (error) {
        console.error("Audit log loading error:", error);
        auditTableBody.innerHTML = `
            <tr><td colspan="7" class="text-danger text-center">
                ${auditEscape(error.message)}
            </td></tr>`;
        showAuditMessage(
            error.message.includes("403")
                ? "Access denied. Audit logs require the ADMIN role."
                : error.message
        );
    }
}

filterForm.addEventListener("submit", async event => {
    event.preventDefault();

    const entityName = document.getElementById("entityName").value.trim();
    const entityId = document.getElementById("entityId").value.trim();

    if (!entityName && !entityId) {
        await loadAuditLogs();
        return;
    }

    if (!entityName || !entityId) {
        showAuditMessage("Enter both the entity name and entity ID.");
        return;
    }

    await loadAuditLogs(
        `/audit-logs/${encodeURIComponent(entityName)}/${encodeURIComponent(entityId)}`
    );
});

document.getElementById("clearFilter").addEventListener("click", async () => {
    filterForm.reset();
    await loadAuditLogs();
});

document.getElementById("refreshLogs").addEventListener("click", async () => {
    await loadAuditLogs();
});

loadAuditLogs();
