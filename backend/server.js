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

const response = await fetch(
`https://opensheet.elk.sh/1WISk42O7lMEAJzpHyRV938k71vP7eybS3MxEyxagpcc/Inventario`
)

const inventario = await response.json()

console.log("INVENTARIO:", inventario)

if(!Array.isArray(inventario)){
return res.json([])
}

const productos = inventario.map(row=>({

nombre: String(row.nombre || "").trim(),

precio: Number(
String(row.precio || "0")
.replace(/\$/g,"")
.replace(/\./g,"")
.replace(/,/g,"")
.trim()
) || 0,

stock: Number(row.stock || 0),

vendido: Number(row.vendido || 0),

restante: Number(row.restante || 0),

codigo: String(row.codigo || "").trim()

}))
.filter(p => p.nombre !== "")

res.json(productos)

}catch(error){

console.log("ERROR PRODUCTOS:", error)

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

const {nombre} = req.body

if(!nombre){
return res.json({ok:false})
}

const response = await fetch(
`https://opensheet.elk.sh/1WISk42O7lMEAJzpHyRV938k71vP7eybS3MxEyxagpcc/Mesas`
)

const mesas = await response.json()

const existe = mesas.some(m =>
String(m.nombre || "")
.trim()
.toLowerCase()
===
nombre.trim().toLowerCase()
)

if(existe){

return res.json({
ok:false,
mensaje:"Mesa ya existe"
})

}

await sheets.spreadsheets.values.append({

spreadsheetId:
"1WISk42O7lMEAJzpHyRV938k71vP7eybS3MxEyxagpcc",

range:"Mesas!A:A",

valueInputOption:"USER_ENTERED",

requestBody:{
values:[[nombre]]
}

})

res.json({ok:true})

}catch(error){

console.log("ERROR AGREGAR MESA:", error)

res.json({
ok:false,
error:error.toString()
})

}

})
app.post("/obtenerMesas", async (req, res) => {

try{

const sheetID = "1WISk42O7lMEAJzpHyRV938k71vP7eybS3MxEyxagpcc"

/* 🔥 TRAER MESAS */
const urlMesas =
`https://opensheet.elk.sh/${sheetID}/Mesas`

/* 🔥 TRAER VENTAS */
const urlVentas =
`https://opensheet.elk.sh/${sheetID}/Ventas`

const [mesasRes, ventasRes] = await Promise.all([
fetch(urlMesas),
fetch(urlVentas)
])

const mesasData = await mesasRes.json()
const ventasData = await ventasRes.json()

/* 🔥 ARMAR LISTA */
let lista = []

mesasData.forEach(m=>{

let nombre = String(m.Nombre || "").trim()

if(!nombre) return

/* 🔥 CALCULAR TOTAL */
let total = 0

ventasData.forEach(v=>{

let mesaVenta = String(
v.Mesa ||
v.mesa ||
v.Cuenta ||
v.cuenta ||
""
).trim()

const estado = String(
v.Estado ||
v.estado ||
""
).trim().toUpperCase()

if(
mesaVenta === nombre &&
estado !== "PAGADO"
){

let totalVenta = Number(
String(v.total || v.Total || 0)
.replace(/[^0-9]/g,"")
) || 0

total += totalVenta

}

})

lista.push({
nombre,
total
})


})

res.json(lista)

}catch(error){

console.log("ERROR OBTENER MESAS:", error)

res.json([])

}

})

