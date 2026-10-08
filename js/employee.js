const token = localStorage.getItem("token");

if (!token) {
    window.location.href = "index.html";
}

fetch(API_BASE_URL + "/employees", {

    headers: {
        "Authorization": "Bearer " + token
    }

})
.then(response => {

    if (!response.ok) {
        throw new Error("Failed to load employees");
    }

    return response.json();

})
.then(employees => {

    const tableBody =
        document.getElementById("employeeTableBody");

    tableBody.innerHTML = "";

    employees.forEach(employee => {

        const row = `
            <tr>

                <td>${employee.id}</td>

                <td>${employee.employeeCode}</td>

                <td>${employee.name}</td>

                <td>${employee.email ?? ""}</td>

                <td>${employee.phone ?? ""}</td>

                <td>${employee.departmentName ?? ""}</td>

                <td>${employee.designation}</td>

                <td>${employee.joiningDate}</td>

            </tr>
        `;

        tableBody.innerHTML += row;

    });

})
.catch(error => {

    console.error(error);

    document.getElementById("employeeTableBody").innerHTML = `
        <tr>
            <td colspan="8"
                class="text-center text-danger">
                Failed to load employees
            </td>
        </tr>
    `;

});


function logout() {

    localStorage.removeItem("token");

    window.location.href = "index.html";
}

document.getElementById("addEmployeeForm")
    .addEventListener("submit", function (event) {

        event.preventDefault();

        const employee = {
            employeeCode: document.getElementById("employeeCode").value,
            name: document.getElementById("name").value,
            email: document.getElementById("email").value,
            phone: document.getElementById("phone").value,
            departmentId: Number(
                document.getElementById("departmentId").value
            ),
            designation: document.getElementById("designation").value,
            joiningDate: document.getElementById("joiningDate").value
        };

        fetch(API_BASE_URL + "/employees", {

            method: "POST",

            headers: {
                "Authorization": "Bearer " + token,
                "Content-Type": "application/json"
            },

            body: JSON.stringify(employee)

        })
        .then(response => {

            if (!response.ok) {
                throw new Error("Failed to create employee");
            }

            return response.json();

        })
        .then(data => {

            console.log("Employee created:", data);

            location.reload();

        })
        .catch(error => {

            console.error(error);

            document.getElementById("employeeError").textContent =
                "Failed to create employee";
        });

    });