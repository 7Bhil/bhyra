package main

import (
	"bufio"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"strings"
	"sync"
	"time"
)

type DirResult struct {
	Path       string `json:"path"`
	StatusCode int    `json:"status_code"`
	Found      bool   `json:"found"`
	Size       int    `json:"size"`
}

func checkDir(baseURL, path string, timeout time.Duration, client *http.Client) DirResult {
	result := DirResult{Path: path, Found: false}
	
	url := strings.TrimRight(baseURL, "/") + "/" + strings.TrimLeft(path, "/")
	
	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return result
	}
	
	req.Header.Set("User-Agent", "Bhilal-DirBuster/1.0")
	
	resp, err := client.Do(req)
	if err != nil {
		return result
	}
	defer resp.Body.Close()
	
	result.StatusCode = resp.StatusCode
	result.Size = int(resp.ContentLength)
	
	// Considérer comme trouvé si status 200-299, 301, 302, 401, 403, 407
	if (resp.StatusCode >= 200 && resp.StatusCode < 300) ||
	   resp.StatusCode == 301 || resp.StatusCode == 302 ||
	   resp.StatusCode == 401 || resp.StatusCode == 403 || resp.StatusCode == 407 {
		result.Found = true
	}
	
	return result
}

func loadWordlist(path string) ([]string, error) {
	file, err := os.Open(path)
	if err != nil {
		// Wordlist par défaut si fichier non trouvé
		return []string{
			"admin", "api", "backup", "config", "dashboard", "login",
			"phpmyadmin", "wp-admin", "wp-content", "wp-includes",
			".env", ".git", ".htaccess", "robots.txt", "sitemap.xml",
			"api/v1", "api/v2", "swagger", "docs", "test", "dev",
		}, nil
	}
	defer file.Close()
	
	var words []string
	scanner := bufio.NewScanner(file)
	for scanner.Scan() {
		word := strings.TrimSpace(scanner.Text())
		if word != "" && !strings.HasPrefix(word, "#") {
			words = append(words, word)
		}
	}
	
	return words, scanner.Err()
}

func main() {
	if len(os.Args) < 2 {
		fmt.Println(`{"error": "Usage: dirbuster <url> [wordlist]"}`)
		os.Exit(1)
	}

	baseURL := os.Args[1]
	wordlistPath := ""
	if len(os.Args) >= 3 {
		wordlistPath = os.Args[2]
	}

	words, err := loadWordlist(wordlistPath)
	if err != nil {
		fmt.Printf(`{"error": "Failed to load wordlist: %s"}`, err.Error())
		os.Exit(1)
	}

	client := &http.Client{
		Timeout: 10 * time.Second,
		CheckRedirect: func(req *http.Request, via []*http.Request) error {
			return http.ErrUseLastResponse // Ne pas suivre les redirects
		},
	}

	var wg sync.WaitGroup
	semaphore := make(chan struct{}, 20) // 20 workers concurrents max
	results := make([]DirResult, 0)
	var mu sync.Mutex

	for _, word := range words {
		wg.Add(1)
		semaphore <- struct{}{}
		go func(w string) {
			defer wg.Done()
			result := checkDir(baseURL, w, 10*time.Second, client)
			mu.Lock()
			results = append(results, result)
			mu.Unlock()
			<-semaphore
		}(word)
	}

	wg.Wait()

	// Filtrer uniquement les résultats trouvés
	found := make([]DirResult, 0)
	for _, r := range results {
		if r.Found {
			found = append(found, r)
		}
	}

	jsonData, err := json.Marshal(found)
	if err != nil {
		fmt.Printf(`{"error": "%s"}`, err.Error())
		os.Exit(1)
	}

	fmt.Println(string(jsonData))
}
