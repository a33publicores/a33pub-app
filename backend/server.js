const express = require("express")
const cors = require("cors")

const app = express()

app.use(cors())
app.use(express.json())

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

app.get("/",(req,res)=>{
res.send("Backend activo 🚀")
})

app.listen(3000, ()=>{
console.log("Servidor corriendo")
})
