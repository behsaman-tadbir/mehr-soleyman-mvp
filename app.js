/* Behsayar MVP (Static) — App Controller
   - No external deps
   - Demo auth + UI sync
   - LocalStorage keys: bs_users, bs_session, bs_cart
*/
(() => {
  'use strict';

  const qs = (s, r = document) => r.querySelector(s);
  const qsa = (s, r = document) => Array.from(r.querySelectorAll(s));
  const on = (el, ev, fn, opts) => el && el.addEventListener(ev, fn, opts);

  // Prevent accidental double-binding (e.g., if app.js is included twice)
  const markBound = (el, key) => {
    if (!el) return false;
    const k = `bsBound_${key}`;
    if (el.dataset && el.dataset[k] === '1') return true;
    if (el.dataset) el.dataset[k] = '1';
    return false;
  };

  const LS = {
    get(key, fallback) {
      try {
        const raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) : fallback;
      } catch (_) { return fallback; }
    },
    set(key, val) {
      try { localStorage.setItem(key, JSON.stringify(val)); } catch (_) {}
    },
    del(key) {
      try { localStorage.removeItem(key); } catch (_) {}
    }
  };

  const KEYS = {
    USERS: 'bs_users',
    SESSION: 'bs_session',
    CART: 'bs_cart',
    ORDERS: 'bs_orders'
  };

  const DEMO_USERS = [
    {
      id: '1001',
      password: '123',
      role: 'student',
      roleLabel: 'دانش‌آموز',
      fullName: 'علی حسینی',
      nationalId: '0016598255',
      fatherName: 'حسین',
      
      parentId: '1002',
credit: 20000000
    },
    {
      id: '1002',
      password: '123',
      role: 'personnel',
      roleLabel: 'پرسنل',
      fullName: 'حسین حسینی',
      nationalId: '0025478844',
      fatherName: 'پدر علی',
      credit: 12000000
    },
    {
      id: '1003',
      password: '123',
      role: 'admin',
      roleLabel: 'مدیر سیستم',
      fullName: 'علیرضا داداشی',
      nationalId: '0012345678',
      fatherName: '',
      credit: 50000000
    }
  ];


  // Demo orders (for مدیریتی/سوابق خرید)
  const DEMO_ORDERS = [
    {
      id: 'TRK-24001',
      userId: '1001',
      createdAt: '1404/10/12',
      status: 'موفق',
      address: 'تحویل در مدرسه (شعبه مرکزی)',
      paymentType: 'اعتباری/اقساط',
      satisfaction: 5,
      items: [
        { productId: 'best-001', title: 'پکیج ریاضی پایه (تقویتی)', meta: 'خیلی سبز', qty: 1, unitPrice: 640000 },
        { productId: 'best-003', title: 'برنامه‌ریزی آزمون‌های هفتگی', meta: 'قلمچی', qty: 1, unitPrice: 790000 }
      ]
    },
    {
      id: 'TRK-24002',
      userId: '1001',
      createdAt: '1404/10/25',
      status: 'موفق',
      address: 'تهران، سعادت‌آباد، خیابان سرو، پلاک ۲۱',
      paymentType: 'نقدی',
      satisfaction: 4,
      items: [
        { productId: 'new-002', title: 'لغت و درک مطلب (تقویت سریع)', meta: 'گاج', qty: 1, unitPrice: 490000 }
      ]
    },
    {
      id: 'TRK-34001',
      userId: '1002',
      createdAt: '1404/11/03',
      status: 'موفق',
      address: 'تهران، ولیعصر، پلاک ۸',
      paymentType: 'اعتباری/اقساط',
      satisfaction: 5,
      items: [
        { productId: 'deal-007', title: 'دوره ICDL کاربردی (از صفر)', meta: 'پرش', qty: 1, unitPrice: 590000 }
      ]
    }
  ];

  function getOrders() {
    return LS.get(KEYS.ORDERS, []);
  }

  function setOrders(list) {
    LS.set(KEYS.ORDERS, Array.isArray(list) ? list : []);
  }

  function ordersForUser(userId) {
    const all = getOrders();
    return all.filter(o => o && o.userId === userId);
  }

  function ensureSeedOrders() {
    const orders = LS.get(KEYS.ORDERS, null);
    if (!orders || !Array.isArray(orders) || orders.length === 0) {
      setOrders(DEMO_ORDERS);
    }
  }


  const formatIR = (n) => {
    const num = Number(n || 0);
    const s = num.toLocaleString('fa-IR');
    return s;
  };

  function ensureSeedUsers() {
    const users = LS.get(KEYS.USERS, {});
    let changed = false;

    for (const u of DEMO_USERS) {
      if (!users[u.id]) {
        users[u.id] = u;
        changed = true;
      } else {
        // keep existing but ensure required fields exist
        const merged = { ...u, ...users[u.id] };
        // password should remain user-entered? for demo keep seed default
        merged.password = users[u.id].password || u.password;
        users[u.id] = merged;
        changed = true;
      }
    }
    if (changed) LS.set(KEYS.USERS, users);
  }

  function getSession() {
    return LS.get(KEYS.SESSION, null);
  }

  function setSession(userId) {
    LS.set(KEYS.SESSION, { userId, ts: Date.now() });
  }

  function clearSession() {
    LS.del(KEYS.SESSION);
  }

  function getCurrentUser() {
    const sess = getSession();
    if (!sess || !sess.userId) return null;
    const users = LS.get(KEYS.USERS, {});
    return users[sess.userId] || null;
  }

  function login(username, password) {
    const users = LS.get(KEYS.USERS, {});
    const u = users[String(username || '').trim()];
    if (!u) return { ok: false, msg: 'کاربر پیدا نشد.' };
    if (String(password || '').trim() !== String(u.password)) return { ok: false, msg: 'رمز عبور اشتباه است.' };
    setSession(u.id);
    return { ok: true, user: u };
  }

  function logout() {
    clearSession();
  }

  // ---------- UI: Header Auth (Desktop) ----------
  function bindHeaderAuth() {
    const btn = qs('#headerAuthBtn');
    const pop = qs('#headerAuthPopover');
    const form = qs('#headerInlineLoginForm');
    const closeBtn = qs('#headerAuthClose');

    if (!btn || !pop || !form) return;
    if (markBound(btn, 'headerAuth')) return;

    const open = () => {
      pop.hidden = false;
      document.body.classList.add('modal-open');
      btn.setAttribute('aria-expanded', 'true');
      btn.classList.add('is-open');
      const first = qs('input', pop);
      first && first.focus({ preventScroll: true });
    };

    const close = () => {
      pop.hidden = true;
      document.body.classList.remove('modal-open');
      btn.setAttribute('aria-expanded', 'false');
      btn.classList.remove('is-open');
    };

    on(btn, 'click', (e) => {
      e.preventDefault();
      if (!pop.hidden) close(); else open();
    });

    // Close button inside modal
    closeBtn && on(closeBtn, 'click', (e) => {
      e.preventDefault();
      close();
    });

    // Backdrop click closes (but clicking inside the dialog does not)
    on(pop, 'click', (e) => {
      if (e.target === pop) close();
    });


    on(document, 'click', (e) => {
      if (pop.hidden) return;
      const t = e.target;
      if (btn.contains(t) || pop.contains(t)) return;
      close();
    });

    on(document, 'keydown', (e) => {
      if (e.key === 'Escape' && !pop.hidden) close();
    });

    on(form, 'submit', (e) => {
      e.preventDefault();
      const u = qs('#headerLoginUsername')?.value;
      const p = qs('#headerLoginPassword')?.value;
      const out = qs('#headerLoginMsg');
      const res = login(u, p);
      if (!res.ok) {
        if (out) { out.textContent = res.msg; out.hidden = false; }
        return;
      }
      if (out) { out.textContent = ''; out.hidden = true; }
      close();
      syncAuthUI();
    });
  }

  // ---------- UI: User menu (Desktop) ----------
  function bindUserMenu() {
    const trigger = qs('#userMenuTrigger');
    const drop = qs('#userMenuDropdown');
    if (!trigger || !drop) return;
    if (markBound(trigger, 'userMenu')) return;

    const open = () => {
      drop.hidden = false;
      trigger.setAttribute('aria-expanded', 'true');
    };
    const close = () => {
      drop.hidden = true;
      trigger.setAttribute('aria-expanded', 'false');
    };

    on(trigger, 'click', (e) => {
      e.preventDefault();
      if (!drop.hidden) close(); else open();
    });

    on(document, 'click', (e) => {
      const t = e.target;
      if (drop.hidden) return;
      if (trigger.contains(t) || drop.contains(t)) return;
      close();
    });

    on(document, 'keydown', (e) => {
      if (e.key === 'Escape' && !drop.hidden) close();
    });

    const logoutBtn = qs('#userMenuLogout');
    on(logoutBtn, 'click', () => {
      logout();
      syncAuthUI();
    });
  }

  // ---------- UI: Bottom sheets (Mobile) ----------
  function bindSheets() {
    if (markBound(document.documentElement, 'sheets')) return;
    qsa('[data-sheet-close]').forEach((el) => {
      on(el, 'click', () => {
        const sheet = el.closest('.bottom-sheet');
        sheet && sheet.classList.remove('is-open');
      });
    });

    on(document, 'keydown', (e) => {
      if (e.key !== 'Escape') return;
      qsa('.bottom-sheet.is-open').forEach((s) => s.classList.remove('is-open'));
    });
  }

  function bindMobileAuth() {
    const btn = qs('#bnAuthBtn');
    const sheet = qs('#mobileAuthSheet');
    if (!btn || !sheet) return;
    if (markBound(btn, 'mobileAuth')) return;

    on(btn, 'click', (e) => {
      e.preventDefault();
      sheet.classList.add('is-open');
    });

    const form = qs('#mobileLoginForm');
    on(form, 'submit', (e) => {
      e.preventDefault();
      const u = qs('#mobileLoginUsername')?.value;
      const p = qs('#mobileLoginPassword')?.value;
      const out = qs('#mobileLoginMsg');
      const res = login(u, p);
      if (!res.ok) {
        if (out) { out.textContent = res.msg; out.hidden = false; }
        return;
      }
      if (out) { out.textContent = ''; out.hidden = true; }
      syncAuthUI();
      // keep sheet open but show account options
    });

    const logoutBtn = qs('#mobileUserLogout');
    on(logoutBtn, 'click', () => {
      logout();
      syncAuthUI();
    });
  }

  
  function bindMobileCats() {
    const btn = qs('#bnCatsBtn');
    const sheet = qs('#mobileCatsSheet');
    if (!btn || !sheet) return;
    if (markBound(btn, 'mobileCats')) return;

    const open = () => {
      sheet.classList.add('is-open');
      sheet.setAttribute('aria-hidden', 'false');
      btn.setAttribute('aria-expanded', 'true');
    };
    const close = () => {
      sheet.classList.remove('is-open');
      sheet.setAttribute('aria-hidden', 'true');
      btn.setAttribute('aria-expanded', 'false');
    };

    on(btn, 'click', (e) => {
      e.preventDefault();
      if (sheet.classList.contains('is-open')) close();
      else open();
    });

    // Close when user taps a link
    qsa('a', sheet).forEach((a) => {
      on(a, 'click', () => close());
    });
  }

// ---------- UI: Categories dropdown (Desktop) ----------
  function bindCategoriesDropdown() {
    const items = qsa('.nav-item.has-dropdown');
    if (!items.length) return;

    const header = qs('.site-header');

    // Close open dropdown when user scrolls (prevents sticky open menus while browsing)
    let active = null; // { close, panel, openedAt }
    const ensureScrollClose = () => {
      if (markBound(window, 'catsScrollClose')) return;
      let ticking = false;
      on(window, 'scroll', () => {
        if (!active || !active.panel || active.panel.hidden) return;
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(() => {
          ticking = false;
          const dy = Math.abs(window.scrollY - (active.openedAt || 0));
          if (dy >= 12) active.close();
        });
      }, { passive: true });
    };
    ensureScrollClose();

    items.forEach((item) => {
      const tgl = qs('.nav-dropdown-toggle', item);
      const panel = qs('.dropdown-panel', item);
      if (!tgl || !panel) return;
      if (markBound(tgl, 'cats')) return;

      const open = () => {
        panel.hidden = false;
        tgl.setAttribute('aria-expanded', 'true');
        item.classList.add('is-open');
        if (header) {
          // Allow dropdown panel to render outside collapsed header-bottom.
          header.classList.add('is-nav-dropdown-open');
          header.classList.remove('is-bottom-collapsed');
        }
        active = { close, panel, openedAt: window.scrollY };
      };
      const close = () => {
        panel.hidden = true;
        tgl.setAttribute('aria-expanded', 'false');
        item.classList.remove('is-open');
        if (header) header.classList.remove('is-nav-dropdown-open');
        if (active && active.panel === panel) active = null;
      };

      on(tgl, 'click', (e) => {
        e.preventDefault();
        if (!panel.hidden) close(); else open();
      });

      on(document, 'click', (e) => {
        const t = e.target;
        if (panel.hidden) return;
        if (tgl.contains(t) || panel.contains(t)) return;
        close();
      });

      on(document, 'keydown', (e) => {
        if (e.key === 'Escape' && !panel.hidden) close();
      });
    });
  }

 
 // ---------- UI: Header Bottom Auto Collapse (Desktop) ----------
  function bindHeaderBottomCollapse() {
    const header = qs('.site-header');
    const bottom = qs('.header-bottom');
    if (!header || !bottom) return;
    if (markBound(window, 'headerBottomCollapse')) return;

    // Hysteresis-based collapse to avoid flicker ("پرپر زدن")
    let lastY = window.scrollY || 0;
    let ticking = false;
    let isCollapsed = header.classList.contains('is-bottom-collapsed');

    const HIDE_AT = 96;      // collapse after user has scrolled a bit
    const SHOW_AT = 48;      // expand when near top
    const MIN_DELTA = 2;     // ignore micro scroll noise
    const UP_DELTA = 18;     // user intent to go up

    on(window, 'scroll', () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        ticking = false;

        const y = window.scrollY || 0;

        // Dropdown open should pin header-bottom visible
        if (header.classList.contains('is-nav-dropdown-open')) {
          if (isCollapsed) {
            header.classList.remove('is-bottom-collapsed');
            isCollapsed = false;
          }
          lastY = y;
          return;
        }

        // Always show near very top
        if (y <= 8) {
          if (isCollapsed) {
            header.classList.remove('is-bottom-collapsed');
            isCollapsed = false;
          }
          lastY = y;
          return;
        }

        const delta = y - lastY;
        if (Math.abs(delta) < MIN_DELTA) {
          lastY = y;
          return;
        }

        if (!isCollapsed) {
          // Collapse only if user is clearly going down and past HIDE_AT
          if (delta > 0 && y >= HIDE_AT) {
            header.classList.add('is-bottom-collapsed');
            isCollapsed = true;
          }
        } else {
          // Expand if user is going up with intent OR returns close to top
          if (y <= SHOW_AT || delta <= -UP_DELTA) {
            header.classList.remove('is-bottom-collapsed');
            isCollapsed = false;
          }
        }

        lastY = y;
      });
    }, { passive: true });
  }


  // ---------- UI sync ----------
  function syncAuthUI() {
    const user = getCurrentUser();

    const authArea = qs('#authArea');
    const loginBtn = qs('#headerAuthBtn');
    const userMenu = qs('#headerUserMenu');

    const mobileLoginForm = qs('#mobileLoginForm');
    // Mobile account actions live inside the bottom sheet
    const mobileUserMenu = qs('#mobileAccountActions');

    const bnText = qs('#bnAuthText');

    if (user) {
      document.documentElement.classList.add('is-auth');
      // Desktop
      if (loginBtn) loginBtn.hidden = true;
      if (userMenu) userMenu.hidden = false;

      // Desktop menu fields
      const avatar = qs('#userMenuAvatar');
      if (avatar) avatar.src = `images/avatars/${user.id}.png`;
      const credit = qs('#userMenuCredit');
      if (credit) credit.textContent = `اعتبار: ${formatIR(user.credit)} تومان`;
      const name = qs('#userMenuName');
      if (name) name.textContent = user.fullName;
      const meta = qs('#userMenuMeta');
      if (meta) meta.textContent = user.roleLabel;

      // Mobile
      if (mobileLoginForm) mobileLoginForm.hidden = true;
      if (mobileUserMenu) mobileUserMenu.hidden = false;

      const mAvatar = qs('#mobileUserAvatar');
      if (mAvatar) mAvatar.src = `images/avatars/${user.id}.png`;
      const mCredit = qs('#mobileUserCredit');
      if (mCredit) mCredit.textContent = `اعتبار: ${formatIR(user.credit)} تومان`;
      const mName = qs('#mobileUserName');
      if (mName) mName.textContent = user.fullName;
      const mMeta = qs('#mobileUserMeta');
      if (mMeta) mMeta.textContent = user.roleLabel;

      if (bnText) bnText.textContent = 'حساب';


      // Orders link (سوابق خرید) + شمارنده
      const ordersLink = qs('#userMenuOrders') || qs('#userMenuCart');
      if (ordersLink) {
        ordersLink.hidden = user.role === 'admin';
        if (user.role !== 'admin') {
          const cnt = ordersForUser(user.id).length;
          ordersLink.textContent = cnt > 0 ? `سوابق خرید (${cnt})` : 'سوابق خرید';
        }
      }

    } else {
      document.documentElement.classList.remove('is-auth');
      // Desktop
      if (loginBtn) loginBtn.hidden = false;
      if (userMenu) userMenu.hidden = true;

      // Mobile
      if (mobileLoginForm) mobileLoginForm.hidden = false;
      if (mobileUserMenu) mobileUserMenu.hidden = true;

      if (bnText) bnText.textContent = 'ورود';
    }

    // avatar fallback if missing images
    qsa('img').forEach((img) => {
      if (!img.getAttribute('onerror')) {
        img.onerror = () => { img.src = 'images/placeholder.svg'; };
      }
    });
  }

  // -

  // ---------- Orders (سوابق خرید) ----------
  function ensureOrdersModal() {
    if (qs('#ordersModal')) return;

    const html = `
      <div class="orders-modal" id="ordersModal" hidden aria-modal="true" role="dialog" aria-labelledby="ordersTitle">
        <div class="orders-modal__backdrop" data-orders-close></div>
        <div class="orders-modal__dialog" role="document">
          <div class="orders-modal__head">
            <div class="orders-modal__title" id="ordersTitle">سوابق خرید</div>
            <button type="button" class="orders-modal__close" data-orders-close aria-label="بستن">×</button>
          </div>

          <div class="orders-modal__tabs" id="ordersTabs" hidden>
            <button type="button" class="orders-tab is-active" data-orders-tab="mine">خریدهای من</button>
            <button type="button" class="orders-tab" data-orders-tab="child">خریدهای فرزند</button>
          </div>

          <div class="orders-modal__filters">
            <input class="orders-filter__input" id="ordersSearch" type="search" placeholder="جستجو: کد رهگیری / کالا / آدرس" aria-label="جستجو در سوابق خرید">
            <select class="orders-filter__select" id="ordersStatus" aria-label="فیلتر وضعیت">
              <option value="">همه وضعیت‌ها</option>
              <option value="موفق">موفق</option>
              <option value="در حال پردازش">در حال پردازش</option>
              <option value="لغو شده">لغو شده</option>
            </select>
          </div>

          <div class="orders-modal__list" id="ordersList"></div>
        </div>
      </div>
    `;
    document.body.insertAdjacentHTML('beforeend', html);
  }

  function renderOrdersList(userId) {
    const listEl = qs('#ordersList');
    if (!listEl) return;

    const q = (qs('#ordersSearch')?.value || '').trim();
    const st = (qs('#ordersStatus')?.value || '').trim();

    let orders = ordersForUser(userId);

    if (st) orders = orders.filter(o => (o.status || '') === st);

    if (q) {
      const qq = q.toLowerCase();
      orders = orders.filter(o => {
        const hay = [
          o.id,
          o.createdAt,
          o.status,
          o.address,
          o.paymentType,
          ...(Array.isArray(o.items) ? o.items.map(it => `${it.title || ''} ${it.meta || ''}`) : [])
        ].join(' ').toLowerCase();
        return hay.includes(qq);
      });
    }

    if (!orders.length) {
      listEl.innerHTML = '<div class="orders-empty">موردی یافت نشد.</div>';
      return;
    }

    listEl.innerHTML = orders.map(o => {
      const total = (Array.isArray(o.items) ? o.items.reduce((s, it) => s + (Number(it.unitPrice)||0) * (Number(it.qty)||0), 0) : 0);
      const itemsHtml = (Array.isArray(o.items) ? o.items.map(it => {
        const meta = it.meta ? `<div class="orders-item__meta">${escapeHTML(it.meta)}</div>` : '';
        return `
          <div class="orders-item">
            <div class="orders-item__title">${escapeHTML(it.title || 'محصول')}</div>
            ${meta}
            <div class="orders-item__sub">${formatIR(Number(it.unitPrice)||0)} تومان × ${Number(it.qty)||1}</div>
          </div>
        `;
      }).join('') : '');

      const reviewTxt = (o.review && o.review.text) ? escapeHTML(o.review.text) : '';
      const reviewRate = (o.review && Number(o.review.rate)) ? Number(o.review.rate) : '';

      return `
        <details class="order-card">
          <summary class="order-card__sum">
            <div class="order-sum__right">
              <div class="order-code">${escapeHTML(o.id || '—')}</div>
              <div class="order-date">${escapeHTML(o.createdAt || '—')}</div>
            </div>
            <div class="order-sum__left">
              <div class="order-status">${escapeHTML(o.status || '—')}</div>
              <div class="order-total">${formatIR(total)} تومان</div>
            </div>
          </summary>

          <div class="order-card__body">
            <div class="order-row"><span class="k">آدرس:</span><span class="v">${escapeHTML(o.address || '—')}</span></div>
            <div class="order-row"><span class="k">روش پرداخت:</span><span class="v">${escapeHTML(o.paymentType || '—')}</span></div>

            <div class="order-items">${itemsHtml}</div>

            <div class="order-review">
              <div class="order-review__head">ثبت نظر</div>
              <div class="order-review__grid">
                <select class="order-review__rate" data-review-rate="${escapeHTML(o.id)}" aria-label="امتیاز">
                  <option value="">امتیاز</option>
                  <option value="5" ${reviewRate===5?'selected':''}>5</option>
                  <option value="4" ${reviewRate===4?'selected':''}>4</option>
                  <option value="3" ${reviewRate===3?'selected':''}>3</option>
                  <option value="2" ${reviewRate===2?'selected':''}>2</option>
                  <option value="1" ${reviewRate===1?'selected':''}>1</option>
                </select>
                <input class="order-review__text" data-review-text="${escapeHTML(o.id)}" type="text" placeholder="نظر شما..." value="${reviewTxt}">
                <button type="button" class="btn btn-primary order-review__btn" data-review-save="${escapeHTML(o.id)}">ثبت</button>
              </div>
            </div>
          </div>
        </details>
      `;
    }).join('');
  }

  function openOrdersModal() {
    const modal = qs('#ordersModal');
    if (!modal) return;
    modal.hidden = false;
    document.documentElement.classList.add('modal-open');

    const user = getCurrentUser();
    if (!user) return;

    // tabs for personnel -> child
    const tabs = qs('#ordersTabs');
    if (tabs) {
      const childId = (user.role === 'personnel')
        ? (DEMO_USERS.find(u => u.role === 'student' && u.parentId === user.id)?.id || '')
        : '';
      tabs.hidden = !childId;
      if (!childId) {
        tabs.querySelectorAll('[data-orders-tab]').forEach(b => b.classList.toggle('is-active', b.dataset.ordersTab === 'mine'));
      }
      tabs.dataset.childId = childId;
    }

    renderOrdersList(user.id);
  }

  function closeOrdersModal() {
    const modal = qs('#ordersModal');
    if (!modal) return;
    modal.hidden = true;
    document.documentElement.classList.remove('modal-open');
  }

  function bindOrdersUI() {
    const link = qs('#userMenuOrders') || qs('#userMenuCart'); // fallback id
    const mLink = qs('#mobileUserOrders') || qs('#mobileUserCart'); // if exists later

    const open = (e) => {
      e && e.preventDefault();
      const user = getCurrentUser();
      if (!user) {
        // open auth popover if available
        const authBtn = qs('#headerAuthBtn');
        if (authBtn) authBtn.click();
        return;
      }
      ensureOrdersModal();
      openOrdersModal();
    };

    on(link, 'click', open);
    on(mLink, 'click', open);

    // close
    document.addEventListener('click', (e) => {
      const t = e.target;
      if (t && t.hasAttribute('data-orders-close')) closeOrdersModal();
    });

    // filters
    on(document, 'input', (e) => {
      const user = getCurrentUser();
      if (!user) return;
      if (e.target && (e.target.id === 'ordersSearch')) renderOrdersList(currentOrdersUserId());
    });
    on(document, 'change', (e) => {
      const user = getCurrentUser();
      if (!user) return;
      if (e.target && (e.target.id === 'ordersStatus')) renderOrdersList(currentOrdersUserId());
      if (e.target && e.target.matches('[data-orders-tab]')) {
        const tab = e.target.dataset.ordersTab;
        const tabs = qs('#ordersTabs');
        if (!tabs) return;
        tabs.querySelectorAll('[data-orders-tab]').forEach(b => b.classList.toggle('is-active', b.dataset.ordersTab === tab));
        renderOrdersList(tab === 'child' ? (tabs.dataset.childId || user.id) : user.id);
      }
      if (e.target && e.target.matches('[data-review-rate]')) {
        // no-op, saved on button
      }
    });

    // save review
    document.addEventListener('click', (e) => {
      const btn = e.target && e.target.closest ? e.target.closest('[data-review-save]') : null;
      if (!btn) return;
      const orderId = btn.getAttribute('data-review-save');
      const rateEl = qs(`[data-review-rate="${CSS.escape(orderId)}"]`);
      const textEl = qs(`[data-review-text="${CSS.escape(orderId)}"]`);
      const rate = rateEl ? Number(rateEl.value || 0) : 0;
      const text = textEl ? String(textEl.value || '').trim() : '';

      const all = getOrders();
      const idx = all.findIndex(o => o && o.id === orderId);
      if (idx >= 0) {
        all[idx].review = { rate: rate || null, text };
        setOrders(all);
      }
    });
  }

  function currentOrdersUserId() {
    const user = getCurrentUser();
    if (!user) return '';
    const tabs = qs('#ordersTabs');
    if (!tabs || tabs.hidden) return user.id;
    const active = tabs.querySelector('.orders-tab.is-active');
    if (active && active.dataset.ordersTab === 'child') return tabs.dataset.childId || user.id;
    return user.id;
  }