app.post("/crearMesa", async (req, res) => {

try{

const { nombre } = req.body

if(!nombre){

return res.json({
ok:false,
error:"Nombre requerido"
})

}

const auth = new google.auth.GoogleAuth({
credentials: credenciales,
scopes:["https://www.googleapis.com/auth/spreadsheets"]
})

const sheets = google.sheets({
version:"v4",
auth
})

const spreadsheetId = "1WISk42O7lMEAJzpHyRV938k71vP7eybS3MxEyxagpcc"

await sheets.spreadsheets.values.append({

spreadsheetId,

range:"MESAS!A:A",

valueInputOption:"USER_ENTERED",

requestBody:{
values:[
[nombre]
]
}

})

res.json({
ok:true
})

}catch(error){

console.log("ERROR CREAR MESA:", error)

res.json({
ok:false,
error:String(error)
})

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

      let mesa = (
row.Mesa ||
row.mesa ||
row.Cuenta ||
row.cuenta ||
""
).toString().trim()
      let total = Number(
      String(row.total || row.Total || 0)
      .replace(/[^0-9]/g,"")
      ) || 0

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

// ==========================
// OBTENER CUENTA MESA
// ==========================
// ==========================
// OBTENER CUENTA MESA
// ==========================
app.post("/obtenerCuentaMesa", async (req,res)=>{

try{

const { mesa } = req.body

const response = await fetch(
"https://opensheet.elk.sh/1WISk42O7lMEAJzpHyRV938k71vP7eybS3MxEyxagpcc/Ventas"
)

const data = await response.json()

if(!Array.isArray(data)){
return res.json([])
}

const cuenta = data
.filter(row => {

const mesaRow = String(
row.Mesa ||
row.mesa ||
row.Cuenta ||
row.cuenta ||
""
).trim()

const estado = String(
row.Estado ||
row.estado ||
""
).trim().toUpperCase()

return (
mesaRow === mesa &&
estado !== "PAGADO"
)

})
.map(row => {

const precio = Number(
String(
row.Precio ||
row.precio ||
0
)
.replace(/[^0-9]/g,"")
) || 0

const cantidad = Number(
row.Cantidad ||
row.cantidad ||
0
)

const totalSheet = Number(
String(
row.total ||
row.Total ||
0
)
.replace(/[^0-9]/g,"")
) || 0

const total =
totalSheet > 0
? totalSheet
: precio * cantidad

return {

nombre: String(
row.Nombre ||
row.nombre ||
""
).trim(),

precio,

cantidad,

total

}

})

console.log("CUENTA:", cuenta)

res.json(cuenta)

}catch(error){

console.log("ERROR CUENTA:", error)

res.json([])

}

})

// ==========================
// CERRAR / PAGAR MESA
// ==========================
app.post("/cerrarMesa", async (req,res)=>{

try{

const { cuenta, metodo } = req.body

if(!cuenta){

return res.status(400).json({
ok:false,
error:"Cuenta requerida"
})

}

const response = await fetch(
"https://opensheet.elk.sh/1WISk42O7lMEAJzpHyRV938k71vP7eybS3MxEyxagpcc/Ventas"
)

const data = await response.json()

if(!Array.isArray(data)){

return res.json({
ok:false,
error:"No hay ventas"
})

}

/* FILAS A PAGAR */
const filas = []

data.forEach((row,index)=>{

const mesaRow = String(
row.Mesa ||
row.mesa ||
""
).trim()

const estado = String(
row.Estado ||
row.estado ||
""
).trim().toUpperCase()

if(
mesaRow === cuenta &&
estado !== "PAGADO"
){

filas.push(index + 2)

}

})

/* SI NO HAY FILAS */
if(filas.length === 0){

return res.json({
ok:true
})

}

/* ACTUALIZAR GOOGLE SHEETS */
for(const fila of filas){

await sheets.spreadsheets.values.update({

spreadsheetId:
"1WISk42O7lMEAJzpHyRV938k71vP7eybS3MxEyxagpcc",

range:`Ventas!G${fila}:H${fila}`,

valueInputOption:"USER_ENTERED",

requestBody:{
values:[[
"PAGADO",
metodo || "Efectivo"
]]
}

})
}
/* ==========================
ELIMINAR MESA DE SHEET MESAS
========================== */

const mesasResponse = await sheets.spreadsheets.values.get({

spreadsheetId:
"1WISk42O7lMEAJzpHyRV938k71vP7eybS3MxEyxagpcc",

range:"Mesas!A:A"

})

const mesasRows = mesasResponse.data.values || []

let filaMesa = -1

mesasRows.forEach((row,index)=>{

const nombreMesa = String(row[0] || "")
.trim()

if(
nombreMesa.toLowerCase() ===
cuenta.toLowerCase()
){
filaMesa = index + 1
}

})

if(filaMesa > 1){

await sheets.spreadsheets.batchUpdate({

spreadsheetId:
"1WISk42O7lMEAJzpHyRV938k71vP7eybS3MxEyxagpcc",

requestBody:{
requests:[{
deleteDimension:{
range:{
sheetId:0,
dimension:"ROWS",
startIndex:filaMesa-1,
endIndex:filaMesa
}
}
}]
}

})

}

res.json({
ok:true
})

}catch(error){

console.log("ERROR CERRAR MESA:", error)

res.status(500).json({
ok:false,
error:String(error)
})

}

})

const PORT = process.env.PORT || 3000

app.listen(PORT, ()=>{
console.log("Servidor corriendo en " + PORT)
})
