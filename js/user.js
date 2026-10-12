const USER_API = API_BASE_URL;

const userForm = document.getElementById("userForm");
const userTableBody = document.getElementById("userTableBody");
const userMessage = document.getElementById("message");
const userFormMessage = document.getElementById("formMessage");
const userModalElement = document.getElementById("userModal");

let editingUserId = null;

function userHeaders() {
    const token = localStorage.getItem("token");

    return {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {})
    };
}

function userEscape(value) {
    return String(value ?? "").replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[char]);
}

function showUserMessage(element, message, type = "success") {
    element.innerHTML = `
        <div class="alert alert-${type} alert-dismissible fade show" role="alert">
            ${userEscape(message)}
            <button type="button" class="btn-close"
                    data-bs-dismiss="alert" aria-label="Close"></button>
        </div>`;
}

async function userRequest(path, options = {}) {
    const response = await fetch(`${USER_API}${path}`, {
        ...options,
        headers: {
            ...userHeaders(),
            ...(options.headers || {})
        }
    });

    if (!response.ok) {
        const details = await response.text();
        throw new Error(details || `Request failed (${response.status})`);
    }

    if (response.status === 204) return null;

    const contentType = response.headers.get("content-type") || "";
    return contentType.includes("application/json")
        ? response.json()
        : null;
}

async function loadUsers() {
    userTableBody.innerHTML = `
        <tr><td colspan="6" class="text-center">Loading users...</td></tr>`;

    try {
        const users = await userRequest("/users");

        if (!Array.isArray(users) || users.length === 0) {
            userTableBody.innerHTML = `
                <tr><td colspan="6" class="text-center">No users found.</td></tr>`;
            return;
        }

        userTableBody.innerHTML = users.map(user => `
            <tr>
                <td>${userEscape(user.id)}</td>
                <td>${userEscape(user.username)}</td>
                <td>${userEscape(user.email)}</td>
                <td><span class="badge bg-secondary">${userEscape(user.role)}</span></td>
                <td>${user.employeeId == null ? "—" : userEscape(user.employeeId)}</td>
                <td>
                    <button class="btn btn-sm btn-outline-primary me-1"
                            onclick="editUser(${Number(user.id)})">Edit</button>
                    <button class="btn btn-sm btn-outline-danger"
                            onclick="deleteUser(${Number(user.id)}, '${userEscape(user.username).replace(/'/g, "\\'")}')">
                        Delete
                    </button>
                </td>
            </tr>
        `).join("");
    } catch (error) {
        console.error("User loading error:", error);
        userTableBody.innerHTML = `
            <tr><td colspan="6" class="text-danger text-center">
                ${userEscape(error.message)}
            </td></tr>`;
    }
}

function prepareCreateUser() {
    editingUserId = null;
    userForm.reset();
    document.getElementById("userId").value = "";
    document.getElementById("password").required = true;
    document.getElementById("passwordHelp").textContent =
        "Required when creating a user.";
    document.getElementById("userModalLabel").textContent = "Create User";
    document.getElementById("saveUserButton").textContent = "Create User";
    userFormMessage.innerHTML = "";
}

async function editUser(id) {
    try {
        const user = await userRequest(`/users/${id}`);

        editingUserId = id;
        userForm.reset();

        document.getElementById("userId").value = user.id;
        document.getElementById("username").value = user.username || "";
        document.getElementById("email").value = user.email || "";
        document.getElementById("role").value =
            String(user.role || "").replace(/^ROLE_/, "");

        document.getElementById("employeeId").value =
            user.employee?.id ?? user.employeeId ?? "";

        document.getElementById("password").value = "";
        document.getElementById("password").required = false;
        document.getElementById("passwordHelp").textContent =
            "Leave blank to keep the existing password.";
        document.getElementById("userModalLabel").textContent = "Edit User";
        document.getElementById("saveUserButton").textContent = "Save Changes";
        userFormMessage.innerHTML = "";

        bootstrap.Modal.getOrCreateInstance(userModalElement).show();
    } catch (error) {
        console.error("User loading error:", error);
        showUserMessage(userMessage, error.message, "danger");
    }
}

userForm.addEventListener("submit", async event => {
    event.preventDefault();
    userFormMessage.innerHTML = "";

    const password = document.getElementById("password").value;

    const payload = {
        username: document.getElementById("username").value.trim(),
        email: document.getElementById("email").value.trim(),
        role: document.getElementById("role").value,
        employee: document.getElementById("employeeId").value
            ? { id: Number(document.getElementById("employeeId").value) }
            : null
    };

    if (password) {
        payload.password = password;
    } else if (!editingUserId) {
        showUserMessage(userFormMessage, "Password is required.", "danger");
        return;
    }

    try {
        await userRequest(
            editingUserId ? `/users/${editingUserId}` : "/users",
            {
                method: editingUserId ? "PUT" : "POST",
                body: JSON.stringify(payload)
            }
        );

        bootstrap.Modal.getOrCreateInstance(userModalElement).hide();
        showUserMessage(
            userMessage,
            editingUserId ? "User updated successfully." : "User created successfully."
        );

        await loadUsers();
    } catch (error) {
        console.error("User save error:", error);
        showUserMessage(userFormMessage, error.message, "danger");
    }
});

async function deleteUser(id, username) {
    if (!confirm(`Delete user "${username}"? This action cannot be undone.`)) {
        return;
    }

    try {
        await userRequest(`/users/${id}`, { method: "DELETE" });
        showUserMessage(userMessage, "User deleted successfully.");
        await loadUsers();
    } catch (error) {
        console.error("User deletion error:", error);
        showUserMessage(userMessage, error.message, "danger");
    }
}

userModalElement.addEventListener("hidden.bs.modal", () => {
    userForm.reset();
    editingUserId = null;
});

loadUsers();
