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

    let listaMesas = mesasData.map(m => (m.Mesa || "").trim())

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

    const ventas = await ventasRes.json()
    const inventario = await inventarioRes.json()

    let totalDia = 0
    let productos = {}

    ventas.forEach(row => {

      let producto = (row.Producto || row.producto || "").toString().trim()
      let total = Number((row.Total || row.total || 0).toString().trim()) || 0

      if (!producto) return

      totalDia += total

      if (!productos[producto]) {
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
app.post("/obtenerProductos", async (req, res) => {
  try {

    const sheetID = "1WISk42O7lMEAJzpHyRV938k71vP7eybS3MxEyxagpcc"
    const url = `https://opensheet.elk.sh/${sheetID}/Inventario`

    const response = await fetch(url)
    const data = await response.json()

    const productos = data.map(p => ({
      nombre: (p.Producto || p.producto || "").toString().trim(),
      precio: Number((p.Precio || p.precio || 0).toString().trim()) || 0
    })).filter(p => p.nombre)

    res.json(productos)

  } catch (error) {
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
let total = Number(row.Total || 0)

if(!resumen[mesa]) resumen[mesa] = 0
resumen[mesa] += total
})

res.json(resumen)

}catch(err){
res.json({ok:false,error:err.toString()})
}

})

app.post("/datosGraficos", async (req, res) => {
  try {

    const sheetID = "1WISk42O7lMEAJzpHyRV938k71vP7eybS3MxEyxagpcc"
    const url = `https://opensheet.elk.sh/${sheetID}/Ventas`

    const response = await fetch(url)
    const data = await response.json()

    let productos = {}
    let fechas = {}

    data.forEach(row => {

      let prod = (row.Producto || "").trim()
      let total = Number(row.Total || 0)
      let fecha = (row.Fecha || "").trim()

      if(prod){
        productos[prod] = (productos[prod] || 0) + total
      }

      if(fecha){
        fechas[fecha] = (fechas[fecha] || 0) + total
      }

    })

    res.json({
      productos,
      mesas:{}, // puedes luego mejorarlo
      fechas
    })

  } catch (error) {
    console.log("ERROR GRAFICOS:", error)
    res.json({ productos:{}, mesas:{}, fechas:{} })
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

app.post("/ventasPorMetodoPago", async (req, res) => {
  try {

    const sheetID = "1WISk42O7lMEAJzpHyRV938k71vP7eybS3MxEyxagpcc"
    const url = `https://opensheet.elk.sh/${sheetID}/Ventas`

    const response = await fetch(url)
    const data = await response.json()

    let metodos = {}

    data.forEach(row => {

      let metodo = (row.MetodoPago || row.metodopago || "").toString().trim()
      let total = Number((row.Total || row.total || 0).toString().trim()) || 0

      if (!metodo) return

      metodos[metodo] = (metodos[metodo] || 0) + total
    })

    res.json(metodos)

  } catch (error) {
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

      let metodo = (row.MetodoPago || "").toString().trim().toLowerCase()
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
app.post("/agregarMesa",(req,res)=>{

const {nombre} = req.body

if(!nombre){
return res.json({ok:false})
}

mesas.push(nombre)
consumos[nombre] = 0

res.json({ok:true})

})

app.post("/obtenerMesas", async (req, res) => {
  try {

    const sheetID = "1WISk42O7lMEAJzpHyRV938k71vP7eybS3MxEyxagpcc"
    const url = `https://opensheet.elk.sh/${sheetID}/Mesas`

    const response = await fetch(url)
    const data = await response.json()

    let lista = data.map(m => (m.Mesa || "").trim())

    res.json(lista)

  } catch (error) {
    res.json([])
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
      let total = Number((row.Total || row.total || 0).toString().trim()) || 0

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
      let total = Number((row.Total || row.total || 0).toString().trim()) || 0

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
const PORT = process.env.PORT || 3000

app.listen(PORT, ()=>{
console.log("Servidor corriendo en " + PORT)
})
