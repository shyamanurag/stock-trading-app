package main

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/spf13/viper"
	"github.com/yourusername/stockmarket-app/internal/handlers"
	"github.com/yourusername/stockmarket-app/internal/middleware"
	"github.com/yourusername/stockmarket-app/internal/repositories"
	"github.com/yourusername/stockmarket-app/internal/services"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

func main() {
	// Load configuration
	loadConfig()

	// Setup logging
	setupLogging()

	// Connect to database
	db := setupDatabase()

	// Initialize repositories
	userRepo := repositories.NewUserRepository(db)
	orderRepo := repositories.NewOrderRepository(db)
	marketRepo := repositories.NewMarketRepository(db)
	portfolioRepo := repositories.NewPortfolioRepository(db)
	paymentRepo := repositories.NewPaymentRepository(db)
	kycRepo := repositories.NewKYCRepository(db)

	// Initialize services
	jwtService := services.NewJWTService(viper.GetString("jwt.secret"), viper.GetInt("jwt.expiry"))
	marketDataService := services.NewMarketDataService()
	userService := services.NewUserService(userRepo, jwtService)
	orderService := services.NewOrderService(orderRepo, marketRepo, portfolioRepo)
	tradingService := services.NewTradingService(orderRepo, marketRepo, portfolioRepo)
	portfolioService := services.NewPortfolioService(portfolioRepo, marketRepo)
	paymentService := services.NewPaymentService(paymentRepo, userRepo)
	kycService := services.NewKYCService(kycRepo, userRepo)
	
	// Initialize WebSocket hub
	hub := services.NewWebSocketHub()
	go hub.Run()

	// Create Gin router and setup middlewares
	router := setupRouter()

	// Initialize handlers
	authHandler := handlers.NewAuthHandler(userService, jwtService)
	userHandler := handlers.NewUserHandler(userService)
	marketHandler := handlers.NewMarketHandler(marketDataService)
	orderHandler := handlers.NewOrderHandler(orderService, tradingService)
	portfolioHandler := handlers.NewPortfolioHandler(portfolioService)
	paymentHandler := handlers.NewPaymentHandler(paymentService)
	kycHandler := handlers.NewKYCHandler(kycService)
	wsHandler := handlers.NewWebSocketHandler(hub)
	adminHandler := handlers.NewAdminHandler(userService, kycService, paymentService)

	// Register routes
	registerRoutes(router, 
		authHandler, 
		userHandler, 
		marketHandler, 
		orderHandler, 
		portfolioHandler, 
		paymentHandler, 
		kycHandler, 
		wsHandler,
		adminHandler,
	)

	// Start the server
	startServer(router)
}

func loadConfig() {
	viper.SetConfigName("config")
	viper.SetConfigType("yaml")
	viper.AddConfigPath("./config")
	viper.AutomaticEnv()

	if err := viper.ReadInConfig(); err != nil {
		log.Fatalf("Failed to read config file: %v", err)
	}
}

func setupLogging() {
	// Set log format
	log.SetFlags(log.LstdFlags | log.Lshortfile)
	
	// Set Gin mode
	if viper.GetString("environment") == "production" {
		gin.SetMode(gin.ReleaseMode)
	}
}

func setupDatabase() *gorm.DB {
	dsn := fmt.Sprintf(
		"host=%s user=%s password=%s dbname=%s port=%s sslmode=disable TimeZone=Asia/Kolkata",
		viper.GetString("database.host"),
		viper.GetString("database.user"),
		viper.GetString("database.password"),
		viper.GetString("database.name"),
		viper.GetString("database.port"),
	)

	gormConfig := &gorm.Config{
		Logger: logger.Default.LogMode(logger.Info),
	}

	db, err := gorm.Open(postgres.Open(dsn), gormConfig)
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}

	// Auto migrate the schema
	// db.AutoMigrate(&models.User{}, &models.Order{}, &models.Portfolio{}, &models.Payment{}, &models.KYC{})

	return db
}

func setupRouter() *gin.Engine {
	router := gin.Default()

	// CORS configuration
	router.Use(cors.New(cors.Config{
		AllowOrigins:     viper.GetStringSlice("cors.allowed_origins"),
		AllowMethods:     viper.GetStringSlice("cors.allowed_methods"),
		AllowHeaders:     viper.GetStringSlice("cors.allowed_headers"),
		ExposeHeaders:    viper.GetStringSlice("cors.exposed_headers"),
		AllowCredentials: viper.GetBool("cors.allow_credentials"),
		MaxAge:           viper.GetDuration("cors.max_age"),
	}))

	// Security headers middleware
	router.Use(middleware.SecurityHeaders())

	// Rate limiting middleware
	router.Use(middleware.RateLimiter())

	return router
}

