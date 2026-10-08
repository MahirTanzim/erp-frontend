const token = localStorage.getItem("token");

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

    console.log("Dashboard data:", data);

    document.getElementById("dashboardData").innerHTML = `
        <div class="row">

            <div class="col-md-3 mb-3">
                <div class="card p-3">
                    <h5>Employees</h5>
                    <h2>${data.totalEmployees}</h2>
                </div>
            </div>

            <div class="col-md-3 mb-3">
                <div class="card p-3">
                    <h5>Products</h5>
                    <h2>${data.totalProducts}</h2>
                </div>
            </div>
            
            <div class="col-md-3 mb-3">
                <div class="card p-3">
                    <h5>Customers</h5>
                    <h2>${data.totalCustomers}</h2>
                </div>
            </div>

            <div class="col-md-3 mb-3">
                <div class="card p-3">
                    <h5>Warehouses</h5>
                    <h2>${data.totalWarehouses}</h2>
                </div>
            </div>

        </div>
    `;

})
.catch(error => {

    console.error(error);

});