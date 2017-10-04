package main

import (
	"encoding/json"
	"log"
)

// hub maintains the set of active clients and broadcasts messages to the
// clients.
type Hub struct {
	// Registered clients.
	clients map[*Client]bool

	// this hubs tabs list
	tabs *Tabs

	// Only one browser may be in a Hub
	browser *Browser

	// Inbound messages from the browser.
	rx chan []byte

	// Outbound messages from the clients.
	tx chan []byte

	// Register requests from the clients.
	register chan *Client

	// Unregister requests from clients.
	unregister chan *Client
}

func newHub() *Hub {
	return &Hub{
		rx:         make(chan []byte), //Clients recieve messages from browser
		tx:         make(chan []byte), //Client sends messages to browser
		tabs:       &Tabs{},
		register:   make(chan *Client),
		unregister: make(chan *Client),
		clients:    make(map[*Client]bool),
	}
}

func (h *Hub) run() {
	for {
		select {
		case client := <-h.register:
			h.clients[client] = true
		case client := <-h.unregister:
			if _, ok := h.clients[client]; ok {
				delete(h.clients, client)
				close(client.send)
			}
		case command := <-h.tx:
			// send command to browser and update all the clients
			//TODO validate command & append clients list
			c := Action{}
			err := json.Unmarshal(command, &c)
			if err != nil {
				log.Printf("error: %v", err)
			}
			log.Printf("Perform:  %s\n", &c)

			select {
			case h.browser.send <- command:
				break
			default:
				close(h.browser.send)
				//delete(h.browser) // panic
			}
		case notification := <-h.rx:
			notif := MessageData{}
			err := json.Unmarshal(notification, &notif)
			if err != nil {
				log.Printf("error: %v", err)
			}

			h.tabs = &notif.Tabs
			//log.Printf("cur tabs: \n %s", h.tabs)
			for client := range h.clients {
				select {
				//TODO marshall and send h.tabs
				case client.send <- notification:
					break
				default:
					close(client.send)
					delete(h.clients, client)
				}
			}
		}
	}
}
