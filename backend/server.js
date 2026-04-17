const express = require("express")
const cors = require("cors")

const app = express()

app.use(cors())
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
res.send("Backend activo 🚀")
})

// PORT RAILWAY
const PORT = process.env.PORT || 3000

app.listen(PORT, ()=>{
console.log("Servidor corriendo en " + PORT)
})

app.post("/obtenerMesas",(req,res)=>{
res.json(["Mesa 1","Mesa 2"])
})

app.post("/dashboard",(req,res)=>{
res.json({
totalDia:0,
productoTop:"-"
})
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
