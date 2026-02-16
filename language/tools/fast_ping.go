package main

import (
	"encoding/json"
	"fmt"
	"net"
	"os"
	"sync"
	"time"
)

type PingResult struct {
	Host      string `json:"host"`
	IP        string `json:"ip,omitempty"`
	Reachable bool   `json:"reachable"`
	RTT       int64  `json:"rtt_ms,omitempty"`
	Error     string `json:"error,omitempty"`
}

func tcpPing(host string, port int, timeout time.Duration) PingResult {
	result := PingResult{Host: host, Reachable: false}

	// Résoudre l'IP
	ips, err := net.LookupHost(host)
	if err != nil {
		result.Error = err.Error()
		return result
	}
	if len(ips) > 0 {
		result.IP = ips[0]
	}

	// TCP Ping (connexion sur port ouvert)
	start := time.Now()
	address := fmt.Sprintf("%s:%d", host, port)
	conn, err := net.DialTimeout("tcp", address, timeout)
	if err != nil {
		// Essayer ICMP via ping système si TCP échoue
		return icmpPing(host, timeout)
	}
	defer conn.Close()

	result.RTT = time.Since(start).Milliseconds()
	result.Reachable = true
	return result
}

func icmpPing(host string, timeout time.Duration) PingResult {
	// Utiliser la commande système ping
	// Note: ceci nécessite des privilèges root sur Linux
	// Une implémentation ICMP native nécessiterait des privilèges élevés

	// Pour l'instant, on fait un simple TCP ping sur port 80
	return tcpPing(host, 80, timeout)
}

func pingSweep(network string, workers int) []PingResult {
	// Parse CIDR
	ip, ipnet, err := net.ParseCIDR(network)
	if err != nil {
		return []PingResult{{Host: network, Error: err.Error()}}
	}

	var hosts []string
	for ip := ip.Mask(ipnet.Mask); ipnet.Contains(ip); incrementIP(ip) {
		hosts = append(hosts, ip.String())
	}

	// Limiter à 254 hôtes (typique /24)
	if len(hosts) > 254 {
		hosts = hosts[1:255] // Retirer network et broadcast
	}

	var wg sync.WaitGroup
	semaphore := make(chan struct{}, workers)
	results := make([]PingResult, 0)
	var mu sync.Mutex

	for _, host := range hosts {
		wg.Add(1)
		semaphore <- struct{}{}
		go func(h string) {
			defer wg.Done()
			result := tcpPing(h, 80, 2*time.Second)
			mu.Lock()
			results = append(results, result)
			mu.Unlock()
			<-semaphore
		}(host)
	}

	wg.Wait()
	return results
}

func incrementIP(ip net.IP) {
	for j := len(ip) - 1; j >= 0; j-- {
		ip[j]++
		if ip[j] > 0 {
			break
		}
	}
}

func main() {
	if len(os.Args) < 2 {
		fmt.Println(`{"error": "Usage: fast_ping <command> [args...]"}`)
		fmt.Println(`Commands:`)
		fmt.Println(`  ping <host> [port]        → TCP ping single host`)
		fmt.Println(`  sweep <network> [workers]   → Ping sweep entire network (CIDR)`)
		fmt.Println(`Examples:`)
		fmt.Println(`  fast_ping ping google.com`)
		fmt.Println(`  fast_ping sweep 192.168.1.0/24`)
		os.Exit(1)
	}

	command := os.Args[1]

	switch command {
	case "ping":
		if len(os.Args) < 3 {
			fmt.Println(`{"error": "Usage: ping <host> [port]"}`)
			os.Exit(1)
		}
		host := os.Args[2]
		port := 80
		if len(os.Args) >= 4 {
			fmt.Sscanf(os.Args[3], "%d", &port)
		}

		result := tcpPing(host, port, 5*time.Second)
		jsonData, _ := json.Marshal(result)
		fmt.Println(string(jsonData))

	case "sweep":
		if len(os.Args) < 3 {
			fmt.Println(`{"error": "Usage: sweep <network/CIDR> [workers]"}`)
			os.Exit(1)
		}
		network := os.Args[2]
		workers := 50
		if len(os.Args) >= 4 {
			fmt.Sscanf(os.Args[3], "%d", &workers)
		}

		results := pingSweep(network, workers)

		// Compter les réussites
		alive := 0
		for _, r := range results {
			if r.Reachable {
				alive++
			}
		}

		output := map[string]interface{}{
			"network":      network,
			"total_hosts":  len(results),
			"alive_hosts":  alive,
			"hosts":        results,
		}

		jsonData, _ := json.Marshal(output)
		fmt.Println(string(jsonData))

	default:
		fmt.Printf(`{"error": "Unknown command: %s"}`, command)
		os.Exit(1)
	}
}
