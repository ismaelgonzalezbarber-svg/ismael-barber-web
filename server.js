require("dotenv").config();
const express = require("express");
const session = require("express-session");
const SQLiteStore = require("connect-sqlite3")(session);
const bcrypt = require("bcryptjs");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const { google } = require("googleapis");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const app = express();
const ROOT = __dirname;
const DATA = path.join(ROOT, "data");
const PORT = Number(process.env.PORT || 3000);
const isProd = process.env.NODE_ENV === "production";
const readJson = (name) => JSON.parse(fs.readFileSync(path.join(DATA, name), "utf8"));
const writeJson = (name, value) => fs.writeFileSync(path.join(DATA, name), JSON.stringify(value, null, 2) + "\n", "utf8");

if (!process.env.SESSION_SECRET || process.env.SESSION_SECRET.length < 32) {
  console.warn("AVISO: configura SESSION_SECRET con al menos 32 caracteres en .env");
}
app.set("trust proxy", isProd ? 1 : false);
app.use(helmet({ contentSecurityPolicy: {
  directives: {
    defaultSrc: ["'self'"], scriptSrc: ["'self'"], styleSrc: ["'self'"],
    imgSrc: ["'self'", "data:"], connectSrc: ["'self'"],
    objectSrc: ["'none'"], frameAncestors: ["'none'"], upgradeInsecureRequests: isProd ? [] : null
  }
}}));
app.use(express.json({limit:"100kb"}));
app.use(express.urlencoded({extended:false, limit:"20kb"}));
app.use(session({
  name: "ismael.sid",
  store: new SQLiteStore({ db: "sessions.sqlite", dir: DATA, concurrentDB: true }),
  secret: process.env.SESSION_SECRET || "development-only-change-this-secret-now",
  resave: false, saveUninitialized: false,
  cookie: { httpOnly:true, sameSite:"lax", secure:isProd, maxAge: 8*60*60*1000 }
}));

const loginLimiter = rateLimit({windowMs:15*60*1000, limit:8, standardHeaders:true, legacyHeaders:false,
  message:{error:"Demasiados intentos. Espera unos minutos e inténtalo de nuevo."}});
function requireAdmin(req,res,next){ if(!req.session?.admin) return res.status(401).json({error:"Debes iniciar sesión."}); next(); }
function csrf(req,res,next){
  if (["GET","HEAD","OPTIONS"].includes(req.method)) return next();
  const sent=req.get("x-csrf-token");
  if (!req.session?.csrf || !sent || !crypto.timingSafeEqual(Buffer.from(String(sent)),Buffer.from(String(req.session.csrf)))) {
    return res.status(403).json({error:"La sesión ha caducado. Recarga la página e inténtalo de nuevo."});
  }
  next();
}
app.use("/api", csrf);

let oauthClient;
function googleCalendar(){
  const required=["GOOGLE_CLIENT_ID","GOOGLE_CLIENT_SECRET","GOOGLE_REDIRECT_URI","GOOGLE_REFRESH_TOKEN"];
  if(required.some(k=>!process.env[k])) throw new Error("Falta configurar la conexión OAuth2 de Google Calendar en .env.");
  if(!oauthClient){
    oauthClient = new google.auth.OAuth2(process.env.GOOGLE_CLIENT_ID,process.env.GOOGLE_CLIENT_SECRET,process.env.GOOGLE_REDIRECT_URI);
    oauthClient.setCredentials({refresh_token:process.env.GOOGLE_REFRESH_TOKEN});
  }
  return google.calendar({version:"v3",auth:oauthClient});
}
function calendarId(){return process.env.GOOGLE_CALENDAR_ID || "primary";}

app.get("/api/csrf",(req,res)=>{req.session.csrf=crypto.randomBytes(32).toString("hex");res.json({token:req.session.csrf});});
app.get("/api/public-data",(req,res)=>{
  const settings=readJson("settings.json");
  res.json({settings,services:readJson("services.json").filter(s=>s.active)});
});
app.post("/api/admin/login",loginLimiter,async(req,res)=>{
  const {username,password}=req.body||{};
  if(!process.env.ADMIN_USERNAME || !process.env.ADMIN_PASSWORD_HASH) return res.status(503).json({error:"Falta configurar el usuario administrador en .env."});
  const validUser=typeof username==="string" && username===process.env.ADMIN_USERNAME;
  const validPass=typeof password==="string" && await bcrypt.compare(password,process.env.ADMIN_PASSWORD_HASH);
  if(!validUser || !validPass) return res.status(401).json({error:"Usuario o contraseña incorrectos."});
  req.session.regenerate(err=>{
    if(err) return res.status(500).json({error:"No se pudo iniciar sesión."});
    req.session.admin=true; req.session.csrf=crypto.randomBytes(32).toString("hex");
    req.session.save(err2=>err2?res.status(500).json({error:"No se pudo guardar la sesión."}):res.json({ok:true,csrf:req.session.csrf}));
  });
});
app.get("/api/admin/me",requireAdmin,(req,res)=>res.json({ok:true,csrf:req.session.csrf}));
app.post("/api/admin/logout",requireAdmin,(req,res)=>req.session.destroy(()=>res.clearCookie("ismael.sid").json({ok:true})));

