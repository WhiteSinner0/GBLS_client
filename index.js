const express = require('express');
const config = require("./config.json")
const WebSocket = require('ws');
let ws;
let ws_state = 0

const app = express();

function connect_to_server() {
    ws = new WebSocket(`ws://${config.host.ip}:${config.host.port}${config.host.path}`,{headers:{token:config.token},timeout:3000});
    ws.on('open', () => {
        console.log('Connected to the WebSocket server');
        ws_state=1
    });
    ws.on('close', () => {
        console.log('Connection closed');
        ws_state=0
        setTimeout(() => {
            connect_to_server()
        }, 5000);
    });
    ws.on('error', () => {})
    ws.on('message',(data)=>{
        const parsedMsg = JSON.parse(data);
        if (parsedMsg.type === 'queue') {
            parsedMsg.queue.forEach(element => {
                if (element.id=='0') {
                    for (var key in queues) {
                        if (queues.hasOwnProperty(key)) {
                            queues[key].push(element)
                        }
                    }
                } else {
                    if (queues[`${element.id}`]) queues[`${element.id}`].push(element)
                }
            });
        }
    })
}
connect_to_server()

var queues = {}
var servers = {}

app.get('/api/stats',(req,res)=>{
    if (!queues[`${req.query.srv_id}`]){
        queues[`${req.query.srv_id}`]=[]
    }
    if (servers[`${req.query.srv_id}`]&&servers[`${req.query.srv_id}`].state==true) {
        servers[`${req.query.srv_id}`]={last_update:new Date(),state:true}
    }else{
        console.log(`Server ${req.query.srv_id} connected`)
        servers[`${req.query.srv_id}`]={last_update:new Date(),state:true}
    }
    const queue = queues[`${req.query.srv_id}`]
    if (queue.length>0) {
        res.send(queue[0])
        queues[`${req.query.srv_id}`].shift()
    }
    if (ws_state==1){
        console.log(queues)
        req.query.type="stats"
        req.query.players = convertPlayerList(req.query.players)
        req.query.sys_time = formatUpTime(req.query.sys_time)
        ws.send(JSON.stringify(req.query))
    }
})
app.get('/api/event',(req,res)=>{
    if (!queues[`${req.query.srv_id}`]){
        queues[`${req.query.srv_id}`]=[]
    }
    if (servers[`${req.query.srv_id}`]&&servers[`${req.query.srv_id}`].state==true) {
        servers[`${req.query.srv_id}`]={last_update:new Date(),state:true}
    }else{
        console.log(`Server ${req.query.srv_id} connected`)
        servers[`${req.query.srv_id}`]={last_update:new Date(),state:true}
    }
    const queue = queues[`${req.query.srv_id}`]
    if (queue.length>0) {
        res.send(queue[0])
        queues[`${req.query.srv_id}`].shift()
    }
    if (ws_state==1){
        req.query.type="stats_event"
        req.query.players = convertPlayerList(req.query.players)
        req.query.sys_time = formatUpTime(req.query.sys_time)
        ws.send(JSON.stringify(req.query))
    }
})

app.get('/add/:data',(req,res)=>{
    console.log('data',req.params.data)
    if (!queues[`${JSON.parse(req.params.data).id}`]&&!JSON.parse(req.params.data).id=='0'){
        queues[`${JSON.parse(req.params.data).id}`]=[]
    }
    if (JSON.parse(req.params.data).id=='0') {
        for (var key in queues) {
            if (queues.hasOwnProperty(key)) {
                queues[key].push(req.params.data)
            }
        }
    } else {
        queues[`${JSON.parse(req.params.data).id}`].push(req.params.data)
    }
    res.send('ok')
})

app.listen(3898,()=>console.log('ready'))

setInterval(() => {
    for (var key in servers) {
        if (servers.hasOwnProperty(key)) {
            if (servers[key].state==true&&new Date()-new Date(servers[key].last_update)>20000) {
                console.log(`Server ${key} is offline`)
                servers[key].state==false
            }
        }
    }
}, 1000);

app.listen(config.sw_port,()=>console.log("Server ready!"));

function formatUpTime(milliseconds) {
    let seconds = Math.floor(milliseconds / 1000);
    let minutes = Math.floor(seconds / 60);
    let hours = Math.floor(minutes / 60);
    seconds %= 60;
    minutes %= 60;
    const formattedTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    return formattedTime;
}
function convertPlayerList(playerList) {
    const players = [];
    const pList=playerList.substring(1, playerList.length - 1).split(",")
    for (let i = 0; i < pList.length; i++) {
    const playerData = pList[i].split(".");
    const steamID = playerData[0];
    const peerID = parseInt(playerData[1]);
    const isAuth = playerData[2] === "auth";
    const isAdmin = playerData[3] === "admin";
    const username = playerData[4].replaceAll(':0:',' ');
    players.push({
        steamid: steamID,
        peerid: peerID,
        isAuth: isAuth,
        isAdmin: isAdmin,
        username: username
    });
    }
    return players;
}