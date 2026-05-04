const express = require("express")
const cors = require("cors")
const fetch = require("node-fetch")
const app = express()

app.options("*", (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*")
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
  res.setHeader("Access-Control-Allow-Headers", "*")
  res.sendStatus(200)
})
app.set("trust proxy", 1)

// 🔥 CORS COMPLETO (SOLUCIÓN DEFINITIVA)
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*")
  res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
  res.header("Access-Control-Allow-Headers", "Content-Type")

  if (req.method === "OPTIONS") {
    return res.sendStatus(200)
  }

  next()
})

app.use(express.json())

// LOGIN
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

// ROOT (IMPORTANTE)
app.get("/", (req,res)=>{
console.log("PING ROOT")
res.status(200).send("Backend activo 🚀")
})

// PORT RAILWAY
const PORT = process.env.PORT || 3000

app.listen(PORT, ()=>{
console.log("Servidor corriendo en " + PORT)
})

app.post("/dashboard", async (req, res) => {
  try {

    const url = "https://opensheet.elk.sh/1WISk42O7lMEAJzpHyRV938k71vP7eybS3MxEyxagpcc/Ventas"

    const response = await fetch(url)
    const data = await response.json()

    let totalDia = 0
    let productos = {}

    data.forEach(row => {

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
      totalDia,
      productoTop
    })

  } catch (error) {
    res.json({ ok:false, error:error.toString() })
  }
})

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
let consumos = {} // { "Mesa 1": total }

/* CREAR MESA */
app.post("/agregarMesa",(req,res)=>{

const {nombre} = req.body

if(!nombre){
return res.json({ok:false})
}

mesas.push(nombre)

consumos[nombre] = 0

res.json({ok:true})

})

/* OBTENER MESAS */
app.post("/obtenerMesas",(req,res)=>{
res.json(mesas)
})

/* MESAS CON CONSUMO */
app.post("/mesasConConsumo",(req,res)=>{

let data = {}

Object.keys(consumos).forEach(m=>{
if(consumos[m] > 0){
data[m] = true
}
})

res.json(data)

})

/* TOTALES POR MESA */
app.post("/totalesPorMesa",(req,res)=>{
res.json(consumos)
})
