// File: backend/main.go

package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
	swaggerFiles "github.com/swaggo/files"
	ginSwagger "github.com/swaggo/gin-swagger"

	_ "github.com/yourusername/papertrader/docs" // Import swagger docs
	"github.com/yourusername/papertrader/middleware"
	"github.com/yourusername/papertrader/controllers"
	"github.com/yourusername/papertrader/services"
	"github.com/yourusername/papertrader/repositories"
	"github.com/yourusername/papertrader/config"
	"github.com/yourusername/papertrader/database"
)

// @title PaperTrader API
// @version 1.0
// @description API for PaperTrader paper trading application
// @host localhost:8080
// @BasePath /api
// @schemes http https
// @securityDefinitions.apikey BearerAuth
// @in header
// @name Authorization
func main() {
	// Load environment variables
	if err := godotenv.Load(); err != nil {
		log.Println("Warning: .env file not found, using environment variables")
	}

	// Set Gin mode
	if os.Getenv("APP_ENV") == "production" {
		gin.SetMode(gin.ReleaseMode)
	} else {
		gin.SetMode(gin.DebugMode)
	}

	// Initialize config
	appConfig := config.NewConfig()

	// Initialize database
	db, err := database.InitDB(appConfig)
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}

	// Initialize Redis
	redisClient, err := database.InitRedis(appConfig)
	if err != nil {
		log.Fatalf("Failed to connect to Redis: %v", err)
	}

	// Initialize repositories
	userRepo := repositories.NewUserRepository(db)
	portfolioRepo := repositories.NewPortfolioRepository(db)
	positionRepo := repositories.NewPositionRepository(db)
	transactionRepo := repositories.NewTransactionRepository(db)
	watchlistRepo := repositories.NewWatchlistRepository(db)

	// Initialize services
	stockService := services.NewStockService(appConfig)
	authService := services.NewAuthService(userRepo, appConfig, redisClient)
	userService := services.NewUserService(userRepo)
	portfolioService := services.NewPortfolioService(portfolioRepo, positionRepo)
	transactionService := services.NewTransactionService(transactionRepo, portfolioRepo, positionRepo, stockService)
	watchlistService := services.NewWatchlistService(watchlistRepo)

	// Initialize controllers
	authController := controllers.NewAuthController(authService, userService)
	userController := controllers.NewUserController(userService)
	stockController := controllers.NewStockController(stockService)
	portfolioController := controllers.NewPortfolioController(portfolioService)
	transactionController := controllers.NewTransactionController(transactionService)
	watchlistController := controllers.NewWatchlistController(watchlistService)

	// Setup router
	router := gin.Default()

	// Middleware
	router.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:3000", appConfig.FrontendURL},
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))

	// Security middleware
	router.Use(middleware.SecurityHeaders())
	router.Use(middleware.RequestLogger())
	router.Use(middleware.Recovery())

	// Health check endpoint
	router.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"status": "OK",
			"time":   time.Now().Format(time.RFC3339),
		})
	})

	// API routes
	api := router.Group("/api")
	{
		// Swagger documentation
		api.GET("/docs/*any", ginSwagger.WrapHandler(swaggerFiles.Handler))

		// Auth routes
		auth := api.Group("/auth")
		{
			auth.POST("/register", authController.Register)
			auth.POST("/login", authController.Login)
			auth.POST("/refresh", authController.RefreshToken)
			auth.POST("/logout", middleware.AuthRequired(), authController.Logout)
			auth.POST("/forgot-password", authController.ForgotPassword)
			auth.POST("/reset-password", authController.ResetPassword)
			auth.POST("/demo", authController.DemoLogin)
		}

		// User routes
		users := api.Group("/users")
		users.Use(middleware.AuthRequired())
		{
			users.GET("/me", userController.GetCurrentUser)
			users.PUT("/me", userController.UpdateUser)
			users.PUT("/me/password", userController.ChangePassword)
		}

		// Stock routes
		stocks := api.Group("/stocks")
		{
			// Public routes
			stocks.GET("/search", stockController.SearchStocks)
			stocks.GET("/quote/:symbol", stockController.GetStockQuote)
			stocks.GET("/batch", stockController.GetBatchQuotes)

			// Protected routes
			authenticated := stocks.Group("/")
			authenticated.Use(middleware.AuthRequired())
			{
				authenticated.GET("/history/:symbol", stockController.GetHistoricalData)
			}
		}

		// Portfolio routes (all protected)
		portfolio := api.Group("/portfolio")
		portfolio.Use(middleware.AuthRequired())
		{
			portfolio.GET("", portfolioController.GetPortfolio)
			portfolio.GET("/performance", portfolioController.GetPerformance)
			portfolio.GET("/allocation", portfolioController.GetAllocation)
		}

		// Transaction routes (all protected)
		transactions := api.Group("/transactions")
		transactions.Use(middleware.AuthRequired())
		{
			transactions.GET("", transactionController.GetAllTransactions)
			transactions.POST("/buy", transactionController.BuyStock)
			transactions.POST("/sell", transactionController.SellStock)
		}

		// Watchlist routes (all protected)
		watchlists := api.Group("/watchlists")
		watchlists.Use(middleware.AuthRequired())
		{
			watchlists.GET("", watchlistController.GetAllWatchlists)
			watchlists.POST("", watchlistController.CreateWatchlist)
			watchlists.GET("/:id", watchlistController.GetWatchlist)
			watchlists.PUT("/:id", watchlistController.UpdateWatchlist)
			watchlists.DELETE("/:id", watchlistController.DeleteWatchlist)

			// Watchlist stocks
			watchlists.POST("/:id/stocks", watchlistController.AddStockToWatchlist)
			watchlists.DELETE("/:id/stocks/:symbol", watchlistController.RemoveStockFromWatchlist)
		}
	}

	// Set up the server
	srv := &http.Server{
		Addr:    ":" + appConfig.ServerPort,
		Handler: router,
	}

	// Start the server in a goroutine
	go func() {
		log.Printf("Server starting on port %s\n", appConfig.ServerPort)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("Failed to start server: %v\n", err)
		}
	}()

	// Wait for interrupt signal to gracefully shut down the server
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit
	log.Println("Shutting down server...")

	// Create a deadline for server shutdown
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	// Attempt graceful shutdown
	if err := srv.Shutdown(ctx); err != nil {
		log.Fatalf("Server forced to shutdown: %v\n", err)
	}

	log.Println("Server exited successfully")
}
