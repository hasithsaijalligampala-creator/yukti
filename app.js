// YUKTI starter. Add Supabase project URL and publishable/anon key only after creating the project.
// Never put a service-role key or email-provider secret in this file.
const SUPABASE_URL = "https://abicbrodvlhryejzcsot.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_xX1eWHDNsbmyG7aq2efJaw_oh0GRRPR";
const configured = SUPABASE_URL.startsWith("https://") && !SUPABASE_URL.includes("PASTE_") && !SUPABASE_ANON_KEY.includes("PASTE_");
const db = configured && window.supabase ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;
let isSignUp = false;
let currentUser = null;
const $ = (id) => document.getElementById(id);
const views = ["home","search","report","account","admin"];
function showView(name){views.forEach(v=>$(v+"View").classList.toggle("hidden",v!==name)); if(name==="search") loadItems(); if(name==="admin") loadAdmin();}
document.querySelectorAll("[data-view]").forEach(b=>b.addEventListener("click",()=>showView(b.dataset.view)));
if(!configured){$("setupNotice").classList.remove("hidden");$("setupNotice").textContent="Setup needed: this app's interface is ready, but shared reports and sign-in will work only after you connect a Supabase project and run the database setup SQL."}
function escapeHtml(s=""){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));} 
async function loadItems() {
  const list = $("itemsList");

  if (!db) {
    list.innerHTML =
      '<div class="empty">Database not connected yet. Follow README.md to connect Supabase.</div>';
    return;
  }

  list.innerHTML = '<div class="empty">Loading found items…</div>';

  const q = $("searchInput").value.trim();
  const cat = $("categoryFilter").value;

  let query = db
    .from("public_item_search")
    .select(
      "id,item_name,category,location_found,date_found,description,status,created_at"
    )
    .order("created_at", { ascending: false })
    .limit(100);

  if (cat) {
    query = query.eq("category", cat);
  }

  if (q) {
    const safeQ = q.replace(/[,%()]/g, " ");
    query = query.or(
      `item_name.ilike.%${safeQ}%,description.ilike.%${safeQ}%`
    );
  }

  const { data, error } = await query;

  if (error) {
    console.error("Public item search failed:", error);
    list.innerHTML =
      '<div class="empty">Could not load found items. Please try again.</div>';
    return;
  }

  renderItems(list, data || []);

}
function renderItems(target,items){if(!items.length){target.innerHTML='<div class="empty">No reports found yet. Be the first to help return an item.</div>';return;}
 target.innerHTML=items.map(x=>`<article class="item-card"><div class="item-meta">${escapeHtml(x.category)} · ${escapeHtml(x.status||"Found")}</div><h3>${escapeHtml(x.item_name)}</h3><p>${escapeHtml(x.description||"No description provided.")}</p><p>📍 ${escapeHtml(x.location_found)}<br>📅 ${escapeHtml(x.date_found||"Date not provided")}</p><div class="item-meta">Report ID: ${escapeHtml(x.id)}</div></article>`).join("");}
$("searchInput").addEventListener("input",()=>loadItems());$("categoryFilter").addEventListener("change",()=>loadItems());$("refreshBtn").addEventListener("click",loadItems);
$("reportForm").addEventListener("submit",async e=>{e.preventDefault();const msg=$("reportMessage");if(!db){msg.textContent="Database setup is required before reports can be saved across devices.";return;}if(!currentUser){msg.textContent="Please sign in before submitting a report.";showView("account");return;}
 const f=new FormData(e.target);const row={item_name:f.get("item_name").trim(),category:f.get("category"),date_found:f.get("date_found"),location_found:f.get("location_found").trim(),description:f.get("description").trim(),status:"Found",created_by:currentUser.id};
 const {error}=await db.from("reports").insert(row);if(error){msg.textContent="Report could not be submitted. Check the fields and database permissions.";return;}e.target.reset();msg.textContent="Report submitted successfully.";});
