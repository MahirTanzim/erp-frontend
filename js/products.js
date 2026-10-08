const token = localStorage.getItem("token");

if (!token) {
    window.location.href = "index.html";
}


/* =========================
   LOAD PRODUCTS
========================= */

function loadProducts() {

    fetch(API_BASE_URL + "/products", {

        headers: {
            "Authorization": "Bearer " + token
        }

    })
    .then(response => {

        if (!response.ok) {
            throw new Error("Failed to load products");
        }

        return response.json();

    })
    .then(products => {

        const tableBody =
            document.getElementById("productTableBody");

        tableBody.innerHTML = "";

        products.forEach(product => {

            const row = `
                <tr>

                    <td>${product.id}</td>

                    <td>${product.sku ?? ""}</td>

                    <td>${product.name ?? ""}</td>

                    <td>${product.description ?? ""}</td>

                    <td>${product.category ?? ""}</td>

                    <td>৳${product.unitPrice ?? 0}</td>

                    <td>

                        <button
                            class="btn btn-sm btn-danger"
                            onclick="deleteProduct(${product.id})">

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

        document.getElementById(
            "productTableBody"
        ).innerHTML = `

            <tr>

                <td colspan="7"
                    class="text-center text-danger">

                    Failed to load products

                </td>

            </tr>

        `;

    });
}


loadProducts();


/* =========================
   ADD PRODUCT
========================= */

document
    .getElementById("addProductForm")
    .addEventListener("submit", function(event) {

        event.preventDefault();

        const product = {

            sku:
                document.getElementById("sku").value,

            name:
                document.getElementById("productName").value,

            description:
                document.getElementById(
                    "productDescription"
                ).value,

            category:
                document.getElementById("category").value,

            unitPrice:
                Number(
                    document.getElementById(
                        "unitPrice"
                    ).value
                )

        };


        fetch(API_BASE_URL + "/products", {

            method: "POST",

            headers: {

                "Authorization":
                    "Bearer " + token,

                "Content-Type":
                    "application/json"

            },

            body: JSON.stringify(product)

        })
        .then(response => {

            if (!response.ok) {

                return response.json()
                    .then(error => {

                        throw new Error(
                            error.message ||
                            "Failed to create product"
                        );

                    });

            }

            return response.json();

        })
        .then(() => {

            location.reload();

        })
        .catch(error => {

            console.error(error);

            document.getElementById(
                "productError"
            ).textContent = error.message;

        });

    });


/* =========================
   DELETE PRODUCT
========================= */

function deleteProduct(id) {

    if (!confirm(
        "Are you sure you want to delete this product?"
    )) {
        return;
    }


    fetch(
        API_BASE_URL + "/products/" + id,
        {
            method: "DELETE",

            headers: {
                "Authorization":
                    "Bearer " + token
            }
        }
    )
    .then(response => {

        if (!response.ok) {
            throw new Error(
                "Failed to delete product"
            );
        }

        location.reload();

    })
    .catch(error => {

        console.error(error);

        alert(error.message);

    });
}


/* =========================
   LOGOUT
========================= */

function logout() {

    localStorage.removeItem("token");

    window.location.href = "index.html";

}