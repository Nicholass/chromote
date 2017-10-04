package main

import "fmt"

type TabsMessage struct {
	Data MessageData `json:"data"`
}

type MessageData struct {
	Title string `json:"title"`
	Tabs  Tabs   `json:"data"`
}

type Tab struct {
	Id       int `json:"id"`
	Index    int `json:"index"`
	Windowid int `json:"windowId"`

	Active    bool `json:"active"`
	Audible   bool `json:"audible"`
	Pinned    bool `json:"pinned"`
	Incognito bool `json:"incognito"`

	MutedInfo MutedInfo `json:"mutedInfo"`

	Favicourl string `json:"favIconUrl"`
	Status    string `json:"status"`
	Title     string `json:"title"`
	Url       string `json:"url"`
}

type MutedInfo struct {
	Muted bool `json:"muted"`
}

func (t *Tab) String() string {
	return fmt.Sprintf("| %10s | %20s | %d|", t.Title, t.Url, t.Id)
}

// Do we need this shit?
func (t *Tab) Navigate(u string) {}
func (t *Tab) Activate()         {}
func (t *Tab) Close()            {}
func (t *Tab) Reload()           {}
func Open(u string)              {}
func (t *Tab) toggleMute()       {}
func (t *Tab) zoomIn()           {}
func (t *Tab) zoomOut()          {}
func (t *Tab) zoomRestore()      {}

type Tabs []*Tab

func (t *Tabs) String() string {
	s := ""
	for _, tab := range *t {
		s += fmt.Sprintf("%s\n", tab)
	}

	return s
}
