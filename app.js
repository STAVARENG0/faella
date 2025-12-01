
(function () {
  const PRODUCTS_KEY = 'products';
  const CART_KEY = 'cart';

  const body = document.body;
  const currentCategory = (body.dataset.category || 'all').toLowerCase();

  function loadProducts() {
    try {
      const raw = localStorage.getItem(PRODUCTS_KEY);
      if (!raw) return [];
      const data = JSON.parse(raw);
      if (!Array.isArray(data)) return [];
      const products = data.slice();

      products.sort((a, b) => {
        const aDate = a && a.createdAt ? new Date(a.createdAt) : null;
        const bDate = b && b.createdAt ? new Date(b.createdAt) : null;
        if (aDate && bDate && !isNaN(aDate) && !isNaN(bDate)) {
          return bDate - aDate; // newer first
        }
        return 0;
      });

      return products;
    } catch (e) {
      console.error('Erro ao carregar produtos:', e);
      return [];
    }
  }

  function loadCart() {
    try {
      const raw = localStorage.getItem(CART_KEY);
      if (!raw) return [];
      const data = JSON.parse(raw);
      return Array.isArray(data) ? data : [];
    } catch (e) {
      console.error('Erro ao carregar carrinho:', e);
      return [];
    }
  }

  function saveCart(cart) {
    try {
      localStorage.setItem(CART_KEY, JSON.stringify(cart));
    } catch (e) {
      console.error('Erro ao salvar carrinho:', e);
    }
  }

  function formatPrice(value) {
    const num = Number(value) || 0;
    return num.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  }

  function renderProducts(products) {
    const grid = document.getElementById('products-grid');
    const empty = document.getElementById('products-empty');
    if (!grid) return;

    grid.innerHTML = '';

    let filtered = products;
    if (currentCategory !== 'all') {
      filtered = products.filter((p) => {
        const c = (p.category || '').toString().toLowerCase();
        return c === currentCategory;
      });
    }

    if (!filtered.length) {
      if (empty) empty.style.display = 'block';
      return;
    } else if (empty) {
      empty.style.display = 'none';
    }

    filtered.forEach((product, index) => {
      const card = document.createElement('article');
      card.className = 'product-card';

      const image = document.createElement('img');
      image.alt = product.name || product.title || 'Produto';
      const imgSrc = product.imageUrl || product.image || '';
      if (imgSrc) {
        image.src = imgSrc;
      } else {
        image.style.display = 'none';
      }

      const info = document.createElement('div');
      info.className = 'product-info';

      const nameEl = document.createElement('div');
      nameEl.className = 'product-name';
      nameEl.textContent = product.name || product.title || 'Produto sem nome';

      const priceEl = document.createElement('div');
      priceEl.className = 'product-price';
      if (product.price != null) {
        priceEl.textContent = formatPrice(product.price);
      } else {
        priceEl.textContent = 'Sob consulta';
      }

      const metaEl = document.createElement('div');
      metaEl.className = 'product-meta';
      if (product.createdAt) {
        const d = new Date(product.createdAt);
        if (!isNaN(d)) {
          metaEl.textContent = 'Publicado em ' + d.toLocaleDateString('pt-BR');
        }
      }

      const btn = document.createElement('button');
      btn.className = 'add-to-cart';
      btn.type = 'button';
      btn.textContent = 'Adicionar ao carrinho';

      btn.addEventListener('click', function () {
        addToCart(product, index);
      });

      info.appendChild(nameEl);
      info.appendChild(priceEl);
      if (metaEl.textContent) info.appendChild(metaEl);
      card.appendChild(image);
      card.appendChild(info);
      card.appendChild(btn);
      grid.appendChild(card);
    });
  }

  function renderCart(cart) {
    const list = document.getElementById('cart-items');
    const totalEl = document.getElementById('cart-total');
    const countEl = document.getElementById('cart-count');
    const emptyEl = document.getElementById('cart-empty');

    if (!list) return;

    list.innerHTML = '';

    if (!cart.length) {
      if (emptyEl) emptyEl.style.display = 'block';
      if (totalEl) totalEl.textContent = formatPrice(0);
      if (countEl) countEl.textContent = '0';
      return;
    } else if (emptyEl) {
      emptyEl.style.display = 'none';
    }

    let total = 0;
    let count = 0;

    cart.forEach((item, index) => {
      const row = document.createElement('div');
      row.className = 'cart-item';

      const main = document.createElement('div');
      main.className = 'cart-item-main';

      const nameEl = document.createElement('div');
      nameEl.className = 'cart-item-name';
      nameEl.textContent = item.name || 'Produto';

      const metaEl = document.createElement('div');
      metaEl.className = 'cart-item-meta';
      metaEl.textContent = formatPrice(item.price || 0);

      const qtyEl = document.createElement('div');
      qtyEl.className = 'cart-item-qty';
      qtyEl.textContent = 'Qtd: ' + (item.qty || 1);

      main.appendChild(nameEl);
      main.appendChild(metaEl);
      main.appendChild(qtyEl);

      const actions = document.createElement('div');
      actions.className = 'cart-item-actions';

      const plus = document.createElement('button');
      plus.type = 'button';
      plus.textContent = '+';
      plus.addEventListener('click', function () {
        updateQty(index, (item.qty || 1) + 1);
      });

      const minus = document.createElement('button');
      minus.type = 'button';
      minus.textContent = '-';
      minus.addEventListener('click', function () {
        updateQty(index, (item.qty || 1) - 1);
      });

      const removeBtn = document.createElement('button');
      removeBtn.type = 'button';
      removeBtn.textContent = 'x';
      removeBtn.addEventListener('click', function () {
        removeFromCart(index);
      });

      actions.appendChild(plus);
      actions.appendChild(minus);
      actions.appendChild(removeBtn);

      row.appendChild(main);
      row.appendChild(actions);
      list.appendChild(row);

      const price = Number(item.price) || 0;
      const qty = item.qty || 1;
      total += price * qty;
      count += qty;
    });

    if (totalEl) totalEl.textContent = formatPrice(total);
    if (countEl) countEl.textContent = String(count);
  }

  function addToCart(product, index) {
    const cart = loadCart();

    const id = product.id || product._id || (product.name || 'p') + '-' + (product.category || 'c') + '-' + (product.createdAt || index);

    const existing = cart.find(function (item) {
      return item.id === id;
    });

    if (existing) {
      existing.qty = (existing.qty || 1) + 1;
    } else {
      cart.push({
        id: id,
        name: product.name || product.title || 'Produto',
        price: Number(product.price) || 0,
        imageUrl: product.imageUrl || product.image || '',
        category: product.category || '',
        qty: 1
      });
    }

    saveCart(cart);
    renderCart(cart);
  }

  function updateQty(index, newQty) {
    const cart = loadCart();
    if (!cart[index]) return;
    if (newQty <= 0) {
      cart.splice(index, 1);
    } else {
      cart[index].qty = newQty;
    }
    saveCart(cart);
    renderCart(cart);
  }

  function removeFromCart(index) {
    const cart = loadCart();
    cart.splice(index, 1);
    saveCart(cart);
    renderCart(cart);
  }

  function clearCart() {
    saveCart([]);
    renderCart([]);
  }

  document.addEventListener('DOMContentLoaded', function () {
    const products = loadProducts();
    renderProducts(products);

    const cart = loadCart();
    renderCart(cart);

    const clearBtn = document.getElementById('clear-cart-btn');
    if (clearBtn) {
      clearBtn.addEventListener('click', function () {
        clearCart();
      });
    }
  });
})();