--------- boot ----------
  function boot() {
    ensureSeedUsers();
    ensureSeedOrders();
    ensureOrdersModal();
    bindHeaderAuth();
    bindUserMenu();
    bindOrdersUI();
    bindSheets();
    bindMobileAuth();
    bindMobileCats();
    bindCategoriesDropdown();
    bindHeaderBottomCollapse();
    syncAuthUI();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }
})();

/* === Home Slider (RTL: right → left) === */
/* === Home Slider (RTL: enter from right, exit to left) === */
(() => {
  const root = document.querySelector('.post-slider');
  const slidesWrap = document.querySelector('.post-slides');
  const slides = Array.from(document.querySelectorAll('.post-slide'));
  if (!root || !slidesWrap || slides.length < 2) return;

  const DURATION = 600; // باید با CSS هماهنگ باشد
  const INTERVAL = 5000;

  let current = 0;
  let timer = null;
  let busy = false;

  // حالت پایه: همه بیرون از راست
  slides.forEach((s, i) => {
    s.classList.remove('is-active', 'is-exit-left');
    s.style.pointerEvents = 'none';
    if (i === 0) s.classList.add('is-active');
  });

  const goNext = () => {
    if (busy) return;
    busy = true;

    const prev = current;
    const next = (current + 1) % slides.length;

    const prevEl = slides[prev];
    const nextEl = slides[next];

    // next را آماده کن (بیرون از راست) و بعد فعالش کن
    nextEl.classList.remove('is-exit-left');
    // با یک فریم فاصله تا مرورگر ترنزیشن را درست اعمال کند
    requestAnimationFrame(() => {
      // خروج قبلی به چپ
      prevEl.classList.remove('is-active');
      prevEl.classList.add('is-exit-left');

      // ورود بعدی از راست
      nextEl.classList.add('is-active');

      current = next;

      // پاکسازی بعد از اتمام ترنزیشن
      window.setTimeout(() => {
        // اسلاید قبلی را فقط به حالت پایه برگردان (بیرون از راست)
        prevEl.classList.remove('is-exit-left');
        busy = false;
      }, DURATION + 50);
    });
  };

  const start = () => {
    stop();
    timer = window.setInterval(goNext, INTERVAL);
  };

  const stop = () => {
    if (timer) window.clearInterval(timer);
    timer = null;
  };

  // اگر تب inactive شد، تایمر را متوقف کن تا با برگشت “خالی” نشود
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stop();
    else start();
  });

  start();
})();

