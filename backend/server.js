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
