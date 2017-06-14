package main

import (
	"flag"
	"log"
	"net/http"
)

var addr = flag.String("addr", "127.0.0.1:5555", "http service address")

func serveHome(w http.ResponseWriter, r *http.Request) {
	log.Println(r.URL)
	if r.URL.Path != "/" {
		http.Error(w, "Not found", 404)
		return
	}
	if r.Method != "GET" {
		http.Error(w, "Method not allowed", 405)
		return
	}
	http.ServeFile(w, r, "home.html")
}

func main() {
	flag.Parse()
	App := runApp()

	http.HandleFunc("/", serveHome)
	http.HandleFunc("/browser", func(w http.ResponseWriter, r *http.Request) {
		if hubId := r.URL.Query().Get("token"); hubId != "" {
			hub := App.RegHub(hubId)
			browserWs(hub, w, r)
		} else {
			log.Println("Cannot register browser with empty Hub Id")
			http.Error(w, "Bad request", 400)
		}
	})
	http.HandleFunc("/client", func(w http.ResponseWriter, r *http.Request) {
		hubId := r.URL.Query().Get("token")
		if hub, ok := App.Hubs[hubId]; ok {
			serveWs(hub, w, r)
		} else {
			log.Println("Unknown Hub Id ")
			http.Error(w, "Forbidden", 403)
		}
	})

	err := http.ListenAndServe(*addr, nil)
	if err != nil {
		log.Fatal("Failed to start: ", err)
	} else {
		log.Println("Serving on: ", *addr)
	}

}
