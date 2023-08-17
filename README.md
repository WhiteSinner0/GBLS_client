# GBLS_client

Installing the GBLS client
1.	Download the latest version of the GBLS client from the link below the instructions
2.	Unpack the archive to any place on the server disk where the game servers are located
3.	Note: make sure you have at least version 18 of NodeJS installed; run the following commands to install: “npm i”
4.	create a file in the root folder of the GBLS client with the name config.json and put in it the content from the message with a link to these instructions
5.	start the client server with the command "node index.js".
6.	Put the "GBLS" folder with the mission on your servers
7.	If you have more than one server, then customize the mission configuration for each server by editing the "script.lua" file. Find the line srv_name - server name and srv_id - server id (numbers in "<id>"). It is also desirable to edit srv_ip (external IP address of the server) and srv_query_port (port for Steam API, not game).
