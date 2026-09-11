import {
  products,
  money,
  sanitizeCart,
  cartTotal,
  cartQuantity,
  changeCart,
  filterProducts,
} from "./products.mjs";
const app = document.querySelector("#app");
const escape = (value) =>
  String(value).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
let cart = {};
try {
  cart = sanitizeCart(JSON.parse(localStorage.getItem("aldos-cart-v1")));
} catch {}
let query = "",
  category = "Todas",
  sort = "featured",
  selectedQuantity = 1,
  lastOrder = null,
  lastRequest = null,
  toastTimer;
function persist() {
  try {
    localStorage.setItem("aldos-cart-v1", JSON.stringify(cart));
  } catch {}
  document.querySelector("#cart-count").textContent = cartQuantity(cart);
}
function toast(message) {
  const el = document.querySelector("#toast");
  el.textContent = message;
  el.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove("show"), 3500);
}
function addToCart(id, qty = 1) {
  cart = changeCart(cart, id, (cart[id] || 0) + qty);
  persist();
  toast("Pieza agregada a tu carrito");
  return { items: cartQuantity(cart), total: cartTotal(cart) };
}
function photo(p, cls = "", eager = false) {
  return `<img class="${cls}" src="/assets/${p.image}" alt="${escape(p.name)}" ${eager ? 'fetchpriority="high"' : 'loading="lazy"'} width="400" height="460">${p.image2 ? `<img src="/assets/${p.image2}" alt="Boba Fett incluido en el dúo" loading="lazy" width="400" height="460">` : ""}`;
}
function card(p) {
  return `<article class="product-card"><div class="product-picture"><a class="product-visual ${p.image2 ? "duo" : ""}" href="#/producto/${p.id}" aria-label="Ver ${escape(p.name)}"><span class="product-tag">${p.tag}</span>${photo(p)}</a><button class="card-add" data-add="${p.id}" aria-label="Agregar ${escape(p.name)} al carrito">+</button></div><p class="product-meta">${p.category} / ${p.universe}</p><h3><a href="#/producto/${p.id}">${p.name}</a></h3><div class="product-bottom"><span>${money(p.price)} <small>MXN</small></span><small>${p.stock === 1 ? "Pieza única" : `${p.stock} disponibles`}</small></div></article>`;
}
const icon = (shape) =>
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" aria-hidden="true">${shape}</svg>`;
function home() {
  return `<section class="hero"><div class="hero-copy"><p class="eyebrow">PARA QUIENES SABEN LO QUE BUSCAN</p><h1>Lo ordinario<br>no entra<br><em>en la bóveda.</em></h1><p>Pequeñas piezas. Grandes historias.<br>Encuentra el siguiente tesoro de tu colección.</p><a class="button" href="#/catalogo">Explorar la colección <span>↗</span></a></div><a class="hero-art" href="#/producto/charizard" aria-label="Explorar Charizard Holo de 1999"><span class="pill">UN ÍCONO DESDE 1999</span><img src="/assets/charizard.png" alt="Carta holográfica de Charizard de 1999 encapsulada" fetchpriority="high" width="500" height="500"><div class="hero-label"><div><span>OBJETO DE DESEO / 001</span>Charizard Holo · Base Set</div><b>↗</b></div></a></section><div class="trust-strip"><span>${icon('<path d="m12 3 8 4v5c0 4-4 7-8 9-4-2-8-5-8-9V7l8-4Z"/><path d="m8 12 3 3 5-6"/>')}SELECCIÓN PARA COLECCIONISTAS</span><span>${icon('<path d="M3 5h11v12H3zM14 10h4l3 4v3h-7"/><circle cx="7" cy="18" r="2"/><circle cx="18" cy="18" r="2"/>')}DESDE SAN LUIS POTOSÍ</span><span>${icon('<path d="M4 8h16v13H4zM2 4h20v4H2zM12 4v17"/>')}PIEZAS POR ENCARGO</span></div><section class="collection"><div class="section-head"><div><span class="eyebrow">SELECCIONADAS, NO ACUMULADAS</span><h2>Dentro de la bóveda.</h2></div><a class="text-link" href="#/catalogo">Ver las 10 piezas ↗</a></div><div class="products">${products.slice(0, 4).map(card).join("")}</div></section><section class="custom-banner"><div><p class="eyebrow">LA BÚSQUEDA TAMBIÉN ES PARTE DE LA HISTORIA</p><h2>¿Esa pieza que<br><em>no puedes encontrar?</em></h2></div><div><p>Cuéntanos qué estás buscando. Nuestro servicio por encargo está pensado para conectar tu colección con esa pieza que todavía le falta.</p><a class="button secondary" href="#/encargos">Solicitar una pieza <span>↗</span></a></div></section>`;
}
function breadcrumb(end) {
  return `<div class="breadcrumb"><a href="#/">Inicio</a><span>/</span>${end}</div>`;
}
function catalog() {
  return `<section class="page">${breadcrumb("La colección")}<div class="catalog-top"><div><p class="eyebrow">EL SIGUIENTE CAPÍTULO DE TU COLECCIÓN</p><h1 class="page-title">La colección.</h1><p class="intro">Piezas con historia. Encuentra la que conecta contigo.</p></div><span class="result-count" id="result-count"></span></div><div class="catalog-controls"><label class="visually-hidden" for="search">Buscar piezas</label><input class="search" id="search" type="search" placeholder="Buscar una pieza, personaje, universo…" value="${escape(query)}"><div class="categories" role="group" aria-label="Filtrar por categoría">${["Todas", "LEGO", "Figuras", "TCG", "Memorabilia"].map((c) => `<button class="filter ${c === category ? "active" : ""}" data-category="${c}" aria-pressed="${c === category}">${c}</button>`).join("")}</div><label class="visually-hidden" for="sort">Ordenar productos</label><select id="sort">${[
    ["featured", "Destacados"],
    ["price-asc", "Menor precio"],
    ["price-desc", "Mayor precio"],
    ["name", "Nombre A–Z"],
  ]
    .map(
      ([v, l]) =>
        `<option value="${v}" ${sort === v ? "selected" : ""}>${l}</option>`,
    )
    .join(
      "",
    )}</select></div><div id="catalog-results" class="catalog-results"></div></section>`;
}
function updateResults() {
  const result = filterProducts(query, category, sort);
  document.querySelector("#result-count").textContent =
    `${result.length} ${result.length === 1 ? "pieza" : "piezas"} / Precios en MXN`;
  document.querySelector("#catalog-results").innerHTML = result.length
    ? `<div class="products">${result.map(card).join("")}</div>`
    : `<div class="empty"><h2>Esta pieza aún no está en la bóveda.</h2><p>Prueba con otro nombre o solicita una búsqueda por encargo.</p><button class="button" data-reset>Limpiar filtros</button> <a class="text-link" href="#/encargos">Solicitar una pieza ↗</a></div>`;
}
function detail(id) {
  const p = products.find((p) => p.id === id);
  if (!p) return notFound();
  const remaining = p.stock - (cart[p.id] || 0);
  selectedQuantity = 1;
  return `<section class="page">${breadcrumb(`<a href="#/catalogo">La colección</a><span>/</span>${escape(p.name)}`)}<div class="detail"><div class="detail-image ${p.image2 ? "duo" : ""}"><span class="product-tag">${p.tag}</span>${photo(p, "", true)}</div><div class="detail-copy"><p class="eyebrow">${p.category} / ${p.universe}</p><h1>${p.name}</h1><p class="detail-price">${money(p.price)}<small>MXN</small></p><p class="detail-description">${p.description}</p><p class="stock">${remaining > 0 ? `${remaining} ${remaining === 1 ? "pieza disponible" : "piezas disponibles"} para agregar` : "Ya tienes todas las piezas disponibles en tu carrito"}</p><div class="buy-row"><div class="quantity"><button data-detail-step="-1" aria-label="Reducir cantidad" disabled>−</button><output id="detail-quantity" aria-live="polite">1</output><button data-detail-step="1" data-max="${remaining}" aria-label="Aumentar cantidad" ${remaining <= 1 ? "disabled" : ""}>+</button></div><button class="button" data-detail-add="${p.id}" ${remaining === 0 ? "disabled" : ""}>Agregar al carrito <span>+</span></button></div><p class="note">Catálogo de demostración. Sin cobros ni disponibilidad comercial real.</p><dl class="specs"><div><dt>Edición</dt><dd>${p.edition}</dd></div><div><dt>Presentación</dt><dd>${p.condition}</dd></div><div><dt>Origen de la tienda</dt><dd>San Luis Potosí, México</dd></div></dl></div></div><div class="related"><h2>Más historias para tu vitrina.</h2><div class="products">${products
    .filter((x) => x.id !== id)
    .sort((a, b) => (b.category === p.category) - (a.category === p.category))
    .slice(0, 4)
    .map(card)
    .join("")}</div></div></section>`;
}
function cartPage() {
  const entries = products.filter((p) => cart[p.id]);
  if (!entries.length)
    return `<section class="page">${breadcrumb("Carrito")}<div class="empty"><p class="eyebrow">TODO GRAN COLECCIONISTA EMPIEZA CON UNA PIEZA</p><h1 class="page-title">Tu bóveda empieza aquí.</h1><p>Tu carrito está vacío. La siguiente historia te espera en la colección.</p><a class="button" href="#/catalogo">Explorar la colección <span>↗</span></a></div></section>`;
  return `<section class="page">${breadcrumb("Carrito")}<p class="eyebrow">UN PASO MÁS CERCA DE TU COLECCIÓN</p><h1 class="page-title">Tu selección.</h1><div class="cart-layout"><div>${entries.map((p) => `<article class="cart-item"><a href="#/producto/${p.id}"><img src="/assets/${p.image}" alt="${escape(p.name)}" width="100" height="120"></a><div><p class="product-meta">${p.category}</p><h2><a href="#/producto/${p.id}">${p.name}</a></h2><div class="quantity" style="width:fit-content"><button data-cart-step="-1" data-id="${p.id}" aria-label="Reducir cantidad de ${escape(p.name)}" ${cart[p.id] === 1 ? "disabled" : ""}>−</button><output aria-label="Cantidad">${cart[p.id]}</output><button data-cart-step="1" data-id="${p.id}" aria-label="Aumentar cantidad de ${escape(p.name)}" ${cart[p.id] >= p.stock ? "disabled" : ""}>+</button></div></div><div class="cart-item-end"><strong>${money(p.price * cart[p.id])}</strong><br><button class="remove" data-remove="${p.id}" aria-label="Eliminar ${escape(p.name)} del carrito">Eliminar</button></div></article>`).join("")}<a class="text-link" href="#/catalogo">← Seguir explorando</a></div><aside class="summary"><h2>Resumen de tu selección</h2><div class="summary-line"><span>${cartQuantity(cart)} piezas</span><span>${money(cartTotal(cart))}</span></div><div class="summary-line"><span>Envío</span><span>No incluido</span></div><div class="summary-line summary-total"><span>Subtotal</span><strong>${money(cartTotal(cart))}</strong></div><p class="note">Importes en MXN. El envío se cotizaría antes de una compra real.</p><button class="button" data-checkout>Simular pedido <span>↗</span></button><p class="note">Este prototipo no procesa pagos ni realiza pedidos reales. Tu carrito se guarda únicamente en este navegador.</p></aside></div></section>`;
}
function requests() {
  return `<section class="page">${breadcrumb("Piezas por encargo")}<div class="request-layout"><div class="request-copy"><p class="eyebrow">SI EXISTE, LA BÚSQUEDA EMPIEZA AQUÍ</p><h1 class="page-title">Tu próxima pieza.<br><em>Por encontrar.</em></h1><p class="intro">Hay piezas que merecen una búsqueda especial. Cuéntanos cuál falta en tu colección.</p><div class="steps"><div class="step"><span>01</span><div><h3>Cuéntanos qué buscas</h3><p>Personaje, edición, condición y presupuesto. Cada detalle ayuda.</p></div></div><div class="step"><span>02</span><div><h3>Revisa una propuesta</h3><p>El servicio contempla una cotización con precio, comisión y envío antes de aceptar.</p></div></div><div class="step"><span>03</span><div><h3>Decide si es tu pieza</h3><p>En la operación futura, la búsqueda se concretaría con tu aprobación de la cotización.</p></div></div></div></div><form class="request-form" id="request-form"><h2 style="font-size:23px;font-weight:500">La pieza que tienes en mente</h2><p class="form-disclaimer">Prueba el flujo con datos ficticios. Esta solicitud no se envía a la tienda y solo se conserva durante esta sesión de la página.</p><div class="field-row"><div class="field"><label for="name">Tu nombre</label><input id="name" name="name" required maxlength="80" autocomplete="off" placeholder="Tu nombre"></div><div class="field"><label for="email">Correo electrónico</label><input id="email" name="email" type="email" required maxlength="120" autocomplete="off" placeholder="coleccionista@ejemplo.com"></div></div><div class="field"><label for="piece">¿Qué pieza estás buscando?</label><input id="piece" name="piece" required maxlength="160" placeholder="Ej. Minifigura de Darth Revan"></div><div class="field-row"><div class="field"><label for="request-category">Categoría</label><select id="request-category" name="category" required><option value="">Selecciona una categoría</option><option>LEGO</option><option>Figuras</option><option>TCG</option><option>Memorabilia</option><option>Otra</option></select></div><div class="field"><label for="budget">Presupuesto máximo (MXN)</label><input id="budget" name="budget" type="number" min="1" max="1000000" step="1" required placeholder="5000"></div></div><div class="field"><label for="details">Detalles adicionales (opcional)</label><textarea id="details" name="details" maxlength="1500" placeholder="Edición, año, estado deseado o accesorios…"></textarea></div><button class="button" type="submit">Crear solicitud de prueba <span>↗</span></button></form></div></section>`;
}
function requestSuccess() {
  if (!lastRequest) return requests();
  return `<section class="page"><div class="success"><div class="success-mark">✓</div><p class="eyebrow">SOLICITUD DE DEMOSTRACIÓN</p><h1>La búsqueda tiene<br>un punto de partida.</h1><p>Creaste una solicitud de prueba para <strong>${escape(lastRequest.piece)}</strong>, con un presupuesto de <strong>${money(lastRequest.budget)} MXN</strong>.</p><p>No se envió ningún correo ni se inició una búsqueda real. Los datos se eliminarán al recargar o cerrar esta página.</p><a class="button" href="#/catalogo">Volver a la colección <span>↗</span></a></div></section>`;
}
function orderSuccess() {
  if (!lastOrder) return cartPage();
  return `<section class="page"><div class="success"><div class="success-mark">✓</div><p class="eyebrow">RECORRIDO COMPLETADO</p><h1>Una gran selección.<br>Una buena historia.</h1><p>Simulaste un pedido de <strong>${lastOrder.count} ${lastOrder.count === 1 ? "pieza" : "piezas"}</strong> por <strong>${money(lastOrder.total)} MXN</strong>, sin envío.</p><p>No se realizó ningún cargo ni se reservó inventario. Tu carrito se ha vaciado para que puedas probar otro recorrido.</p><a class="button" href="#/catalogo">Seguir explorando <span>↗</span></a></div></section>`;
}
function notFound() {
  return `<section class="page"><div class="empty"><h1 class="page-title">Esta página no está en la bóveda.</h1><p>Regresa a la colección para encontrar una pieza.</p><a class="button" href="#/catalogo">Ver la colección ↗</a></div></section>`;
}
function render(resetScroll = true) {
  const route = location.hash.slice(1) || "/";
  let html, title;
  if (route === "/") {
    html = home();
    title = "Objetos extraordinarios";
  } else if (route === "/catalogo") {
    html = catalog();
    title = "La colección";
  } else if (route.startsWith("/producto/")) {
    const id = route.split("/")[2];
    html = detail(id);
    title = products.find((p) => p.id === id)?.name || "Pieza no encontrada";
  } else if (route === "/carrito") {
    html = cartPage();
    title = "Tu carrito";
  } else if (route === "/encargos") {
    html = requests();
    title = "Piezas por encargo";
  } else if (route === "/solicitud-creada") {
    html = requestSuccess();
    title = "Solicitud de prueba";
  } else if (route === "/pedido-demo") {
    html = orderSuccess();
    title = "Pedido de demostración";
  } else {
    html = notFound();
    title = "Página no encontrada";
  }
  app.innerHTML = html;
  app.classList.remove("route-enter");
  void app.offsetWidth;
  app.classList.add("route-enter");
  document.title = `${title} — Aldo’s Vault`;
  document.querySelectorAll("nav a").forEach((a) => {
    const active = a.hash === location.hash;
    a.classList.toggle("active", active);
    if (active) a.setAttribute("aria-current", "page");
    else a.removeAttribute("aria-current");
  });
  if (route === "/catalogo") updateResults();
  persist();
  if (resetScroll) {
    window.scrollTo(0, 0);
    const heading = app.querySelector("h1");
    if (heading) {
      heading.tabIndex = -1;
      heading.focus({ preventScroll: true });
      heading.style.outline = "none";
    }
  }
}
app.addEventListener("input", (event) => {
  if (event.target.id === "search") {
    query = event.target.value;
    updateResults();
  }
});
app.addEventListener("change", (event) => {
  if (event.target.id === "sort") {
    sort = event.target.value;
    updateResults();
  }
});
app.addEventListener("click", (event) => {
  const button = event.target.closest("button");
  if (!button) return;
  try {
    if (button.dataset.add) {
      addToCart(button.dataset.add);
      if (location.hash.startsWith("#/producto/")) render(false);
    } else if (button.dataset.category) {
      category = button.dataset.category;
      document.querySelectorAll("[data-category]").forEach((b) => {
        b.classList.toggle("active", b.dataset.category === category);
        b.setAttribute("aria-pressed", String(b.dataset.category === category));
      });
      updateResults();
    } else if (button.hasAttribute("data-reset")) {
      query = "";
      category = "Todas";
      sort = "featured";
      render(false);
    } else if (button.dataset.detailStep) {
      const max = Number(app.querySelector("[data-max]").dataset.max);
      selectedQuantity = Math.max(
        1,
        Math.min(max, selectedQuantity + Number(button.dataset.detailStep)),
      );
      app.querySelector("#detail-quantity").textContent = selectedQuantity;
      app.querySelector('[data-detail-step="-1"]').disabled =
        selectedQuantity <= 1;
      app.querySelector('[data-detail-step="1"]').disabled =
        selectedQuantity >= max;
    } else if (button.dataset.detailAdd) {
      addToCart(button.dataset.detailAdd, selectedQuantity);
      render(false);
    } else if (button.dataset.cartStep) {
      const id = button.dataset.id;
      cart = changeCart(cart, id, cart[id] + Number(button.dataset.cartStep));
      render(false);
    } else if (button.dataset.remove) {
      cart = changeCart(cart, button.dataset.remove, 0);
      render(false);
      toast("Pieza eliminada del carrito");
    } else if (button.hasAttribute("data-checkout")) {
      if (!cartQuantity(cart)) return;
      lastOrder = { count: cartQuantity(cart), total: cartTotal(cart) };
      cart = {};
      persist();
      location.hash = "/pedido-demo";
    }
  } catch (error) {
    toast(error.message);
  }
});
app.addEventListener("submit", (event) => {
  if (event.target.id !== "request-form") return;
  event.preventDefault();
  if (!event.target.reportValidity()) return;
  const data = new FormData(event.target);
  const name = String(data.get("name")).trim(),
    piece = String(data.get("piece")).trim(),
    budget = Number(data.get("budget"));
  if (
    !name ||
    !piece ||
    !Number.isInteger(budget) ||
    budget < 1 ||
    budget > 1000000
  ) {
    toast("Revisa el nombre, la pieza y el presupuesto.");
    return;
  }
  lastRequest = { piece, budget };
  event.target.reset();
  location.hash = "/solicitud-creada";
});
window.addEventListener("hashchange", () => render());
window.addEventListener("storage", (event) => {
  if (event.key === "aldos-cart-v1") {
    try {
      cart = sanitizeCart(JSON.parse(event.newValue));
    } catch {
      cart = {};
    }
    render(false);
  }
});
render(false);
if (document.modelContext?.registerTool) {
  const lifecycle = new AbortController();
  const tools = [
    {
      name: "search_vault_products",
      title: "Buscar piezas de Aldo’s Vault",
      description:
        "Consulta el catálogo de demostración por nombre o universo.",
      inputSchema: {
        type: "object",
        properties: { query: { type: "string" } },
        required: ["query"],
        additionalProperties: false,
      },
      annotations: { readOnlyHint: true, untrustedContentHint: false },
      execute(input) {
        if (typeof input?.query !== "string")
          throw new Error("query debe ser texto");
        return filterProducts(input.query).map(
          ({ id, name, price, stock }) => ({
            id,
            name,
            price,
            currency: "MXN",
            stock,
          }),
        );
      },
    },
    {
      name: "add_vault_product_to_cart",
      title: "Agregar pieza al carrito",
      description:
        "Agrega una pieza al carrito local de demostración. No realiza una compra.",
      inputSchema: {
        type: "object",
        properties: {
          productId: { type: "string" },
          quantity: { type: "integer", minimum: 1 },
        },
        required: ["productId", "quantity"],
        additionalProperties: false,
      },
      annotations: { readOnlyHint: false, untrustedContentHint: false },
      execute(input) {
        if (
          typeof input?.productId !== "string" ||
          !Number.isInteger(input.quantity) ||
          input.quantity < 1
        )
          throw new Error("Producto y cantidad inválidos");
        const result = addToCart(input.productId, input.quantity);
        render(false);
        return result;
      },
    },
  ];
  for (const tool of tools) {
    try {
      Promise.resolve(
        document.modelContext.registerTool(tool, { signal: lifecycle.signal }),
      ).catch(() => {});
    } catch {}
  }
  window.addEventListener("pagehide", () => lifecycle.abort(), { once: true });
}
