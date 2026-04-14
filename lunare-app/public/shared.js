/* shared.js — cart, nav, auth, toast */

/* ── CART ── */
function getCart(){ try{ return JSON.parse(localStorage.getItem('lunare_cart')||'[]'); }catch{ return []; } }
function saveCart(c){ localStorage.setItem('lunare_cart',JSON.stringify(c)); updateCartUI(); }
function addToCart(product){
  const cart=getCart();
  const existing=cart.find(i=>i.id===product.id);
  if(existing) existing.quantity++;
  else cart.push({...product, quantity:1});
  saveCart(cart);
  showToast(product.name+' added to cart');
}
function removeFromCart(id){ saveCart(getCart().filter(i=>i.id!==id)); }
function updateQuantity(id, qty){
  if(qty<1){ removeFromCart(id); return; }
  const cart=getCart();
  const item=cart.find(i=>i.id===id);
  if(item) item.quantity=qty;
  saveCart(cart);
}
function clearCart(){ localStorage.removeItem('lunare_cart'); updateCartUI(); }
function cartTotal(){ return getCart().reduce((s,i)=>s+parseFloat(i.price)*i.quantity,0); }
function cartCount(){ return getCart().reduce((s,i)=>s+i.quantity,0); }
function updateCartUI(){
  const count=cartCount();
  document.querySelectorAll('.cart-count').forEach(el=>{
    el.textContent=count;
    el.classList.toggle('hidden',count===0);
  });
}

/* ── TOAST ── */
function showToast(msg,dur=2800){
  let t=document.getElementById('toast');
  if(!t){ t=document.createElement('div'); t.id='toast'; t.className='toast'; document.body.appendChild(t); }
  t.textContent=msg; t.classList.add('show');
  clearTimeout(t._timer);
  t._timer=setTimeout(()=>t.classList.remove('show'),dur);
}

/* ── API ── */
async function api(method,path,body){
  const opts={method,headers:{'Content-Type':'application/json'},credentials:'include'};
  if(body) opts.body=JSON.stringify(body);
  const res=await fetch(path,opts);
  const data=await res.json();
  if(!res.ok) throw new Error(data.error||'Something went wrong');
  return data;
}

/* ── NAV ── */
let currentUser=null;
async function initNav(){
  try{ currentUser=await api('GET','/api/me'); }catch{ currentUser=null; }
  renderNav();
  updateCartUI();
}

function renderNav(){
  const adminLink=document.getElementById('admin-nav-link');
  const authBtn=document.getElementById('nav-auth-btn');
  const userWrap=document.getElementById('nav-user-wrap');
  const userName=document.getElementById('nav-user-name');
  const dropdownName=document.getElementById('dropdown-name');
  const adminDropLink=document.getElementById('dropdown-admin-link');
  if(currentUser){
    if(authBtn) authBtn.style.display='none';
    if(userWrap) userWrap.style.display='block';
    if(userName) userName.textContent=currentUser.name.split(' ')[0]+(currentUser.isAdmin?' ⚙':'')+' ▾';
    if(dropdownName) dropdownName.textContent=currentUser.isAdmin?'Administrator':currentUser.email;
    if(adminDropLink) adminDropLink.style.display=currentUser.isAdmin?'block':'none';
  } else {
    if(authBtn) authBtn.style.display='block';
    if(userWrap) userWrap.style.display='none';
  }
  if(adminLink) adminLink.style.display=currentUser&&currentUser.isAdmin?'block':'none';
}

function toggleUserDropdown(e){
  e.stopPropagation();
  const d=document.getElementById('nav-user-dropdown');
  if(d) d.style.display=d.style.display==='block'?'none':'block';
}
document.addEventListener('click',()=>{
  const d=document.getElementById('nav-user-dropdown');
  if(d) d.style.display='none';
});
async function doLogout(){
  try{ await api('POST','/api/logout'); }catch{}
  currentUser=null; renderNav();
  const d=document.getElementById('nav-user-dropdown');
  if(d) d.style.display='none';
  showToast('Signed out. See you soon.');
  setTimeout(()=>window.location.href='/',600);
}

/* ── REVEAL ── */
function initReveal(){
  const obs=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting)e.target.classList.add('visible');}),{threshold:0.1});
  document.querySelectorAll('.reveal').forEach(el=>obs.observe(el));
}

/* ── NAV HTML ── */
function navHTML(activePage){
  return `
  <nav>
    <a class="nav-logo" href="/"><span>L</span>UNARE</a>
    <ul class="nav-links">
      <li><a href="/" class="${activePage==='home'?'active':''}">Home</a></li>
      <li><a href="/shop" class="${activePage==='shop'?'active':''}">Shop</a></li>
      <li><a href="/#about">Our story</a></li>
      <li><a href="/#process">Process</a></li>
      <li><a id="admin-nav-link" href="/admin" style="display:none;color:var(--adminac);">Admin</a></li>
    </ul>
    <div class="nav-right">
      <button class="cart-btn" onclick="window.location.href='/cart'">
        Cart <span class="cart-count hidden">0</span>
      </button>
      <button class="nav-cta" id="nav-auth-btn" onclick="window.location.href='/login'">Sign in</button>
      <div class="user-dropdown-wrap" id="nav-user-wrap" style="display:none;">
        <button class="nav-cta" id="nav-user-name" onclick="toggleUserDropdown(event)">Account ▾</button>
        <div class="user-dropdown" id="nav-user-dropdown">
          <div class="user-dropdown-header">
            <p>Signed in as</p>
            <p id="dropdown-name"></p>
          </div>
          <a id="dropdown-admin-link" href="/admin" style="display:none;color:var(--adminac);">⚙ Admin panel</a>
          <a href="/orders">My orders</a>
          <a onclick="doLogout()">Sign out</a>
        </div>
      </div>
    </div>
  </nav>`;
}

function footerHTML(){
  return `
  <footer>
    <div>
      <div class="footer-logo">LUNARE</div>
      <p class="footer-tagline">Handmade soap made slowly, in small batches, with real ingredients.</p>
    </div>
    <div class="footer-col"><h4>Shop</h4><ul><li><a href="/shop">All soaps</a></li><li><a href="/shop">New arrivals</a></li><li><a href="/shop">Gift sets</a></li></ul></div>
    <div class="footer-col"><h4>Info</h4><ul><li><a href="/#about">Our story</a></li><li><a href="/#process">Process</a></li><li><a href="/shop">FAQ</a></li></ul></div>
    <div class="footer-col"><h4>Connect</h4><ul><li><a>Instagram</a></li><li><a>Contact us</a></li><li><a>Wholesale</a></li></ul></div>
  </footer>
  <div class="footer-bottom"><p>© 2026 Lunare. All rights reserved.</p><p>Made with care</p></div>`;
}
