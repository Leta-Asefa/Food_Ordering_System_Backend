const express=require('express')
const {Server}=require('socket.io')
const http=require('http')

const app=express()
const server=http.createServer(app)
const io=new Server(server,{
    cors:{
        origin:['http://localhost:3000'],
        methods:['GET','POST','PUT','DELETE'],
        credentials:true
    }
})

io.on('connection', (socket)=>{

console.log('A new user is connected Id : ',socket.id)




socket.on('disconnect',()=> {  console.log('User ',socket.id, ' is disconnected') } )

})




module.exports={app,server,io}