const express = require("express")
const cors = require("cors")
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args))
const app = express()

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
app.post("/dashboard", async (req, res) => {
  try {

    const sheetID = "1WISk42O7lMEAJzpHyRV938k71vP7eybS3MxEyxagpcc"

    const urlVentas = `https://opensheet.elk.sh/${sheetID}/Ventas`
    const urlInventario = `https://opensheet.elk.sh/${sheetID}/Inventario`

    const [ventasRes, inventarioRes] = await Promise.all([
      fetch(urlVentas),
      fetch(urlInventario)
    ])

    const ventas = await ventasRes.json()
    const inventario = await inventarioRes.json()

    let totalDia = 0
    let productos = {}

    ventas.forEach(row => {
      let total = Number(row.Total || row.total || 0)
      let producto = row.Producto || row.producto || "Sin nombre"

      totalDia += total

      if(!productos[producto]){
        productos[producto] = 0
      }

      productos[producto] += total
    })

    let productoTop = "-"

    if(Object.keys(productos).length > 0){
      productoTop = Object.keys(productos).reduce((a,b)=>
        productos[a] > productos[b] ? a : b
      )
    }

    res.json({
      ok:true,
      totalDia,
      productoTop,
      inventario
    })

  } catch (error) {
    console.log("ERROR DASHBOARD:", error)
    res.json({ ok:false, error:error.toString() })
  }
})

// ==========================
// DEMÁS ENDPOINTS (NO TOCADOS)
// ==========================
app.post("/obtenerProductos", async (req,res)=>{
try{

const sheetID = "1WISk42O7lMEAJzpHyRV938k71vP7eybS3MxEyxagpcc"
const url = `https://opensheet.elk.sh/${sheetID}/Inventario`

const response = await fetch(url)
const data = await response.json()

let productos = data.map(p=>{

let stock = Number(p.Stock || p.stock || 0)
let vendido = Number(p.Vendido || p.vendido || 0)

return {
nombre: p.Nombre || p.nombre,
precio: Number(p.Precio || p.precio || 0),
stock,
vendido,
restante: stock - vendido
}

})

res.json(productos)

}catch(err){
res.json({ok:false,error:err.toString()})
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
let mesa = row.Mesa || row.mesa || "Mesa"
let total = Number(row.Total || 0)

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

const response = await fetch(url)
const data = await response.json()

let productos = {}
let fechas = {}
let mesas = {}

data.forEach(row => {

let prod = row.Producto || row.producto || "Sin nombre"
let total = Number(row.Total || row.total || 0)
let fecha = row.Fecha || row.fecha || "Sin fecha"
let mesa = row.Mesa || row.mesa || "Mesa"

if(!productos[prod]) productos[prod] = 0
productos[prod] += total

if(!fechas[fecha]) fechas[fecha] = 0
fechas[fecha] += total

if(!mesas[mesa]) mesas[mesa] = 0
mesas[mesa] += total

})

res.json({
productos,
fechas,
mesas // 🔥 IMPORTANTE
})

}catch(err){
res.json({ok:false,error:err.toString()})
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
let metodo = (row.MetodoPago || row.metodo || "").toLowerCase().trim()
let total = Number(row.Total || 0)

if(!metodos[metodo]) metodos[metodo] = 0
metodos[metodo] += total
})

res.json(metodos)

}catch(err){
res.json({ok:false,error:err.toString()})
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

app.post("/cierreDeCaja", async (req,res)=>{

try{

const sheetID = "1WISk42O7lMEAJzpHyRV938k71vP7eybS3MxEyxagpcc"
const url = `https://opensheet.elk.sh/${sheetID}/Ventas`

const response = await fetch(url)
const data = await response.json()

let total = 0
let metodos = {
efectivo:0,
nequi:0,
daviplata:0,
transferencia:0
}

data.forEach(row=>{
let metodo = (row.MetodoPago || "").toLowerCase()
let valor = Number(row.Total || 0)

total += valor

if(metodos[metodo] !== undefined){
metodos[metodo] += valor
}
})

res.json({
total,
...metodos
})

}catch(err){
res.json({ok:false,error:err.toString()})
}

})

let mesas = []
let consumos = {}

// ==========================
// MESAS
// ==========================
app.post("/agregarMesa",(req,res)=>{

const {nombre} = req.body

if(!nombre){
return res.json({ok:false})
}

mesas.push(nombre)
consumos[nombre] = 0

res.json({ok:true})

})

app.post("/obtenerMesas", async (req,res)=>{

try{

const sheetID = "1WISk42O7lMEAJzpHyRV938k71vP7eybS3MxEyxagpcc"
const url = `https://opensheet.elk.sh/${sheetID}/Mesas`

const response = await fetch(url)
const data = await response.json()

let lista = data.map(row => 
  row.Nombre || row.nombre || row.Mesa || row.mesa || "Mesa"
)

res.json(lista)

}catch(err){
res.json({ok:false,error:err.toString()})
}

})

app.post("/mesasConConsumo", async (req,res)=>{
try{

const sheetID = "1WISk42O7lMEAJzpHyRV938k71vP7eybS3MxEyxagpcc"
const url = `https://opensheet.elk.sh/${sheetID}/Ventas`

const response = await fetch(url)
const data = await response.json()

let mesas = {}

data.forEach(row=>{
let mesa = row.Mesa || row.mesa
let total = Number(row.Total || row.total || 0)

if(mesa && total > 0){
mesas[mesa] = true
}
})

res.json(mesas)

}catch(err){
res.json({ok:false,error:err.toString()})
}
})

app.post("/totalesPorMesa", async (req,res)=>{

try{

const sheetID = "1WISk42O7lMEAJzpHyRV938k71vP7eybS3MxEyxagpcc"
const url = `https://opensheet.elk.sh/${sheetID}/Ventas`

const response = await fetch(url)
const data = await response.json()

let totales = {}

data.forEach(row=>{
let mesa = row.Mesa || row.mesa || "Mesa"
let total = Number(row.Total || row.total || 0)

if(!totales[mesa]) totales[mesa] = 0
totales[mesa] += total
})

res.json(totales)

}catch(err){
res.json({ok:false,error:err.toString()})
}

})

// ==========================
// PORT
// ==========================
const PORT = process.env.PORT || 3000

app.listen(PORT, ()=>{
console.log("Servidor corriendo en " + PORT)
})
