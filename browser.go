package main

import (
	"bytes"
	"log"
	"net/http"
	"time"

	"github.com/gorilla/websocket"
)

// Browser is a middleman between the websocket connection and the hub.
type Browser struct {
	hub *Hub
	Id  string `json:"id"`

	// The websocket connection.
	conn *websocket.Conn

	// Buffered channel of outbound messages.
	send chan []byte
}

// readPump pumps messages from the websocket connection to the hub.
//
// The application runs readPump in a per-connection goroutine. The application
// ensures that there is at most one reader on a connection by executing all
// reads from this goroutine.
func (b *Browser) readPump() {
	defer func() {
		//b.hub.unregister <- b
		b.conn.Close() // close hub here
	}()
	for {
		_, message, err := b.conn.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway) {
				log.Printf("error: %v", err)
			}
			break
		}
		message = bytes.TrimSpace(bytes.Replace(message, newline, space, -1))
		b.hub.rx <- message
	}
}

// writePump pumps messages from the hub to the websocket connection.
//
// A goroutine running writePump is started for each connection. The
// application ensures that there is at most one writer to a connection by
// executing all writes from this goroutine.
func (b *Browser) writePump() {
	ticker := time.NewTicker(pingPeriod)
	defer func() {
		ticker.Stop()
		b.conn.Close()
	}()
	for {
		select {
		case message, ok := <-b.send:
			b.conn.SetWriteDeadline(time.Now().Add(writeWait))
			if !ok {
				// The hub closed the channel.
				b.conn.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}

			w, err := b.conn.NextWriter(websocket.TextMessage)
			if err != nil {
				return
			}
			w.Write(message)

			// Add queued chat messages to the current websocket message.
			n := len(b.send)
			for i := 0; i < n; i++ {
				w.Write(newline)
				w.Write(<-b.send)
			}

			if err := w.Close(); err != nil {
				return
			}
		case <-ticker.C:
			b.conn.SetWriteDeadline(time.Now().Add(writeWait))
			if err := b.conn.WriteMessage(websocket.PingMessage, []byte{}); err != nil {
				return
			}
		}
	}
}

// browserWs handles websocket requests from the peer.
func browserWs(hub *Hub, w http.ResponseWriter, r *http.Request) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Println(err)
		return
	}

	browser := &Browser{hub: hub, conn: conn, send: make(chan []byte, 256)}
	hub.browser = browser
	go browser.writePump()
	browser.readPump()
}
