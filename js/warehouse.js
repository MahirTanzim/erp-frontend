const token = localStorage.getItem("token");

if (!token) {
    window.location.href = "index.html";
}

function loadWarehouses() {

    fetch(API_BASE_URL + "/warehouses", {
        headers: {
            "Authorization": "Bearer " + token
        }
    })
    .then(response => {

        if (!response.ok) {
            throw new Error("Failed to load warehouses");
        }

        return response.json();
    })
    .then(data => {

        const tableBody =
            document.getElementById("warehouseTableBody");

        tableBody.innerHTML = "";

        data.forEach(warehouse => {

            const row = `
                <tr>
                    <td>${warehouse.id}</td>
                    <td>${warehouse.warehouseCode}</td>
                    <td>${warehouse.name}</td>
                    <td>${warehouse.location}</td>
                    <td>${warehouse.description || ""}</td>

                    <td>
                        <button
                            class="btn btn-sm btn-danger"
                            onclick="deleteWarehouse(${warehouse.id})">
                            Delete
                        </button>
                    </td>
                </tr>
            `;

            tableBody.innerHTML += row;
        });
    })
    .catch(error => {
        console.error(error);
    });
}


function addWarehouse() {

    const warehouse = {

        warehouseCode:
            document.getElementById("warehouseCode").value,

        name:
            document.getElementById("warehouseName").value,

        location:
            document.getElementById("warehouseLocation").value,

        description:
            document.getElementById("warehouseDescription").value
    };


    fetch(API_BASE_URL + "/warehouses", {

        method: "POST",

        headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer " + token
        },

        body: JSON.stringify(warehouse)
    })
    .then(response => {

        if (!response.ok) {
            return response.json().then(error => {
                throw new Error(
                    error.message || "Failed to add warehouse"
                );
            });
        }

        return response.json();
    })
    .then(() => {

        document.getElementById("warehouseCode").value = "";
        document.getElementById("warehouseName").value = "";
        document.getElementById("warehouseLocation").value = "";
        document.getElementById("warehouseDescription").value = "";

        const modal =
            bootstrap.Modal.getInstance(
                document.getElementById("addWarehouseModal")
            );

        modal.hide();

        loadWarehouses();
    })
    .catch(error => {

        console.error(error);

        alert(error.message);
    });
}


function deleteWarehouse(id) {

    if (!confirm("Are you sure you want to delete this warehouse?")) {
        return;
    }

    fetch(API_BASE_URL + "/warehouses/" + id, {

        method: "DELETE",

        headers: {
            "Authorization": "Bearer " + token
        }
    })
    .then(response => {

        if (!response.ok) {
            throw new Error("Failed to delete warehouse");
        }

        loadWarehouses();
    })
    .catch(error => {

        console.error(error);

        alert(error.message);
    });
}


function logout() {

    localStorage.removeItem("token");

    window.location.href = "index.html";
}


loadWarehouses();