(function initProductsPage(){
  const isProductsPage = document.body && document.body.classList.contains('page-products');
  if (!isProductsPage) return;

  const grid = document.getElementById('productsGrid');
  if (!grid) return;

  const q = document.getElementById('productsSearch');
  const cat = document.getElementById('productsCategory');
  const grade = document.getElementById('productsGrade');
  const sort = document.getElementById('productsSort');

  const cards = Array.from(grid.querySelectorAll('.product-card[data-id]'));

  function norm(s){
    return (s || '').toString().trim().toLowerCase();
  }

  function applyFromQueryString(){
    const params = new URLSearchParams(location.search);
    const c = params.get('cat');
    if (c && cat) cat.value = c;
  }

  function filterCards(){
    const query = norm(q && q.value);
    const catVal = (cat && cat.value) || 'all';
    const gradeVal = (grade && grade.value) || 'all';

    cards.forEach(card => {
      const title = norm(card.dataset.title);
      const c = card.dataset.cat || 'all';
      const g = card.dataset.grade || 'all';

      const matchQuery = !query || title.includes(query);
      const matchCat = (catVal === 'all') || (c === catVal);
      const matchGrade = (gradeVal === 'all') || (g === gradeVal);

      card.style.display = (matchQuery && matchCat && matchGrade) ? '' : 'none';
    });
  }

  function sortCards(){
    const mode = (sort && sort.value) || 'best';

    const visible = cards.filter(c => c.style.display !== 'none');

    const getNum = (el, key) => {
      const v = el.dataset[key];
      const n = Number(v);
      return Number.isFinite(n) ? n : 0;
    };

    visible.sort((a,b) => {
      if (mode === 'best') return getNum(b,'sold') - getNum(a,'sold');
      if (mode === 'new') return (new Date(b.dataset.created || 0)) - (new Date(a.dataset.created || 0));
      if (mode === 'discount') return getNum(b,'discount') - getNum(a,'discount');
      if (mode === 'priceHigh') return getNum(b,'price') - getNum(a,'price');
      if (mode === 'priceLow') return getNum(a,'price') - getNum(b,'price');
      return 0;
    });

    // فقط reorder روی آیتم‌های قابل مشاهده
    visible.forEach(el => grid.appendChild(el));
  }

  function refresh(){
    filterCards();
    sortCards();
  }

  applyFromQueryString();
  refresh();

  [q,cat,grade,sort].forEach(el => {
    if (!el) return;
    el.addEventListener('input', refresh);
    el.addEventListener('change', refresh);
  });
})();
