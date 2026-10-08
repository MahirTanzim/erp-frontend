const token = localStorage.getItem("token");

if (!token) {
    window.location.href = "index.html";
}

fetch(API_BASE_URL + "/dashboard/summary", {

    headers: {
        "Authorization": "Bearer " + token
    }

})
.then(response => {

    if (!response.ok) {
        throw new Error("Failed to load dashboard");
    }

    return response.json();

})
.then(data => {

    document.getElementById("totalEmployees").textContent =
        data.totalEmployees;

    document.getElementById("totalProducts").textContent =
        data.totalProducts;

    document.getElementById("totalCustomers").textContent =
        data.totalCustomers;

    document.getElementById("totalSuppliers").textContent =
        data.totalSuppliers;

    document.getElementById("totalWarehouses").textContent =
        data.totalWarehouses;

    document.getElementById("totalPurchaseOrders").textContent =
        data.totalPurchaseOrders;

    document.getElementById("totalSalesOrders").textContent =
        data.totalSalesOrders;

    document.getElementById("totalInvoices").textContent =
        data.totalInvoices;

    document.getElementById("totalSales").textContent =
        "৳" + data.totalSales;

    document.getElementById("totalPurchases").textContent =
        "৳" + data.totalPurchases;

    document.getElementById("totalOutstanding").textContent =
        "৳" + data.totalOutstanding;

})
.catch(error => {

    console.error(error);

});

function logout() {

    localStorage.removeItem("token");

    window.location.href = "index.html";
}