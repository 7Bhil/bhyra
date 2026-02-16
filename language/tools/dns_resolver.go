package main

import (
	"encoding/json"
	"fmt"
	"net"
	"os"
	"strings"
	"sync"
	"time"
)

type DNSResult struct {
	Hostname string   `json:"hostname"`
	IPs      []string `json:"ips,omitempty"`
	Found    bool     `json:"found"`
	Error    string   `json:"error,omitempty"`
}

func resolveHostname(hostname string, timeout time.Duration) DNSResult {
	result := DNSResult{Hostname: hostname, IPs: []string{}, Found: false}
	
	// Ajouter le domaine si pas de point
	if !strings.Contains(hostname, ".") && len(os.Args) > 2 {
		domain := os.Args[2]
		hostname = hostname + "." + domain
	}

	ips, err := net.LookupHost(hostname)
	if err != nil {
		result.Error = err.Error()
		return result
	}

	result.Found = true
	result.IPs = ips
	return result
}

func loadWordlist() []string {
	// Sous-domaines communs par défaut
	return []string{
		"www", "mail", "ftp", "admin", "blog", "shop", "api",
		"dev", "test", "staging", "demo", "portal", "remote",
		"vpn", "dns", "mx", "smtp", "pop", "imap", "ns1", "ns2",
		"git", "svn", "cvs", "webmail", "secure", "support",
		"docs", "wiki", "forum", "news", "mail2", "mx1", "mx2",
		"ldap", "db", "mysql", "postgres", "redis", "mongo",
		"jenkins", "gitlab", "github", "docker", "kubernetes",
		"grafana", "prometheus", "elastic", "kibana", "logstash",
		"nagios", "zabbix", "cacti", "backup", "archive",
	}
}

func main() {
	if len(os.Args) < 2 {
		fmt.Println(`{"error": "Usage: dns_resolver <hostname> [domain]"}`)
		fmt.Println(`       dns_resolver --bruteforce <domain>`)
		os.Exit(1)
	}

	// Mode bruteforce
	if os.Args[1] == "--bruteforce" || os.Args[1] == "-b" {
		if len(os.Args) < 3 {
			fmt.Println(`{"error": "Usage: dns_resolver --bruteforce <domain>"}`)
			os.Exit(1)
		}
		domain := os.Args[2]
		wordlist := loadWordlist()
		
		var wg sync.WaitGroup
		semaphore := make(chan struct{}, 50)
		results := make([]DNSResult, 0)
		var mu sync.Mutex

		for _, sub := range wordlist {
			wg.Add(1)
			semaphore <- struct{}{}
			go func(s string) {
				defer wg.Done()
				hostname := s + "." + domain
				result := resolveHostname(hostname, 5*time.Second)
				mu.Lock()
				results = append(results, result)
				mu.Unlock()
				<-semaphore
			}(sub)
		}

		wg.Wait()

		// Filtrer les trouvés
		found := make([]DNSResult, 0)
		for _, r := range results {
			if r.Found {
				found = append(found, r)
			}
		}

		jsonData, _ := json.Marshal(found)
		fmt.Println(string(jsonData))
		return
	}

	// Mode simple: résoudre un hostname
	hostname := os.Args[1]
	result := resolveHostname(hostname, 10*time.Second)

	jsonData, err := json.Marshal(result)
	if err != nil {
		fmt.Printf(`{"error": "%s"}`, err.Error())
		os.Exit(1)
	}

	fmt.Println(string(jsonData))
}
