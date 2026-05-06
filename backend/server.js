const express = require("express")
const cors = require("cors")
const app = express()
const { google } = require("googleapis")

let credenciales = {}

try{
credenciales = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT || "{}")
}catch(e){
console.log("ERROR VARIABLE GOOGLE:", e)
}

const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: credenciales.client_email,
    private_key: credenciales.private_key
  },
  scopes: ["https://www.googleapis.com/auth/spreadsheets"]
})

const sheets = google.sheets({
  version: "v4",
  auth
})

app.set("trust proxy", 1)

/* 🔥 CORS PROFESIONAL (SOLUCIÓN REAL) */
app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}))

/* 🔥 HEADERS MANUALES EXTRA (POR SI RAILWAY BLOQUEA) */
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*")
  res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization")

  if (req.method === "OPTIONS") {
    return res.status(200).end()
  }

  next()
})

app.use(express.json())

// ==========================
// LOGIN
// ==========================
app.post("/login", (req,res)=>{

const {usuario,clave} = req.body

if(usuario === "admin" && clave === "1234"){
return res.json({
ok:true,
usuario:"admin",
rol:"admin"
})
}

res.json({ok:false})

})

// ==========================
// ROOT
// ==========================
app.get("/", (req,res)=>{
console.log("PING ROOT")
res.status(200).send("Backend activo 🚀")
})

// ==========================
// DASHBOARD (CON GOOGLE SHEETS)
// ==========================

app.post("/inicializarSistema", async (req, res) => {
  try {

    const sheetID = "1WISk42O7lMEAJzpHyRV938k71vP7eybS3MxEyxagpcc"

    const urlProductos = `https://opensheet.elk.sh/${sheetID}/Inventario`
    const urlMesas = `https://opensheet.elk.sh/${sheetID}/Mesas`

    const [prodRes, mesasRes] = await Promise.all([
      fetch(urlProductos),
      fetch(urlMesas)
    ])

    const productos = await prodRes.json()
    const mesasData = await mesasRes.json()

    // 🔥 LIMPIAR
    let listaProductos = productos.map(p => ({
      nombre: (p.Producto || "").trim(),
      precio: Number(p.Precio || 0),
      stock: Number(p.Stock || 0),
      vendido: Number(p.Vendido || 0),
      restante: Number(p.Restante || 0)
    }))

    let lista = data.map(m => (m.Nombre || "").trim())

    res.json({
      ok: true,
      productos: listaProductos,
      mesas: listaMesas
    })

  } catch (error) {
    console.log("ERROR INIT:", error)
    res.json({ ok:false })
  }
})

app.post("/dashboard", async (req, res) => {
  try {

    const sheetID = "1WISk42O7lMEAJzpHyRV938k71vP7eybS3MxEyxagpcc"

    const urlVentas = `https://opensheet.elk.sh/${sheetID}/Ventas`
    const urlInventario = `https://opensheet.elk.sh/${sheetID}/Inventario`

    const [ventasRes, inventarioRes] = await Promise.all([
      fetch(urlVentas),
      fetch(urlInventario)
    ])

    const inventario = await invRes.json()
    const ventas = await venRes.json()

    /* 🔥 VALIDAR ARRAY */
    if(!Array.isArray(inventario)){
    console.log("Inventario inválido:", inventario)
    return res.json([])
    }

    let totalDia = 0
    let productos = {}

    ventas.forEach(row => {

      let producto = (row.Nombre || "").trim()

      let total = Number(
      String(row.Total || row.total || 0)
      .replace(/[^0-9]/g,"")
      ) || 0

      if(!producto) return

      totalDia += total

      if(!productos[producto]){
      productos[producto] = 0
      }

      productos[producto] += total

      })

    let productoTop = "-"

    if (Object.keys(productos).length > 0) {
      productoTop = Object.keys(productos).reduce((a, b) =>
        productos[a] > productos[b] ? a : b
      )
    }

    res.json({
      ok: true,
      totalDia,
      productoTop,
      inventario
    })

  } catch (error) {
    console.log("ERROR DASHBOARD:", error)
    res.json({ ok: false, error: error.toString() })
  }
})

