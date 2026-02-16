package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"strings"
	"time"
)

type Response struct {
	Status  int                 `json:"status"`
	Headers map[string][]string `json:"headers"`
	Body    string              `json:"body"`
	Error   string              `json:"error,omitempty"`
}

func main() {
	if len(os.Args) < 3 {
		fmt.Println(`{"error": "Usage: http_client <method> <url> [headers_json] [body]"}`)
		return
	}

	method := strings.ToUpper(os.Args[1])
	urlString := os.Args[2]
	headersJson := "{}"
	if len(os.Args) > 3 {
		headersJson = os.Args[3]
	}
	bodyContent := ""
	if len(os.Args) > 4 {
		bodyContent = os.Args[4]
	}

	var headers map[string]string
	json.Unmarshal([]byte(headersJson), &headers)

	client := &http.Client{
		Timeout: 10 * time.Second,
	}

	req, err := http.NewRequest(method, urlString, bytes.NewBufferString(bodyContent))
	if err != nil {
		fmt.Printf(`{"error": "%s"}`, err.Error())
		return
	}

	for k, v := range headers {
		req.Header.Set(k, v)
	}

	resp, err := client.Do(req)
	if err != nil {
		fmt.Printf(`{"error": "%s"}`, err.Error())
		return
	}
	defer resp.Body.Close()

	respBody, _ := io.ReadAll(resp.Body)

	result := Response{
		Status:  resp.StatusCode,
		Headers: resp.Header,
		Body:    string(respBody),
	}

	jsonOutput, _ := json.Marshal(result)
	fmt.Println(string(jsonOutput))
}
