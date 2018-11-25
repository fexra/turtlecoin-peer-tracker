// Copyright (c) 2018, Fexra, The TurtleCoin Developers
//
// Please see the included LICENSE file for more information.
'use strict'

const db = require('../utils/knex')
const axios = require('axios')
const geoip = require('geoip-lite')


setInterval(function() {
    getPeers()
}, 1000)

async function getPeers() {
    let knownNodes

    const getNodes = await db('nodes')
    .select()
    .where('available', true)

    // Bootstrap this bitch
    if(getNodes.length >= 1) {
        knownNodes = getNodes
    } else {
        knownNodes = [
            '145.131.30.157:11898',
            'public.turtlenode.io:11898'
        ]
    }

    knownNodes.forEach(async function(node) {
console.log(node)
        try {
            
            // Grab other peers 
            var getPeers = await axios.get('http://' + node + '/getpeers')
            var peers = []

            getPeers.data.peers.forEach(async function(peer) {
                peers.push(peer)
            })

            // select two random peers and store
            peers = peers.sort(() => .5 - Math.random()).slice(0, 2)

            peers.forEach(async function(peer) {

    
                var peerRpc = 'http://' + node + '/getinfo'
                var geo = await geoip.lookup(peerIp)
                
                try {
                    let available
                    var peerCheck =  await axios.get(peerRpc)
                    if(peerCheck.status === 200) {
                        available = true
                    } else {
                        available = false
                    }
                }
                catch(err) {
                    available = false
                }


                var data = [
                    peer,
                    JSON.stringify(peers),
                    available,
                    geo.country,
                    geo.region,
                    geo.city,
                    JSON.stringify(geo.ll),
                    Date.now(),
                    Date.now(),
                    JSON.stringify(peers),
                    available,
                    geo.country,
                    geo.region,
                    geo.city,
                    JSON.stringify(geo.ll),
                    Date.now()
                ]

                console.log(data)

                await db.raw('INSERT INTO nodes (address, peers, available, country, region, city, coordinates, seen, created) VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT (address) DO UPDATE SET peers = ?, available = ?, country = ?, region = ?, city = ?, coordinates = ?, seen = ?', data)
            })
        }
        catch(err) {
        }
    })
}