// ==========================
// DEMÁS ENDPOINTS (NO TOCADOS)
// ==========================
app.post("/obtenerProductos", async (req,res)=>{

try{

const sheetID = "1WISk42O7lMEAJzpHyRV938k71vP7eybS3MxEyxagpcc"

const urlInventario = `https://opensheet.elk.sh/${sheetID}/Inventario`
const urlVentas = `https://opensheet.elk.sh/${sheetID}/Ventas`

const [invRes, venRes] = await Promise.all([
fetch(urlInventario),
fetch(urlVentas)
])

const inventario = await invRes.json()
const ventas = await venRes.json()

/* 🔥 MAPA DE VENTAS */
let vendidos = {}

ventas.forEach(row=>{

let nombre = (row.Nombre || "").trim()
let cantidad = Number(row.Cantidad || 0)

if(!nombre) return

if(!vendidos[nombre]){
vendidos[nombre] = 0
}

vendidos[nombre] += cantidad

})


  
/* 🔥 RESULTADO FINAL */
let resultado = inventario.map(p=>{

let nombre = (p.Producto || "").trim()

let precio = Number(
String(p.Precio || 0)
.replace(/[^0-9]/g,"")
) || 0

let stock = Number(p.Cantidad || 0)

let vendido = vendidos[nombre] || 0

let restante = stock - vendido

return {
nombre,
precio,
stock,
vendido,
restante
}

})

res.json(resultado)

}catch(e){
console.log("ERROR INVENTARIO:", e)
res.json([])
}

})

app.post("/obtenerResumenMesas", async (req,res)=>{

try{

const sheetID = "1WISk42O7lMEAJzpHyRV938k71vP7eybS3MxEyxagpcc"
const url = `https://opensheet.elk.sh/${sheetID}/Ventas`

const response = await fetch(url)
const data = await response.json()

let resumen = {}

data.forEach(row=>{
let mesa = (row.Mesa || row.mesa || "").trim()
let precio = Number(
String(row.Precio || 0).replace(/[^0-9]/g,"")
) || 0

let cantidad = Number(row.Cantidad || 0)

let total = precio * cantidad

if(!resumen[mesa]) resumen[mesa] = 0
resumen[mesa] += total
})

res.json(resumen)

}catch(err){
res.json({ok:false,error:err.toString()})
}

})

app.post("/datosGraficos", async (req,res)=>{

try{

const sheetID = "1WISk42O7lMEAJzpHyRV938k71vP7eybS3MxEyxagpcc"
const url = `https://opensheet.elk.sh/${sheetID}/Ventas`

const r = await fetch(url)
const data = await r.json()

let productos = {}
let mesas = {}
let fechas = {}

data.forEach(row=>{

// 🔥 CAMPOS CORRECTOS DEL SHEET
let producto = (row.Nombre || "").trim()
let mesa = (row.Mesa || "").trim()
let fecha = (row.Fecha || "").split(" ")[0]

// 🔥 LIMPIAR PRECIO ($ y ,)
let precio = Number(
String(row.Precio || 0).replace(/[^0-9]/g,"")
)

let cantidad = Number(row.Cantidad || 0)

// 🔥 CALCULAR TOTAL
let total = precio * cantidad

if(!producto || total <= 0) return

// =====================
// PRODUCTOS
// =====================
if(!productos[producto]) productos[producto]=0
productos[producto]+=total

// =====================
// MESAS
// =====================
if(mesa){

if(!mesas[mesa]) mesas[mesa]=0
mesas[mesa]+=total

}

// =====================
// FECHAS
// =====================
if(fecha){

if(!fechas[fecha]) fechas[fecha]=0
fechas[fecha]+=total

}

})

res.json({
productos,
mesas,
fechas
})

}catch(e){
console.log("ERROR GRAFICOS:", e)
res.json({
productos:{},
mesas:{},
fechas:{}
})
}

})