func registerRoutes(
	router *gin.Engine,
	authHandler *handlers.AuthHandler,
	userHandler *handlers.UserHandler,
	marketHandler *handlers.MarketHandler,
	orderHandler *handlers.OrderHandler,
	portfolioHandler *handlers.PortfolioHandler,
	paymentHandler *handlers.PaymentHandler,
	kycHandler *handlers.KYCHandler,
	wsHandler *handlers.WebSocketHandler,
	adminHandler *handlers.AdminHandler,
) {
	// Health check
	router.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "ok"})
	})

	// API version group
	v1 := router.Group("/api/v1")
	{
		// Public routes
		v1.POST("/auth/register", authHandler.Register)
		v1.POST("/auth/login", authHandler.Login)
		v1.POST("/auth/refresh", authHandler.RefreshToken)
		v1.GET("/market/symbols", marketHandler.GetSymbols)
		v1.GET("/market/indices", marketHandler.GetIndices)

		// WebSocket endpoint
		v1.GET("/ws", wsHandler.HandleConnection)

		// Auth required routes
		authorized := v1.Group("/")
		authorized.Use(middleware.JWTAuth())
		{
			// User routes
			authorized.GET("/user/profile", userHandler.GetProfile)
			authorized.PUT("/user/profile", userHandler.UpdateProfile)
			authorized.PUT("/user/password", userHandler.ChangePassword)
			
			// KYC routes
			authorized.POST("/kyc", kycHandler.SubmitKYC)
			authorized.GET("/kyc/status", kycHandler.GetKYCStatus)
			
			// Market data routes
			authorized.GET("/market/quote/:symbol", marketHandler.GetQuote)
			authorized.GET("/market/history/:symbol", marketHandler.GetHistoricalData)
			authorized.GET("/market/depth/:symbol", marketHandler.GetMarketDepth)
			
			// Watchlist routes
			authorized.GET("/watchlist", userHandler.GetWatchlists)
			authorized.POST("/watchlist", userHandler.CreateWatchlist)
			authorized.PUT("/watchlist/:id", userHandler.UpdateWatchlist)
			authorized.DELETE("/watchlist/:id", userHandler.DeleteWatchlist)
			
			// Trading routes
			authorized.POST("/orders", orderHandler.PlaceOrder)
			authorized.GET("/orders", orderHandler.GetOrders)
			authorized.GET("/orders/:id", orderHandler.GetOrderDetails)
			authorized.DELETE("/orders/:id", orderHandler.CancelOrder)
			
			// Portfolio routes
			authorized.GET("/portfolio", portfolioHandler.GetPortfolio)
			authorized.GET("/portfolio/performance", portfolioHandler.GetPerformance)
			authorized.GET("/portfolio/holdings", portfolioHandler.GetHoldings)
			
			// Payment routes
			authorized.POST("/payment/deposit", paymentHandler.InitiateDeposit)
			authorized.POST("/payment/withdraw", paymentHandler.InitiateWithdrawal)
			authorized.GET("/payment/transactions", paymentHandler.GetTransactions)
			authorized.GET("/payment/balance", paymentHandler.GetBalance)
		}

		// Admin routes
		admin := v1.Group("/admin")
		admin.Use(middleware.JWTAuth(), middleware.AdminOnly())
		{
			admin.GET("/users", adminHandler.GetUsers)
			admin.GET("/users/:id", adminHandler.GetUserDetails)
			admin.PUT("/users/:id/status", adminHandler.UpdateUserStatus)
			
			admin.GET("/kyc", adminHandler.GetKYCSubmissions)
			admin.PUT("/kyc/:id/approve", adminHandler.ApproveKYC)
			admin.PUT("/kyc/:id/reject", adminHandler.RejectKYC)
			
			admin.GET("/payments", adminHandler.GetAllPayments)
			admin.PUT("/payments/:id/approve", adminHandler.ApprovePayment)
			admin.PUT("/payments/:id/reject", adminHandler.RejectPayment)
			
			admin.GET("/metrics", adminHandler.GetSystemMetrics)
			admin.GET("/logs", adminHandler.GetSystemLogs)
		}

		// Algo trading routes
		algo := v1.Group("/algo")
		algo.Use(middleware.JWTAuth())
		{
			algo.POST("/strategy", orderHandler.CreateStrategy)
			algo.GET("/strategy", orderHandler.GetStrategies)
			algo.GET("/strategy/:id", orderHandler.GetStrategyDetails)
			algo.PUT("/strategy/:id", orderHandler.UpdateStrategy)
			algo.DELETE("/strategy/:id", orderHandler.DeleteStrategy)
			algo.POST("/strategy/:id/backtest", orderHandler.BacktestStrategy)
			algo.POST("/strategy/:id/activate", orderHandler.ActivateStrategy)
			algo.POST("/strategy/:id/deactivate", orderHandler.DeactivateStrategy)
		}
	}
}

func startServer(router *gin.Engine) {
	server := &http.Server{
		Addr:    fmt.Sprintf(":%s", viper.GetString("server.port")),
		Handler: router,
	}

	// Start server in a goroutine
	go func() {
		log.Printf("Server starting on port %s\n", viper.GetString("server.port"))
		if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("Failed to start server: %v", err)
		}
	}()

	// Wait for interrupt signal to gracefully shutdown the server
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit
	log.Println("Shutting down server...")

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	if err := server.Shutdown(ctx); err != nil {
		log.Fatalf("Server shutdown failed: %v", err)
	}

	log.Println("Server exited properly")
}
