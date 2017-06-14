package main

import (
	"log"
	"net/http"
	"time"

	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin:     func(r *http.Request) bool { return true },
}

const (
	// Time allowed to write a message to the peer.
	writeWait = 10 * time.Second

	// Time allowed to read the next pong message from the peer.
	pongWait = 60 * time.Second

	// Send pings to peer with this period. Must be less than pongWait.
	pingPeriod = (pongWait * 9) / 10

	// Maximum message size allowed from peer.
	maxMessageSize = 512
)

var (
	newline = []byte{'\n'}
	space   = []byte{' '}
)

type App struct {
	Hubs map[string]*Hub
}

func runApp() *App {
	return &App{
		Hubs: make(map[string]*Hub),
	}
}

func (a *App) RegHub(id string) (hub *Hub) {
	log.Println("Registered new Hub: ", id)
	hub = newHub()
	go hub.run()
	a.Hubs[id] = hub
	return hub
}
