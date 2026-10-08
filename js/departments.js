const token = localStorage.getItem("token");

if (!token) {
    window.location.href = "index.html";
}


/* =========================
   LOAD DEPARTMENTS
========================= */

function loadDepartments() {

    fetch(API_BASE_URL + "/departments", {

        headers: {
            "Authorization": "Bearer " + token
        }

    })
    .then(response => {

        if (!response.ok) {
            throw new Error("Failed to load departments");
        }

        return response.json();

    })
    .then(departments => {

        const tableBody =
            document.getElementById("departmentTableBody");

        tableBody.innerHTML = "";

        departments.forEach(department => {

            const row = `
                <tr>

                    <td>${department.id}</td>

                    <td>${department.name}</td>

                    <td>${department.description ?? ""}</td>

                    <td>

                        <button
                            class="btn btn-sm btn-danger"
                            onclick="deleteDepartment(${department.id})">

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
            "departmentTableBody"
        ).innerHTML = `

            <tr>

                <td colspan="4"
                    class="text-center text-danger">

                    Failed to load departments

                </td>

            </tr>

        `;

    });
}


loadDepartments();


/* =========================
   ADD DEPARTMENT
========================= */

document
    .getElementById("addDepartmentForm")
    .addEventListener("submit", function(event) {

        event.preventDefault();

        const department = {

            name:
                document.getElementById(
                    "departmentName"
                ).value,

            description:
                document.getElementById(
                    "departmentDescription"
                ).value

        };


        fetch(API_BASE_URL + "/departments", {

            method: "POST",

            headers: {

                "Authorization":
                    "Bearer " + token,

                "Content-Type":
                    "application/json"

            },

            body: JSON.stringify(department)

        })
        .then(response => {

            if (!response.ok) {

                return response.json()
                    .then(error => {

                        throw new Error(
                            error.message ||
                            "Failed to create department"
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
                "departmentError"
            ).textContent = error.message;

        });

    });


/* =========================
   DELETE DEPARTMENT
========================= */

function deleteDepartment(id) {

    if (!confirm(
        "Are you sure you want to delete this department?"
    )) {
        return;
    }


    fetch(
        API_BASE_URL + "/departments/" + id,
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
                "Failed to delete department"
            );
        }

        location.reload();

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