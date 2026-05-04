const express = require("express")
const cors = require("cors")

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
      let total = Number(row.Total || 0)
      let producto = row.Producto || "Sin nombre"

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
app.post("/obtenerProductos",(req,res)=>{
res.json([])
})

app.post("/obtenerResumenMesas",(req,res)=>{
res.json([])
})

app.post("/datosGraficos",(req,res)=>{
res.json({
productos:{},
mesas:{},
fechas:{}
})
})

app.post("/comparacionSemanas",(req,res)=>{
res.json({
actual:{},
anterior:{}
})
})

app.post("/ventasPorMetodoPago",(req,res)=>{
res.json({})
})

app.post("/obtenerInversiones",(req,res)=>{
res.json([])
})

app.post("/cierreDeCaja",(req,res)=>{
res.json({
total:0,
efectivo:0,
nequi:0,
daviplata:0,
transferencia:0
})
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

app.post("/obtenerMesas",(req,res)=>{
res.json(mesas)
})

app.post("/mesasConConsumo",(req,res)=>{

let data = {}

Object.keys(consumos).forEach(m=>{
if(consumos[m] > 0){
data[m] = true
}
})

res.json(data)

})

app.post("/totalesPorMesa",(req,res)=>{
res.json(consumos)
})

// ==========================
// PORT
// ==========================
const PORT = process.env.PORT || 3000

app.listen(PORT, ()=>{
console.log("Servidor corriendo en " + PORT)
})
