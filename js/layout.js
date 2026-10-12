(function () {
    const body = document.body;

    if (body.classList.contains("erp-layout")) {
        return;
    }

    const dashboardLink = Array.from(
        document.querySelectorAll('a[href="dashboard.html"]')
    ).find(link => link.closest("ul.nav"));
    const content = document.querySelector("main, .flex-grow-1");

    if (!dashboardLink || !content) {
        return;
    }

    const nav = dashboardLink.closest("ul.nav");
    let common = content;

    while (common && !common.contains(nav)) {
        common = common.parentElement;
    }

    if (!common || common === body) {
        return;
    }

    function directChild(parent, descendant) {
        let child = descendant;
        while (child && child.parentElement !== parent) {
            child = child.parentElement;
        }
        return child;
    }

    const sidebarBranch = directChild(common, nav);
    const contentBranch = directChild(common, content);

    if (!sidebarBranch || !contentBranch || sidebarBranch === contentBranch) {
        return;
    }

    const pageTitle = contentBranch.querySelector("h1, h2, h3");
    const title = pageTitle ? pageTitle.textContent.trim() : document.title;
    const currentPage = window.location.pathname.split("/").pop() || "dashboard.html";
    const iconByPage = {
        "dashboard.html": "▦",
        "employees.html": "♙",
        "departments.html": "▤",
        "products.html": "◈",
        "inventory.html": "▣",
        "warehouses.html": "⌂",
        "suppliers.html": "⇄",
        "purchase-orders.html": "▧",
        "customers.html": "♧",
        "sales-orders.html": "▤",
        "invoices.html": "▨",
        "payment.html": "＄",
        "users.html": "♟",
        "audit-logs.html": "◷"
    };

    function makeElement(tag, className, text) {
        const element = document.createElement(tag);
        if (className) element.className = className;
        if (text) element.textContent = text;
        return element;
    }

    const sidebar = makeElement(
        "aside",
        "sidebar offcanvas-md offcanvas-start"
    );
    sidebar.id = "sidebar";
    sidebar.tabIndex = -1;
    sidebar.setAttribute("aria-labelledby", "sidebarLabel");

    const mobileHeader = makeElement("div", "offcanvas-header sidebar-header");
    const mobileBrand = makeElement("a", "brand");
    mobileBrand.href = "dashboard.html";
    mobileBrand.id = "sidebarLabel";
    mobileBrand.append(
        makeElement("span", "brand-mark", "E"),
        makeElement("span", "", "Mini ERP")
    );
    mobileHeader.appendChild(mobileBrand);

    const closeButton = makeElement("button", "btn-close btn-close-white d-md-none");
    closeButton.type = "button";
    closeButton.setAttribute("data-bs-dismiss", "offcanvas");
    closeButton.setAttribute("aria-label", "Close navigation");
    mobileHeader.appendChild(closeButton);

    const sidebarBody = makeElement("div", "offcanvas-body sidebar-body");
    const desktopBrand = mobileBrand.cloneNode(true);
    desktopBrand.removeAttribute("id");
    desktopBrand.classList.add("d-none", "d-md-flex");
    sidebarBody.appendChild(desktopBrand);
    sidebarBody.appendChild(makeElement("div", "sidebar-label", "WORKSPACE"));

    const sidebarNav = makeElement("nav", "nav flex-column sidebar-nav");
    sidebarNav.setAttribute("aria-label", "Main navigation");

    nav.querySelectorAll("a[href]").forEach(link => {
        const item = makeElement("a", "nav-link");
        item.href = link.getAttribute("href");
        const label = link.textContent.trim().replace(/\s+/g, " ");
        item.appendChild(
            makeElement("span", "nav-icon", iconByPage[item.getAttribute("href")] || "•")
        );
        item.appendChild(document.createTextNode(label));

        if (item.getAttribute("href") === currentPage) {
            item.classList.add("active");
            item.setAttribute("aria-current", "page");
        }

        sidebarNav.appendChild(item);
    });

    const sidebarBottom = makeElement("div", "sidebar-bottom");
    sidebarBottom.appendChild(makeElement("div", "sidebar-divider"));
    const sidebarLogout = makeElement("button", "btn sidebar-logout");
    sidebarLogout.type = "button";
    sidebarLogout.append(
        makeElement("span", "nav-icon", "↪"),
        document.createTextNode("Sign out")
    );
    sidebarLogout.addEventListener("click", signOut);
    sidebarBottom.appendChild(sidebarLogout);

    sidebarBody.append(sidebarNav, sidebarBottom);
    sidebar.append(mobileHeader, sidebarBody);

    const shell = makeElement("div", "erp-main");
    const topbar = makeElement("header", "topbar");
    const topbarLeft = makeElement("div", "d-flex align-items-center gap-3");
    const menuButton = makeElement("button", "btn menu-toggle d-md-none");
    menuButton.type = "button";
    menuButton.setAttribute("data-bs-toggle", "offcanvas");
    menuButton.setAttribute("data-bs-target", "#sidebar");
    menuButton.setAttribute("aria-controls", "sidebar");
    menuButton.setAttribute("aria-label", "Open navigation");
    for (let i = 0; i < 3; i++) {
        menuButton.appendChild(makeElement("span"));
    }

    const titleBlock = document.createElement("div");
    titleBlock.append(
        makeElement("div", "topbar-eyebrow", "MINI ERP / WORKSPACE"),
        makeElement("h1", "topbar-title", title)
    );
    topbarLeft.append(menuButton, titleBlock);

    const topbarActions = makeElement("div", "topbar-actions");
    const status = makeElement("span", "status-pill");
    status.append(
        makeElement("span", "status-dot"),
        document.createTextNode("Workspace")
    );
    topbarActions.appendChild(status);
    const topbarLogout = makeElement(
        "button",
        "btn btn-sm btn-outline-secondary d-none d-sm-inline-flex",
        "Sign out"
    );
    topbarLogout.type = "button";
    topbarLogout.addEventListener("click", signOut);
    topbarActions.appendChild(topbarLogout);
    topbar.append(topbarLeft, topbarActions);

    const pageContent = makeElement("div", "page-content");
    Array.from(contentBranch.childNodes).forEach(child => {
        if (child.nodeType === Node.ELEMENT_NODE &&
            child.matches("nav.navbar, .navbar")) {
            child.remove();
            return;
        }
        if (child.nodeType === Node.ELEMENT_NODE) {
            child.classList.remove("p-4");
        }
        pageContent.appendChild(child);
    });

    const footer = makeElement("footer", "page-footer");
    footer.append(
        makeElement("span", "", "© 2026 Mini ERP"),
        makeElement("span", "", "Business operations workspace")
    );

    shell.append(topbar, pageContent, footer);
    sidebarBranch.replaceWith(sidebar);
    contentBranch.replaceWith(shell);
    common.className = "erp-layout";
    body.classList.add("erp-page");

    function signOut() {
        if (typeof window.logout === "function") {
            window.logout();
            return;
        }
        localStorage.removeItem("token");
        window.location.href = "index.html";
    }
})();
