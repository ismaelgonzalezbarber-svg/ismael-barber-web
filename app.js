let csrfToken = "";
let servicesCache = [];
let settingsCache = null;
const $ = (s, root=document) => root.querySelector(s);
const $$ = (s, root=document) => [...root.querySelectorAll(s)];
async function api(url, options={}) {
  const method=(options.method||"GET").toUpperCase();
  const headers={...(options.headers||{})};
  if(options.body && !headers["Content-Type"]) headers["Content-Type"]="application/json";
  if(!["GET","HEAD","OPTIONS"].includes(method) && csrfToken) headers["x-csrf-token"]=csrfToken;
  const response=await fetch(url,{credentials:"same-origin",...options,headers});
  const data=await response.json().catch(()=>({}));
  if(!response.ok) throw new Error(data.error||"Ha ocurrido un error.");
  return data;
}
async function refreshCsrf(){const d=await api("/api/csrf");csrfToken=d.token;}
function showPanel(name){
  $$(".panel").forEach(p=>p.classList.toggle("active",p.id===name));
  $$(".tab").forEach(t=>t.classList.toggle("active",t.dataset.panel===name));
  if(location.hash!=="#"+name) history.replaceState(null,"","#"+name);
  window.scrollTo({top:0,behavior:"smooth"});
  if(name==="servicios") loadPublicData();
  if(name==="admin") checkAdmin();
}
$$("[data-panel]").forEach(b=>b.addEventListener("click",()=>showPanel(b.dataset.panel)));
$("#admin-link").addEventListener("click",e=>{e.preventDefault();showPanel("admin")});
$("#year").textContent=new Date().getFullYear();
function esc(s){return String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
async function loadPublicData(){
  try{
    const d=await api("/api/public-data"); servicesCache=d.services; settingsCache=d.settings;
    const groups={};
    d.services.forEach(s=>(groups[s.category]??=[]).push(s));
    $("#service-public").innerHTML=Object.entries(groups).map(([cat,list])=>`<div class="category">${esc(cat)}</div><div class="service-list">${list.map(s=>`<div class="service"><div><strong>${esc(s.name)}</strong><div class="small">${esc(s.description||"")}</div></div><div class="price">${Number(s.price).toLocaleString("es-ES")} €</div></div>`).join("")}</div>`).join("");
    $("#hours-public").innerHTML=d.settings.hours.map(h=>`<p><strong>${esc(h.day)}:</strong> ${h.enabled&&h.periods.length?h.periods.map(p=>esc(p[0])+"–"+esc(p[1])).join(" y "):"Cerrado"}</p>`).join("");
  }catch(e){$("#service-public").textContent="No se pudieron cargar los servicios. Inténtalo más tarde.";}
}
async function checkAdmin(){
  try{const d=await api("/api/admin/me");csrfToken=d.csrf;$("#login-view").classList.add("hidden");$("#admin-view").classList.remove("hidden");}
  catch(e){$("#login-view").classList.remove("hidden");$("#admin-view").classList.add("hidden");try{await refreshCsrf()}catch(_){}}
}
$("#login-form").addEventListener("submit",async e=>{
  e.preventDefault();$("#login-error").textContent="";
  try{const d=await api("/api/admin/login",{method:"POST",body:JSON.stringify({username:$("#username").value,password:$("#password").value})});csrfToken=d.csrf;$("#password").value="";await checkAdmin();renderAdmin("bookings");}
  catch(err){$("#login-error").textContent=err.message;}
});
$("#logout").addEventListener("click",async()=>{try{await api("/api/admin/logout",{method:"POST",body:"{}"});}catch(_){}csrfToken="";checkAdmin();});
$$("[data-admin-tab]").forEach(b=>b.addEventListener("click",()=>renderAdmin(b.dataset.adminTab)));
function msg(text){return `<p class="status" role="status">${esc(text)}</p>`;}
async function renderAdmin(section){
  const box=$("#admin-content");box.innerHTML="<p>Cargando…</p>";
  try{
    if(section==="services"){
      const list=await api("/api/admin/services");servicesCache=list;
      box.innerHTML=`<h3>Servicios y precios</h3><p class="small">Edita las filas y pulsa Guardar. Los cambios se mostrarán en la web pública.</p><div id="service-editor">${list.map((s,i)=>`<div class="box" style="margin:10px 0"><div class="field"><label>Nombre</label><input data-i="${i}" data-k="name" value="${esc(s.name)}"></div><div class="field"><label>Categoría</label><input data-i="${i}" data-k="category" value="${esc(s.category)}"></div><div class="two"><div class="field"><label>Precio (€)</label><input type="number" min="0" step=".5" data-i="${i}" data-k="price" value="${Number(s.price)}"></div><div class="field"><label>Duración (min)</label><input type="number" min="5" step="5" data-i="${i}" data-k="duration" value="${Number(s.duration)}"></div></div><div class="field"><label>Descripción</label><input data-i="${i}" data-k="description" value="${esc(s.description||"")}"></div><label><input type="checkbox" data-i="${i}" data-k="active" ${s.active?"checked":""}> Visible en la web</label></div>`).join("")}</div><button class="btn primary" id="save-services">Guardar cambios</button><div id="save-msg"></div>`;
      $("#save-services").onclick=async()=>{
        try{
          const updated=servicesCache.map((s,i)=>{const n={...s};$$(`[data-i="${i}"]`,box).forEach(el=>{if(el.dataset.k==="active")n.active=el.checked;else if(["price","duration"].includes(el.dataset.k))n[el.dataset.k]=Number(el.value);else n[el.dataset.k]=el.value;});return n;});
          const d=await api("/api/admin/services",{method:"PUT",body:JSON.stringify(updated)});servicesCache=d.services;$("#save-msg").innerHTML=msg("Servicios guardados correctamente.");loadPublicData();
        }catch(e){$("#save-msg").innerHTML=msg(e.message);}
      };
    } else if(section==="hours"){
      const d=await api("/api/admin/settings");settingsCache=d;
      box.innerHTML=`<h3>Horarios de apertura</h3><p class="small">Desmarca los días cerrados y ajusta los tramos. Este horario se muestra en la web; comprueba que coincida con las reglas de disponibilidad de Google Calendar.</p><div id="hours-editor">${d.hours.map((h,i)=>`<div class="box" style="margin:9px 0"><label><input type="checkbox" data-day="${i}" data-field="enabled" ${h.enabled?"checked":""}> <strong>${esc(h.day)}</strong></label><div class="two">${[0,1].map(j=>`<div class="field"><label>Tramo ${j+1} inicio</label><input type="time" data-day="${i}" data-period="${j}" data-end="0" value="${h.periods[j]?.[0]||""}"></div><div class="field"><label>Tramo ${j+1} fin</label><input type="time" data-day="${i}" data-period="${j}" data-end="1" value="${h.periods[j]?.[1]||""}"></div>`).join("")}</div></div>`).join("")}</div><button class="btn primary" id="save-hours">Guardar horario</button><div id="hours-msg"></div>`;
      $("#save-hours").onclick=async()=>{
        try{
          const hours=d.hours.map((h,i)=>{const enabled=$(`[data-day="${i}"][data-field="enabled"]`,box).checked;const periods=[];for(let j=0;j<2;j++){const a=$(`[data-day="${i}"][data-period="${j}"][data-end="0"]`,box).value,b=$(`[data-day="${i}"][data-period="${j}"][data-end="1"]`,box).value;if(a&&b)periods.push([a,b]);}return {...h,enabled,periods:enabled?periods:[]};});
          const out=await api("/api/admin/settings",{method:"PUT",body:JSON.stringify({hours,slotMinutes:d.slotMinutes})});$("#hours-msg").innerHTML=msg("Horario guardado.");loadPublicData();
        }catch(e){$("#hours-msg").innerHTML=msg(e.message);}
      };
    } else {
      const now=new Date(),to=new Date(Date.now()+14*86400000);
      const d=await api(`/api/admin/events?from=${encodeURIComponent(now.toISOString())}&to=${encodeURIComponent(to.toISOString())}`);
      box.innerHTML=`<h3>Reservas de Google Calendar</h3><p class="small">Próximos 14 días. Los cambios hechos aquí se envían a Google Calendar.</p>${d.length?`<div style="overflow:auto"><table class="table"><thead><tr><th>Fecha</th><th>Cita</th><th>Acción</th></tr></thead><tbody>${d.map(ev=>`<tr><td>${esc(new Date(ev.start).toLocaleString("es-ES",{dateStyle:"short",timeStyle:ev.start.includes("T")?"short":undefined}))}</td><td><strong>${esc(ev.summary)}</strong><div class="small">${esc(ev.description)}</div></td><td>${ev.status!=="cancelled"?`<button class="btn secondary" data-cancel="${esc(ev.id)}">Cancelar</button>`:"Cancelada"}</td></tr>`).join("")}</tbody></table></div>`:"<p>No se encontraron citas en el intervalo consultado."}<div id="booking-msg"></div>`;
      $$("[data-cancel]",box).forEach(b=>b.addEventListener("click",async()=>{if(!confirm("¿Cancelar esta cita en Google Calendar?"))return;try{await api("/api/admin/events/"+encodeURIComponent(b.dataset.cancel),{method:"PATCH",body:JSON.stringify({status:"cancelled"})});renderAdmin("bookings");}catch(e){$("#booking-msg").innerHTML=msg(e.message);}}));
    }
  }catch(e){box.innerHTML=`<h3>Administración</h3>${msg(e.message)}<p class="small">Si el error aparece en Reservas, hay que terminar la conexión de Google Calendar en el servidor.</p>`;}
}
loadPublicData();
const initial=location.hash.slice(1);if(initial==="admin")showPanel("admin");else if(["servicios","reservas","contacto"].includes(initial))showPanel(initial);
