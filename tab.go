package main

type Tab struct {
	Id       int `json:"id"`
	Index    int `json:"index"`
	Windowid int `json:"windowId"`

	Active    bool `json:"active"`
	Audible   bool `json:"audible"`
	Pinned    bool `json:"pinned"`
	Incognito bool `json:"incognito"`
	Muted     bool //`json:mutedInfo`

	Favicourl string `json:"favIconUrl"`
	Status    string `json:"status"`
	Title     string `json:"title"`
	Url       string `json:"url"`
}

func Open(u string) {}

func (t *Tab) String() {}

func (t *Tab) Navigate(u string) {}
func (t *Tab) Close()            {}
func (t *Tab) Reload()           {}
func (t *Tab) Activate()         {}
func (t *Tab) toggleMute()       {}
func (t *Tab) zoomIn()           {}
func (t *Tab) zoomOut()          {}

type Tabs []*Tab
