package main

import (
	"flag"
	"fmt"
	"log"
	"os"
	"path/filepath"

	"github.com/golang-migrate/migrate/v4"
	_ "github.com/golang-migrate/migrate/v4/database/postgres"
	_ "github.com/golang-migrate/migrate/v4/source/file"
)

func main() {
	// Define command line flags
	migrateCmd := flag.String("command", "up", "Migration command (up, down, version)")
	migrationsPath := flag.String("path", "internal/database/migrations", "Path to migration files")
	steps := flag.Int("steps", 0, "Number of steps (0 = all)")
	flag.Parse()

	// Get database connection parameters from environment
	dbHost := getEnv("DB_HOST", "localhost")
	dbPort := getEnv("DB_PORT", "5432")
	dbUser := getEnv("DB_USER", "postgres")
	dbPassword := getEnv("DB_PASSWORD", "postgres")
	dbName := getEnv("DB_NAME", "trading_dev")
	sslMode := getEnv("DB_SSLMODE", "disable")

	// Format database connection string
	dbURL := fmt.Sprintf("postgres://%s:%s@%s:%s/%s?sslmode=%s",
		dbUser, dbPassword, dbHost, dbPort, dbName, sslMode)

	// Get absolute path to migrations
	absPath, err := filepath.Abs(*migrationsPath)
	if err != nil {
		log.Fatalf("Failed to get absolute path to migrations: %v", err)
	}

	// Create a new migrate instance
	m, err := migrate.New("file://"+absPath, dbURL)
	if err != nil {
		log.Fatalf("Failed to create migrate instance: %v", err)
	}

	// Ensure migrate instance is closed
	defer func() {
		srcErr, dbErr := m.Close()
		if srcErr != nil {
			log.Printf("Error closing source: %v", srcErr)
		}
		if dbErr != nil {
			log.Printf("Error closing database: %v", dbErr)
		}
	}()

	// Execute migration command
	switch *migrateCmd {
	case "up":
		if *steps > 0 {
			err = m.Steps(*steps)
		} else {
			err = m.Up()
		}
	case "down":
		if *steps > 0 {
			err = m.Steps(-(*steps))
		} else {
			err = m.Down()
		}
	case "version":
		version, dirty, verErr := m.Version()
		if verErr != nil {
			log.Fatalf("Failed to get version: %v", verErr)
		}
		log.Printf("Current migration version: %d, Dirty: %v", version, dirty)
		return
	default:
		log.Fatalf("Invalid command: %s. Supported commands: up, down, version", *migrateCmd)
	}

	// Check for migration errors
	if err != nil && err != migrate.ErrNoChange {
		log.Fatalf("Migration failed: %v", err)
	}

	log.Printf("Migration command '%s' executed successfully", *migrateCmd)
}

// Helper function to get environment variables with fallback
func getEnv(key, fallback string) string {
	if value, exists := os.LookupEnv(key); exists {
		return value
	}
	return fallback
}