app.post("/comparacionSemanas", async (req,res)=>{

try{

const sheetID = "1WISk42O7lMEAJzpHyRV938k71vP7eybS3MxEyxagpcc"
const url = `https://opensheet.elk.sh/${sheetID}/Ventas`

const response = await fetch(url)
const data = await response.json()

let actual = {}
let anterior = {}

data.forEach(row=>{
let total = Number(row.Total || row.total || 0)
let fecha = new Date(row.Fecha || row.fecha)
let dia = fecha.toLocaleDateString("es-CO",{weekday:"long"})

let hoy = new Date()
let diff = (hoy - fecha) / (1000*60*60*24)

if(diff <= 7){
actual[dia] = (actual[dia] || 0) + total
}else if(diff <= 14){
anterior[dia] = (anterior[dia] || 0) + total
}
})

res.json({actual, anterior})

}catch(err){
res.json({ok:false,error:err.toString()})
}

})

app.post("/ventasPorMetodoPago", async (req,res)=>{

try{

const sheetID = "1WISk42O7lMEAJzpHyRV938k71vP7eybS3MxEyxagpcc"

const url = `https://opensheet.elk.sh/${sheetID}/Ventas`

const response = await fetch(url)
const data = await response.json()

let metodos = {}

data.forEach(row=>{

let metodo = (row["Metodo de Pago"] || "").trim()
let total = Number(String(row.Total || 0).replace(/[^0-9.-]+/g,""))

if(!metodo) return

if(!metodos[metodo]){
metodos[metodo] = 0
}

metodos[metodo] += total

})

res.json(metodos)

}catch(e){
console.log("ERROR METODOS:", e)
res.json({})
}

})

app.post("/obtenerInversiones", async (req,res)=>{

try{

const sheetID = "1WISk42O7lMEAJzpHyRV938k71vP7eybS3MxEyxagpcc"
const url = `https://opensheet.elk.sh/${sheetID}/Inversiones`

const response = await fetch(url)
const data = await response.json()

res.json(data)

}catch(err){
res.json({ok:false,error:err.toString()})
}

})

app.post("/cierreDeCaja", async (req, res) => {
  try {

    const sheetID = "1WISk42O7lMEAJzpHyRV938k71vP7eybS3MxEyxagpcc"
    const url = `https://opensheet.elk.sh/${sheetID}/Ventas`

    const response = await fetch(url)
    const data = await response.json()

    let total = 0
    let efectivo = 0
    let nequi = 0
    let daviplata = 0
    let transferencia = 0

    data.forEach(row => {

      let metodo = (row["Metodo de Pago"] || "").trim()
      let valor = Number((row.Total || 0).toString().trim()) || 0

      total += valor

      if (metodo.includes("efectivo")) efectivo += valor
      if (metodo.includes("nequi")) nequi += valor
      if (metodo.includes("davi")) daviplata += valor
      if (metodo.includes("trans")) transferencia += valor
    })

    res.json({
      total,
      efectivo,
      nequi,
      daviplata,
      transferencia
    })

  } catch (error) {
    res.json({
      total: 0,
      efectivo: 0,
      nequi: 0,
      daviplata: 0,
      transferencia: 0
    })
  }
})

let mesas = []
let consumos = {}

