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

type ScanResult struct {
	Port    int  `json:"port"`
	Open    bool `json:"open"`
	Service string `json:"service,omitempty"`
}

func scanPort(host string, port int, timeout time.Duration) ScanResult {
	result := ScanResult{Port: port, Open: false}
	address := fmt.Sprintf("%s:%d", host, port)
	conn, err := net.DialTimeout("tcp", address, timeout)
	if err != nil {
		return result
	}
	conn.Close()
	result.Open = true
	result.Service = guessService(port)
	return result
}

func guessService(port int) string {
	services := map[int]string{
		22:   "ssh",
		23:   "telnet",
		25:   "smtp",
		53:   "dns",
		80:   "http",
		110:  "pop3",
		143:  "imap",
		443:  "https",
		3306: "mysql",
		3389: "rdp",
		5432: "postgresql",
		8080: "http-alt",
	}
	if svc, ok := services[port]; ok {
		return svc
	}
	return "unknown"
}

func scanPorts(host string, ports []int, workers int) []ScanResult {
	var wg sync.WaitGroup
	semaphore := make(chan struct{}, workers)
	results := make([]ScanResult, 0)
	var mu sync.Mutex

	for _, port := range ports {
		wg.Add(1)
		semaphore <- struct{}{}
		go func(p int) {
			defer wg.Done()
			result := scanPort(host, p, 2*time.Second)
			mu.Lock()
			results = append(results, result)
			mu.Unlock()
			<-semaphore
		}(port)
	}

	wg.Wait()
	return results
}

func parsePorts(portStr string) []int {
	var ports []int
	parts := strings.Split(portStr, ",")
	for _, part := range parts {
		part = strings.TrimSpace(part)
		if strings.Contains(part, "-") {
			rangeParts := strings.Split(part, "-")
			if len(rangeParts) == 2 {
				start, _ := strconv.Atoi(strings.TrimSpace(rangeParts[0]))
				end, _ := strconv.Atoi(strings.TrimSpace(rangeParts[1]))
				for i := start; i <= end; i++ {
					ports = append(ports, i)
				}
			}
		} else {
			port, _ := strconv.Atoi(part)
			if port > 0 {
				ports = append(ports, port)
			}
		}
	}
	return ports
}

func main() {
	if len(os.Args) < 2 {
		fmt.Println(`{"error": "Usage: portscanner <host> [ports]"}`)
		os.Exit(1)
	}

	host := os.Args[1]
	var ports []int

	if len(os.Args) >= 3 {
		ports = parsePorts(os.Args[2])
	} else {
		// Ports courants par défaut
		ports = []int{22, 80, 443, 3306, 3389, 8080}
	}

	results := scanPorts(host, ports, 50)

	jsonData, err := json.Marshal(results)
	if err != nil {
		fmt.Printf(`{"error": "%s"}`, err.Error())
		os.Exit(1)
	}

	fmt.Println(string(jsonData))
}
