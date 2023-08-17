--Configuration GBLS
config = {
    srv_name = "test server 1",
    srv_id = "1",
    api_server = 3898,
    srv_ip = "localhost",
	srv_query_port = 25566,
}

--System variables
statistics = {}
timers = {}
game_ticks = 0
ticks = 0
ticks_time = 0
tps = 0

--Events
function onCreate()
	server.announce("[GBLS]","loaded")
end
function httpReply(port, request, reply)
    obj = parseJsonObject(reply)
    --if obj.action == "" then
    --
    --end
    if obj.action == "msg" then
        server.announce("["..obj.player.."]",obj.msg)
    end
    if obj.action == "kick" then
        pD=getPlrD(obj.player)
        if pD then
            server.announce("[GBLS]","User "..pD["name"].." kicked from reason: "..obj.msg)
            server.removeAdmin(pD.id)
            server.removeAuth(pD.id)
            server.kickPlayer(pD.id)
        end
    end
end
function onTick()
	game_ticks=game_ticks+1
    calculateTPS()
    dlcWeapons=booleanToString(server.dlcWeapons())
    dlcArid=booleanToString(server.dlcArid())
    statistics = {
        tps = tps,
        sys_time = server.getTimeMillisec(),
        players = convertPlayerList()
    }
    if game_ticks % 500 == 0 then
        server.httpGet(config.api_server, generateQueryString({
            path = "/api/stats"
        }))
	end
end
function onPlayerJoin(steam_id, name, peer_id, is_admin, is_auth)
    server.httpGet(config.api_server, generateQueryString({
        path = "/api/event",
        event = "onPlayerJoin",
        steam_id = steam_id,
        name = name,
        peer_id = peer_id,
        is_admin = booleanToString(is_admin),
        is_auth = booleanToString(is_auth)
    }))
end
function onPlayerLeave(steam_id, name, peer_id, is_admin, is_auth)
    server.httpGet(config.api_server, generateQueryString({
        path = "/api/event",
        event = "onPlayerLeave",
        steam_id = steam_id,
        name = name,
        peer_id = peer_id,
        is_admin = booleanToString(is_admin),
        is_auth = booleanToString(is_auth)
    }))
end

--Functions
function generateQueryString(data)
    queryString = data.path .. "?"
    params = {}
    for key, value in pairs(data) do
        if key ~= "path" then
            value = string.gsub(tostring(value), " ", ":0:")
            table.insert(params, key .. "=" .. value)
        end
    end
    for key, value in pairs(statistics) do
        table.insert(params, key .. "=" .. tostring(value))
    end
    configKeys = {
        "srv_name", 
        "srv_id", 
        "srv_ip", 
        "srv_query_port"
    }
    for _, key in ipairs(configKeys) do
        local value = config[key]
        if value then
            table.insert(params, key .. "=" .. tostring(string.gsub(tostring(value), " ", ":0:")))
        end
    end
    queryString = queryString .. table.concat(params, "&")
    return queryString
end
function booleanToString(value)
    if value then
      return "true"
    else
      return "false"
    end
end
function getSteamID(peer_id)
    for _, peer in pairs(server.getPlayers()) do
        if peer.id == peer_id then
            return peer.steam_id
        end
    end
end
function getPlrD(steam_id)
	for _, peer in pairs(server.getPlayers()) do
		if tostring(peer.steam_id) == tostring(steam_id) then
            return peer
        end
        if _>=#server.getPlayers() then
            return false
        end
    end
end
function parseJsonObject(jsonObjectStr)
    jsonObject = {}
    for key, value in jsonObjectStr:gmatch('"([^"]+)":"([^"]+)"') do
        jsonObject[key] = value
    end

    return jsonObject
end
function calculateTPS()
    ticks = ticks + 1
    if server.getTimeMillisec() - ticks_time >= 500 then
        tps = ticks*2
        ticks = 0
        ticks_time = server.getTimeMillisec()
    end
end
function convertPlayerList()
    players = {}
    pList = {}
    for peer_index, playerData in pairs(server.getPlayers()) do
        steam_id = playerData["steam_id"]
        peer_id = peer_index
        is_auth = playerData["auth"]
        is_admin = playerData["admin"]
        username = playerData["name"]
        playerString = string.format("%s.%d.%s.%s.%s", steam_id, peer_id, is_auth and "auth" or "", is_admin and "admin" or "", username)
        table.insert(pList, playerString)
    end
    return "{" .. table.concat(pList, ",") .. "}"
end