// ==========================
// MESAS
// ==========================
app.post("/agregarMesa", async (req,res)=>{

try{

const nombre = String(req.body.nombre || "").trim()

if(!nombre){
return res.json({ok:false,error:"Mesa vacía"})
}

const spreadsheetId = "1WISk42O7lMEAJzpHyRV938k71vP7eybS3MxEyxagpcc"

/* LEER MESAS EXISTENTES */
const lectura = await sheets.spreadsheets.values.get({
spreadsheetId,
range: "Mesas!A:A"
})

const filas = lectura.data.values || []
const existe = filas.some(f=>
String(f[0] || "").trim().toLowerCase() === nombre.toLowerCase()
)

if(existe){
return res.json({
ok:false,
error:"La mesa ya existe"
})
}

/* AGREGAR NUEVA MESA */
await sheets.spreadsheets.values.append({
spreadsheetId,
range: "Mesas!A:A",
valueInputOption: "USER_ENTERED",
requestBody: {
values: [[nombre]]
}
})

/* MEMORIA LOCAL */
if(!mesas.includes(nombre)){
mesas.push(nombre)
}

if(!consumos[nombre]){
consumos[nombre] = 0
}

res.json({
ok:true,
nombre
})

}catch(e){

console.log("ERROR AGREGAR MESA:",e)
res.json({
ok:false,
error:e.toString()
})

}

})
app.post("/obtenerMesas", async (req, res) => {

try{

const sheetID = "1WISk42O7lMEAJzpHyRV938k71vP7eybS3MxEyxagpcc"

const url = `https://opensheet.elk.sh/${sheetID}/Mesas`

const response = await fetch(url)
const data = await response.json()

/* 🔥 MESAS DEL SHEET */
let listaSheet = []

if(Array.isArray(data)){

listaSheet = data.map(m=>
String(m.Nombre || "").trim()
).filter(Boolean)

}

/* 🔥 UNIR CON MESAS TEMPORALES */
let todas = [...new Set([
...listaSheet,
...mesas
])]

res.json(todas)

}catch(error){

console.log("ERROR OBTENER MESAS:",error)

res.json(mesas)

}

})

app.post("/mesasConConsumo", async (req, res) => {
  try {

    const sheetID = "1WISk42O7lMEAJzpHyRV938k71vP7eybS3MxEyxagpcc"
    const url = `https://opensheet.elk.sh/${sheetID}/Ventas`

    const response = await fetch(url)
    const data = await response.json()

    let mesas = {}

    data.forEach(row => {
      let mesa = (row.Mesa || row.mesa || "").toString().trim()
      let precio = Number(
      String(row.Precio || 0).replace(/[^0-9]/g,"")
      ) || 0

      let cantidad = Number(row.Cantidad || 0)

      let total = precio * cantidad

      if (mesa && total > 0) {
        mesas[mesa] = true
      }
    })

    res.json(mesas)

  } catch (error) {
    res.json({})
  }
})

app.post("/totalesPorMesa", async (req, res) => {
  try {

    const sheetID = "1WISk42O7lMEAJzpHyRV938k71vP7eybS3MxEyxagpcc"
    const url = `https://opensheet.elk.sh/${sheetID}/Ventas`

    const response = await fetch(url)
    const data = await response.json()

    let totales = {}

    data.forEach(row => {

      let mesa = (row.Mesa || row.mesa || "").toString().trim()
      let precio = Number(
      String(row.Precio || 0).replace(/[^0-9]/g,"")
      ) || 0

      let cantidad = Number(row.Cantidad || 0)

      let total = precio * cantidad

      if (!mesa) return

      if (!totales[mesa]) {
        totales[mesa] = 0
      }

      totales[mesa] += total
    })

    res.json(totales)

  } catch (error) {
    res.json({})
  }
})

// ==========================
// PORT
// ==========================
app.post("/registrarVenta", async (req,res)=>{

try{

const {
cuenta,
nombre,
precio,
cantidad
} = req.body

const total = Number(precio) * Number(cantidad)

const fecha = new Date().toLocaleDateString("es-CO")

await sheets.spreadsheets.values.append({

spreadsheetId:"1WISk42O7lMEAJzpHyRV938k71vP7eybS3MxEyxagpcc",

range:"Ventas!A:G",

valueInputOption:"USER_ENTERED",

requestBody:{
values:[[
fecha,
cuenta,
nombre,
precio,
cantidad,
total,
"Pendiente"
]]
}

})

res.json({ok:true})

}catch(e){

console.log("ERROR REGISTRAR:",e)

res.json({
ok:false,
error:e.toString()
})

}

})

const PORT = process.env.PORT || 3000

app.listen(PORT, ()=>{
console.log("Servidor corriendo en " + PORT)
})
