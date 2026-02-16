package main

import (
	"crypto/aes"
	"crypto/cipher"
	"crypto/md5"
	"crypto/rand"
	"crypto/sha1"
	"crypto/sha256"
	"crypto/sha512"
	"encoding/base64"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io"
	"os"
	"time"
)

type CryptoResult struct {
	Algorithm string `json:"algorithm"`
	Input     string `json:"input"`
	Output    string `json:"output"`
	Duration  int64  `json:"duration_ms"`
	Error     string `json:"error,omitempty"`
}

type BenchmarkResult struct {
	Algorithm string  `json:"algorithm"`
	Iterations int    `json:"iterations"`
	DurationMs int64 `json:"duration_ms"`
	OpsPerSec  float64 `json:"ops_per_sec"`
}

func hashMD5(data string) string {
	h := md5.New()
	h.Write([]byte(data))
	return hex.EncodeToString(h.Sum(nil))
}

func hashSHA1(data string) string {
	h := sha1.New()
	h.Write([]byte(data))
	return hex.EncodeToString(h.Sum(nil))
}

func hashSHA256(data string) string {
	h := sha256.New()
	h.Write([]byte(data))
	return hex.EncodeToString(h.Sum(nil))
}

func hashSHA512(data string) string {
	h := sha512.New()
	h.Write([]byte(data))
	return hex.EncodeToString(h.Sum(nil))
}

func encryptAES(plaintext, key string) (string, error) {
	block, err := aes.NewCipher([]byte(key))
	if err != nil {
		return "", err
	}

	gcm, err := cipher.NewGCM(block)
	if err != nil {
		return "", err
	}

	nonce := make([]byte, gcm.NonceSize())
	if _, err = io.ReadFull(rand.Reader, nonce); err != nil {
		return "", err
	}

	ciphertext := gcm.Seal(nonce, nonce, []byte(plaintext), nil)
	return base64.StdEncoding.EncodeToString(ciphertext), nil
}

func decryptAES(ciphertext, key string) (string, error) {
	data, err := base64.StdEncoding.DecodeString(ciphertext)
	if err != nil {
		return "", err
	}

	block, err := aes.NewCipher([]byte(key))
	if err != nil {
		return "", err
	}

	gcm, err := cipher.NewGCM(block)
	if err != nil {
		return "", err
	}

	nonceSize := gcm.NonceSize()
	if len(data) < nonceSize {
		return "", fmt.Errorf("ciphertext too short")
	}

	nonce, ciphertextBytes := data[:nonceSize], data[nonceSize:]
	plaintext, err := gcm.Open(nil, nonce, ciphertextBytes, nil)
	if err != nil {
		return "", err
	}

	return string(plaintext), nil
}

func benchmarkHash(algorithm string, iterations int) BenchmarkResult {
	result := BenchmarkResult{
		Algorithm:  algorithm,
		Iterations: iterations,
	}

	testData := "benchmark test data for hashing performance testing"
	start := time.Now()

	for i := 0; i < iterations; i++ {
		switch algorithm {
		case "md5":
			hashMD5(testData)
		case "sha1":
			hashSHA1(testData)
		case "sha256":
			hashSHA256(testData)
		case "sha512":
			hashSHA512(testData)
		}
	}

	result.DurationMs = time.Since(start).Milliseconds()
	result.OpsPerSec = float64(iterations) / (float64(result.DurationMs) / 1000.0)

	return result
}

func main() {
	if len(os.Args) < 2 {
		fmt.Println(`{"error": "Usage: crypto_tool <command> [args...]"}`)
		fmt.Println(`Commands:`)
		fmt.Println(`  hash <algorithm> <data>        → MD5, SHA1, SHA256, SHA512`)
		fmt.Println(`  encrypt <data> <key>           → AES-GCM encryption`)
		fmt.Println(`  decrypt <ciphertext> <key>     → AES-GCM decryption`)
		fmt.Println(`  benchmark <algorithm> <iter>   → Performance test`)
		fmt.Println(`  generate_key <length>          → Random key generation`)
		os.Exit(1)
	}

	command := os.Args[1]

	switch command {
	case "hash":
		if len(os.Args) < 4 {
			fmt.Println(`{"error": "Usage: hash <algorithm> <data>"}`)
			os.Exit(1)
		}
		algo := os.Args[2]
		data := os.Args[3]

		start := time.Now()
		var result string

		switch algo {
		case "md5":
			result = hashMD5(data)
		case "sha1":
			result = hashSHA1(data)
		case "sha256":
			result = hashSHA256(data)
		case "sha512":
			result = hashSHA512(data)
		default:
			fmt.Printf(`{"error": "Unknown algorithm: %s"}`, algo)
			os.Exit(1)
		}

		cryptoResult := CryptoResult{
			Algorithm: algo,
			Input:     data,
			Output:    result,
			Duration:  time.Since(start).Milliseconds(),
		}

		jsonData, _ := json.Marshal(cryptoResult)
		fmt.Println(string(jsonData))

	case "encrypt":
		if len(os.Args) < 4 {
			fmt.Println(`{"error": "Usage: encrypt <data> <key> (key must be 16/24/32 bytes)"}`)
			os.Exit(1)
		}
		data := os.Args[2]
		key := os.Args[3]

		start := time.Now()
		encrypted, err := encryptAES(data, key)
		result := CryptoResult{
			Algorithm: "aes-gcm",
			Input:     data,
			Duration:  time.Since(start).Milliseconds(),
		}

		if err != nil {
			result.Error = err.Error()
		} else {
			result.Output = encrypted
		}

		jsonData, _ := json.Marshal(result)
		fmt.Println(string(jsonData))

	case "decrypt":
		if len(os.Args) < 4 {
			fmt.Println(`{"error": "Usage: decrypt <ciphertext> <key>"}`)
			os.Exit(1)
		}
		ciphertext := os.Args[2]
		key := os.Args[3]

		start := time.Now()
		decrypted, err := decryptAES(ciphertext, key)
		result := CryptoResult{
			Algorithm: "aes-gcm",
			Input:     ciphertext,
			Duration:  time.Since(start).Milliseconds(),
		}

		if err != nil {
			result.Error = err.Error()
		} else {
			result.Output = decrypted
		}

		jsonData, _ := json.Marshal(result)
		fmt.Println(string(jsonData))

	case "benchmark":
		if len(os.Args) < 4 {
			fmt.Println(`{"error": "Usage: benchmark <algorithm> <iterations>"}`)
			os.Exit(1)
		}
		algo := os.Args[2]
		var iterations int
		fmt.Sscanf(os.Args[3], "%d", &iterations)

		result := benchmarkHash(algo, iterations)
		jsonData, _ := json.Marshal(result)
		fmt.Println(string(jsonData))

	case "generate_key":
		length := 32 // Default 256-bit
		if len(os.Args) >= 3 {
			fmt.Sscanf(os.Args[2], "%d", &length)
		}

		key := make([]byte, length)
		rand.Read(key)

		result := map[string]string{
			"key":       base64.StdEncoding.EncodeToString(key),
			"hex":       hex.EncodeToString(key),
			"length":    fmt.Sprintf("%d", length),
			"algorithm": "random",
		}

		jsonData, _ := json.Marshal(result)
		fmt.Println(string(jsonData))

	default:
		fmt.Printf(`{"error": "Unknown command: %s"}`, command)
		os.Exit(1)
	}
}