app.get("/api/admin/services",requireAdmin,(req,res)=>res.json(readJson("services.json")));
app.put("/api/admin/services",requireAdmin,(req,res)=>{
  const items=req.body;
  if(!Array.isArray(items) || items.length>100) return res.status(400).json({error:"Lista de servicios no válida."});
  const ids=new Set();
  for(const s of items){
    if(!s || typeof s.id!=="string" || !/^[a-z0-9-]{1,80}$/.test(s.id) || ids.has(s.id) ||
       typeof s.name!=="string" || !s.name.trim() || s.name.length>100 ||
       typeof s.category!=="string" || s.category.length>80 ||
       !Number.isFinite(Number(s.price)) || Number(s.price)<0 || Number(s.price)>10000 ||
       !Number.isFinite(Number(s.duration)) || Number(s.duration)<5 || Number(s.duration)>600 ||
       typeof s.active!=="boolean") return res.status(400).json({error:"Revisa nombres, categorías, precios, duración e identificadores."});
    ids.add(s.id);
  }
  writeJson("services.json",items); res.json({ok:true,services:items});
});
app.get("/api/admin/settings",requireAdmin,(req,res)=>res.json(readJson("settings.json")));
app.put("/api/admin/settings",requireAdmin,(req,res)=>{
  const old=readJson("settings.json"), body=req.body||{};
  if(!Array.isArray(body.hours) || body.hours.length!==7) return res.status(400).json({error:"Debe indicarse el horario de los siete días."});
  for(const day of body.hours){
    if(typeof day.day!=="string" || typeof day.enabled!=="boolean" || !Array.isArray(day.periods) || day.periods.length>3) return res.status(400).json({error:"Horario no válido."});
    for(const p of day.periods){
      if(!Array.isArray(p)||p.length!==2||!/^([01]\d|2[0-3]):[0-5]\d$/.test(p[0])||!/^([01]\d|2[0-3]):[0-5]\d$/.test(p[1])||p[0]>=p[1]) return res.status(400).json({error:"Revisa los tramos horarios."});
    }
  }
  const next={...old,hours:body.hours,slotMinutes:Math.max(10,Math.min(120,Number(body.slotMinutes)||30))};
  writeJson("settings.json",next); res.json({ok:true,settings:next});
});
app.get("/api/admin/events",requireAdmin,async(req,res)=>{
  try{
    const timeMin=new Date(req.query.from || Date.now()).toISOString();
    const timeMax=new Date(req.query.to || Date.now()+14*86400000).toISOString();
    const cal=googleCalendar();
    const result=await cal.events.list({calendarId:calendarId(),timeMin,timeMax,singleEvents:true,orderBy:"startTime",maxResults:250});
    res.json((result.data.items||[]).map(e=>({id:e.id,summary:e.summary||"(Sin título)",start:e.start?.dateTime||e.start?.date,end:e.end?.dateTime||e.end?.date,status:e.status,description:e.description||""})));
  }catch(e){console.error("Google Calendar events.list:",e.message);res.status(502).json({error:"No se pudieron cargar las reservas de Google Calendar. Revisa la conexión de Google."});}
});
app.patch("/api/admin/events/:id",requireAdmin,async(req,res)=>{
  const {summary,description,start,end,status}=req.body||{};
  const patch={};
  if(typeof summary==="string") patch.summary=summary.slice(0,200);
  if(typeof description==="string") patch.description=description.slice(0,2000);
  if(status==="cancelled") patch.status="cancelled";
  if(start && end){
    const s=new Date(start),e=new Date(end);
    if(!Number.isFinite(+s)||!Number.isFinite(+e)||e<=s) return res.status(400).json({error:"Fecha u hora no válida."});
    patch.start={dateTime:s.toISOString(),timeZone:process.env.TIMEZONE||"Europe/Madrid"};
    patch.end={dateTime:e.toISOString(),timeZone:process.env.TIMEZONE||"Europe/Madrid"};
  }
  try{const out=await googleCalendar().events.patch({calendarId:calendarId(),eventId:req.params.id,requestBody:patch});res.json({ok:true,id:out.data.id});}
  catch(e){console.error("Google Calendar events.patch:",e.message);res.status(502).json({error:"No se pudo actualizar la cita en Google Calendar."});}
});
app.get("/auth/google/start",requireAdmin,(req,res)=>{
  try{
    const client=new google.auth.OAuth2(process.env.GOOGLE_CLIENT_ID,process.env.GOOGLE_CLIENT_SECRET,process.env.GOOGLE_REDIRECT_URI);
    const url=client.generateAuthUrl({access_type:"offline",prompt:"consent",scope:["https://www.googleapis.com/auth/calendar"]});
    res.json({url});
  }catch(e){res.status(503).json({error:"Configura primero las credenciales OAuth de Google."});}
});
app.get("/auth/google/callback",(req,res)=>res.status(501).send("El token de Google se configura en el entorno privado del servidor siguiendo el README. No pegues credenciales en esta página."));

app.use(express.static(path.join(ROOT,"public")));
app.get("*",(req,res)=>res.sendFile(path.join(ROOT,"public","index.html")));
app.listen(PORT,()=>console.log(`Web de Ismael disponible en http://localhost:${PORT}`));
