package main

import (
	"encoding/json"
	"fmt"
	"net"
	"os"
	"strconv"
	"strings"
	"sync"
	"time"
)

type SubnetResult struct {
	IP    string `json:"ip"`
	Alive bool   `json:"alive"`
	RTT   int64  `json:"rtt_ms,omitempty"`
}

func pingHost(ip string, timeout time.Duration) SubnetResult {
	result := SubnetResult{IP: ip, Alive: false}
	
	start := time.Now()
	conn, err := net.DialTimeout("tcp", ip+":80", timeout)
	if err != nil {
		// Essayer le port 443 si 80 échoue
		conn, err = net.DialTimeout("tcp", ip+":443", timeout)
		if err != nil {
			return result
		}
	}
	defer conn.Close()
	
	result.Alive = true
	result.RTT = time.Since(start).Milliseconds()
	return result
}

func cidrToIPs(cidr string) ([]string, error) {
	ip, ipnet, err := net.ParseCIDR(cidr)
	if err != nil {
		return nil, err
	}

	var ips []string
	for ip := ip.Mask(ipnet.Mask); ipnet.Contains(ip); incIP(ip) {
		ips = append(ips, ip.String())
	}
	
	// Retirer network et broadcast pour les /24 et plus petits
	if len(ips) > 2 {
		return ips[1 : len(ips)-1], nil
	}
	return ips, nil
}

func incIP(ip net.IP) {
	for j := len(ip) - 1; j >= 0; j-- {
		ip[j]++
		if ip[j] > 0 {
			break
		}
	}
}

func parseCIDR(cidr string) (string, int, error) {
	parts := strings.Split(cidr, "/")
	if len(parts) != 2 {
		return "", 0, fmt.Errorf("invalid CIDR format")
	}
	
	bits, err := strconv.Atoi(parts[1])
	if err != nil {
		return "", 0, err
	}
	
	return parts[0], bits, nil
}

func main() {
	if len(os.Args) < 2 {
		fmt.Println(`{"error": "Usage: subnet_scanner <CIDR> [options]"}`)
		fmt.Println(`Options:`)
		fmt.Println(`  --timeout=<seconds>  Timeout par hôte (défaut: 2)`)
		fmt.Println(`  --workers=<num>      Workers concurrents (défaut: 100)`)
		fmt.Println(`Exemple: subnet_scanner 192.168.1.0/24`)
		os.Exit(1)
	}

	cidr := os.Args[1]
	timeout := 2 * time.Second
	workers := 100

	// Parse options
	for _, arg := range os.Args[2:] {
		if strings.HasPrefix(arg, "--timeout=") {
			t, _ := strconv.Atoi(strings.TrimPrefix(arg, "--timeout="))
			if t > 0 {
				timeout = time.Duration(t) * time.Second
			}
		} else if strings.HasPrefix(arg, "--workers=") {
			w, _ := strconv.Atoi(strings.TrimPrefix(arg, "--workers="))
			if w > 0 {
				workers = w
			}
		}
	}

	ips, err := cidrToIPs(cidr)
	if err != nil {
		fmt.Printf(`{"error": "Invalid CIDR: %s"}`, err.Error())
		os.Exit(1)
	}

	// Limiter à 1024 hôtes max pour éviter les scans trop longs
	if len(ips) > 1024 {
		fmt.Printf(`{"error": "CIDR too large (%d hosts). Max 1024 hosts allowed."}`, len(ips))
		os.Exit(1)
	}

	var wg sync.WaitGroup
	semaphore := make(chan struct{}, workers)
	results := make([]SubnetResult, 0)
	var mu sync.Mutex

	for _, ip := range ips {
		wg.Add(1)
		semaphore <- struct{}{}
		go func(target string) {
			defer wg.Done()
			result := pingHost(target, timeout)
			mu.Lock()
			results = append(results, result)
			mu.Unlock()
			<-semaphore
		}(ip)
	}

	wg.Wait()

	// Filtrer les hôtes vivants
	alive := make([]SubnetResult, 0)
	for _, r := range results {
		if r.Alive {
			alive = append(alive, r)
		}
	}

	output := map[string]interface{}{
		"scanned": len(ips),
		"alive":   len(alive),
		"hosts":   alive,
	}

	jsonData, _ := json.Marshal(output)
	fmt.Println(string(jsonData))
}