$("toggleAuth").addEventListener("click",()=>{isSignUp=!isSignUp;$("accountTitle").textContent=isSignUp?"Create account":"Sign in";$("authSubmit").textContent=isSignUp?"Create account":"Sign in";$("toggleAuth").textContent=isSignUp?"Already have an account? Sign in":"Create an account";$("authForm").elements.password.autocomplete=isSignUp?"new-password":"current-password";});
$("authForm").addEventListener("submit",async e=>{e.preventDefault();const msg=$("authMessage");if(!db){msg.textContent="Connect Supabase first; account features are not active yet.";return;}const f=new FormData(e.target),email=f.get("email"),password=f.get("password");let result;
 if(isSignUp) result=await db.auth.signUp({email,password,options:{emailRedirectTo:location.origin}}); else result=await db.auth.signInWithPassword({email,password});
 if(result.error){msg.textContent=result.error.message;return;}msg.textContent=isSignUp?"Check your email for verification, if email confirmation is enabled.":"Signed in.";await syncUser();});
$("resetPassword").addEventListener("click",async()=>{if(!db){$("authMessage").textContent="Connect Supabase first.";return;}const email=$("authForm").elements.email.value;if(!email){$("authMessage").textContent="Enter your email address first.";return;}const {error}=await db.auth.resetPasswordForEmail(email,{redirectTo:location.origin});$("authMessage").textContent=error?error.message:"If the address is registered, password reset instructions will be sent.";});
$("signOut").addEventListener("click",async()=>{if(db) await db.auth.signOut();currentUser=null;updateAccountUI();$("authMessage").textContent="Signed out.";showView("home");});
async function syncUser(){if(!db)return;const {data}=await db.auth.getUser();currentUser=data.user||null;updateAccountUI();}
function updateAccountUI(){$("signOut").classList.toggle("hidden",!currentUser);$("toggleAuth").classList.toggle("hidden",!!currentUser);$("resetPassword").classList.toggle("hidden",!!currentUser);if(currentUser){$("accountTitle").textContent="Your account";$("authSubmit").classList.add("hidden");$("authMessage").textContent="Signed in as "+currentUser.email;checkAdmin();}else{$("authSubmit").classList.remove("hidden");$("accountTitle").textContent=isSignUp?"Create account":"Sign in";}}
async function checkAdmin(){if(!db||!currentUser)return;const {data,error}=await db.from("admin_users").select("user_id").eq("user_id",currentUser.id).maybeSingle();const adminBtn=[...document.querySelectorAll('[data-view="admin"]')];adminBtn.forEach(b=>b.classList.toggle("hidden",!!error||!data));}
async function loadAdmin(){const stats=$("adminStats"),list=$("adminList");if(!db||!currentUser){stats.innerHTML="";list.innerHTML='<div class="empty">Sign in with an authorized owner/admin account.</div>';return;}
 const {data:admin}=await db.from("admin_users").select("user_id").eq("user_id",currentUser.id).maybeSingle();if(!admin){stats.innerHTML="";list.innerHTML='<div class="empty">Access denied. This account has not been authorized as an admin.</div>';return;}
 const {data,error}=await db.from("reports").select("id,item_name,category,location_found,date_found,description,status,created_at").order("created_at",{ascending:false}).limit(100);if(error){list.innerHTML='<div class="empty">Admin data could not be loaded. Check database policies.</div>';return;}const rows=data||[];
 stats.innerHTML=[["Reports",rows.length],["Found",rows.filter(x=>x.status==="Found").length],["Returned",rows.filter(x=>x.status==="Returned").length],["Pending",rows.filter(x=>x.status==="Pending").length]].map(([a,b])=>`<div class="stat"><strong>${b}</strong><span>${a}</span></div>`).join("");renderItems(list,rows);
}
if(db){db.auth.onAuthStateChange(()=>{setTimeout(async()=>{await syncUser();},0)});syncUser();}
const today=new Date();$("reportForm").elements.date_found.value=today.toISOString().slice(0,10);
if("serviceWorker" in navigator && location.protocol.startsWith("http")) navigator.serviceWorker.register("./sw.js").catch(()=>{});
