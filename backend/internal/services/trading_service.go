// stock-trading-app/backend/internal/services/trading_service.go

package services

import (
	"context"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/shyamanurag/stock-trading-app/backend/internal/models"
	"github.com/shyamanurag/stock-trading-app/backend/internal/repository"
)

// TradingService handles trade order execution
type TradingService struct {
	orderRepo      *repository.OrderRepository
	holdingRepo    *repository.HoldingRepository
	walletRepo     *repository.WalletRepository
	tradeHistRepo  *repository.TradeHistoryRepository
	transactionMgr *repository.TransactionManager
	marketData     *MarketDataService
}

// NewTradingService creates a new TradingService
func NewTradingService(
	orderRepo *repository.OrderRepository,
	holdingRepo *repository.HoldingRepository,
	walletRepo *repository.WalletRepository,
	tradeHistRepo *repository.TradeHistoryRepository,
	transactionMgr *repository.TransactionManager,
	marketData *MarketDataService,
) *TradingService {
	return &TradingService{
		orderRepo:      orderRepo,
		holdingRepo:    holdingRepo,
		walletRepo:     walletRepo,
		tradeHistRepo:  tradeHistRepo,
		transactionMgr: transactionMgr,
		marketData:     marketData,
	}
}

// PlaceOrder handles placing a new order
func (s *TradingService) PlaceOrder(ctx context.Context, order *models.Order) (*models.Order, error) {
	// Set default values
	if order.ID == uuid.Nil {
		order.ID = uuid.New()
	}
	order.Status = "PENDING"
	order.RemainingQuantity = order.Quantity
	order.FilledQuantity = 0

	// Validate order
	if err := s.validateOrder(ctx, order); err != nil {
		return nil, err
	}

	// Handle the order within a transaction
	err := s.transactionMgr.WithTransaction(ctx, func(tx *gorm.DB) error {
		// Step 1: Reserve funds or securities depending on order type
		if err := s.reserveFundsOrSecurities(ctx, tx, order); err != nil {
			return err
		}

		// Step 2: Store the order
		orderRepo := repository.NewOrderRepository(tx)
		if err := orderRepo.Create(ctx, order); err != nil {
			return fmt.Errorf("failed to create order: %w", err)
		}

		// Step 3: If it's a market order, try to execute it immediately
		if order.OrderType == "MARKET" {
			if err := s.executeMarketOrder(ctx, tx, order); err != nil {
				return fmt.Errorf("failed to execute market order: %w", err)
			}
		}

		return nil
	})

	if err != nil {
		return nil, err
	}

	return order, nil
}

// validateOrder validates an order
func (s *TradingService) validateOrder(ctx context.Context, order *models.Order) error {
	// Check if order has required fields
	if order.UserID == uuid.Nil || order.Symbol == "" || order.Quantity <= 0 {
		return fmt.Errorf("invalid order parameters")
	}

	// Validate OrderType
	switch order.OrderType {
	case "MARKET":
		// Market orders don't need a price
	case "LIMIT":
		if order.Price == nil || *order.Price <= 0 {
			return fmt.Errorf("limit orders require a valid price")
		}
	case "STOP":
		if order.StopPrice == nil || *order.StopPrice <= 0 {
			return fmt.Errorf("stop orders require a valid stop price")
		}
	default:
		return fmt.Errorf("invalid order type: %s", order.OrderType)
	}

	// Validate Side
	if order.Side != "BUY" && order.Side != "SELL" {
		return fmt.Errorf("invalid order side: %s", order.Side)
	}

	return nil
}

// reserveFundsOrSecurities reserves funds for buy orders or securities for sell orders
func (s *TradingService) reserveFundsOrSecurities(ctx context.Context, tx *gorm.DB, order *models.Order) error {
	if order.Side == "BUY" {
		// For buy orders, reserve funds in the wallet
		return s.reserveFunds(ctx, tx, order)
	} else {
		// For sell orders, check if the user has enough securities
		return s.reserveSecurities(ctx, tx, order)
	}
}

// reserveFunds reserves funds for a buy order
func (s *TradingService) reserveFunds(ctx context.Context, tx *gorm.DB, order *models.Order) error {
	walletRepo := repository.NewWalletRepository(tx)
	wallet, err := walletRepo.GetByUserID(ctx, order.UserID)
	if err != nil {
		return fmt.Errorf("failed to get wallet: %w", err)
	}

	if wallet == nil {
		return fmt.Errorf("wallet not found for user")
	}

	// Calculate required funds
	var requiredFunds float64
	if order.OrderType == "MARKET" {
		// For market orders, use current price plus a buffer (e.g., 5%)
		marketPrice, err := s.marketData.GetCurrentPrice(ctx, order.Symbol)
		if err != nil {
			return fmt.Errorf("failed to get current price: %w", err)
		}
		requiredFunds = marketPrice * order.Quantity * 1.05 // 5% buffer
	} else if order.OrderType == "LIMIT" {
		// For limit orders, use the limit price
		requiredFunds = *order.Price * order.Quantity
	} else {
		// For stop orders
		requiredFunds = *order.StopPrice * order.Quantity
	}

	// Add estimated fees (0.1%)
	requiredFunds += requiredFunds * 0.001

	// Check if the wallet has enough funds
	if wallet.Balance < requiredFunds {
		return fmt.Errorf("insufficient funds: required %.2f, available %.2f", requiredFunds, wallet.Balance)
	}

	// Update wallet balance
	wallet.Balance -= requiredFunds
	wallet.HoldBalance += requiredFunds

	// Update wallet
	if err := walletRepo.Update(ctx, wallet); err != nil {
		return fmt.Errorf("failed to update wallet: %w", err)
	}

	return nil
}

// reserveSecurities checks if the user has enough securities for a sell order
func (s *TradingService) reserveSecurities(ctx context.Context, tx *gorm.DB, order *models.Order) error {
	holdingRepo := repository.NewHoldingRepository(tx)
	
	// Get all holdings for the user and symbol
	holdings, err := holdingRepo.GetByUserIDAndSymbol(ctx, order.UserID, order.Symbol)
	if err != nil {
		return fmt.Errorf("failed to get holdings: %w", err)
	}

	// Calculate total quantity across all portfolios
	var totalQuantity float64
	for _, holding := range holdings {
		totalQuantity += holding.Quantity
	}

	if totalQuantity < order.Quantity {
		return fmt.Errorf("insufficient securities: required %.2f, available %.2f", order.Quantity, totalQuantity)
	}

	// Mark securities as reserved (in a real system, you might have a more sophisticated approach)
	// For simplicity, we'll just reduce the quantity from the first available holding
	remainingToReserve := order.Quantity
	for _, holding := range holdings {
		if holding.Quantity >= remainingToReserve {
			holding.Quantity -= remainingToReserve
			if err := holdingRepo.Update(ctx, holding); err != nil {
				return fmt.Errorf("failed to update holding: %w", err)
			}
			break
		} else {
			remainingToReserve -= holding.Quantity
			holding.Quantity = 0
			if err := holdingRepo.Update(ctx, holding); err != nil {
				return fmt.Errorf("failed to update holding: %w", err)
			}
		}
	}

	return nil
}

// executeMarketOrder executes a market order immediately
func (s *TradingService) executeMarketOrder(ctx context.Context, tx *gorm.DB, order *models.Order) error {
	// Get current market price
	marketPrice, err := s.marketData.GetCurrentPrice(ctx, order.Symbol)
	if err != nil {
		return fmt.Errorf("failed to get current price: %w", err)
	}

	// Record the execution
	now := time.Now()
	order.Status = "FILLED"
	order.FilledQuantity = order.Quantity
	order.RemainingQuantity = 0
	order.ExecutedAt = &now

	// Update order
	orderRepo := repository.NewOrderRepository(tx)
	if err := orderRepo.Update(ctx, order); err != nil {
		return fmt.Errorf("failed to update order: %w", err)
	}

	// Create trade history
	tradeHistRepo := repository.NewTradeHistoryRepository(tx)
	tradeHistory := &models.TradeHistory{
		ID:        uuid.New(),
		UserID:    order.UserID,
		OrderID:   order.ID,
		Symbol:    order.Symbol,
		Side:      order.Side,
		Quantity:  order.Quantity,
		Price:     marketPrice,
		Timestamp: now,
		Fee:       marketPrice * order.Quantity * 0.001, // 0.1% fee
	}

	if err := tradeHistRepo.Create(ctx, tradeHistory); err != nil {
		return fmt.Errorf("failed to create trade history: %w", err)
	}

	// Update portfolio holdings
	if err := s.updateHoldings(ctx, tx, order, marketPrice); err != nil {
		return fmt.Errorf("failed to update holdings: %w", err)
	}

	// Update wallet
	if err := s.finalizeWalletTransaction(ctx, tx, order, marketPrice, tradeHistory.Fee); err != nil {
		return fmt.Errorf("failed to finalize wallet transaction: %w", err)
	}

	return nil
}

// updateHoldings updates portfolio holdings after a trade
func (s *TradingService) updateHoldings(ctx context.Context, tx *gorm.DB, order *models.Order, executionPrice float64) error {
	holdingRepo := repository.NewHoldingRepository(tx)
	
	// Get default portfolio
	portfolioRepo := repository.NewPortfolioRepository(tx)
	portfolios, err := portfolioRepo.GetByUserID(ctx, order.UserID)
	if err != nil {
		return fmt.Errorf("failed to get portfolios: %w", err)
	}
	
	if len(portfolios) == 0 {
		// Create default portfolio if none exists
		defaultPortfolio := &models.Portfolio{
			ID:          uuid.New(),
			UserID:      order.UserID,
			Name:        "Default Portfolio",
			Description: "Default portfolio created automatically",
		}
		if err := portfolioRepo.Create(ctx, defaultPortfolio); err != nil {
			return fmt.Errorf("failed to create default portfolio: %w", err)
		}
		portfolios = append(portfolios, defaultPortfolio)
	}
	
	defaultPortfolio := portfolios[0]
	
	// Get existing holding or create new one
	holding, err := holdingRepo.GetByPortfolioIDAndSymbol(ctx, defaultPortfolio.ID, order.Symbol)
	if err != nil {
		return fmt.Errorf("failed to get holding: %w", err)
	}
	
	if holding == nil {
		// Create new holding
		holding = &models.Holding{
			ID:           uuid.New(),
			PortfolioID:  defaultPortfolio.ID,
			Symbol:       order.Symbol,
			Quantity:     0,
			AveragePrice: 0,
			LastUpdated:  time.Now(),
		}
	}
	
	// Update holding based on order side
	if order.Side == "BUY" {
		// Calculate new average price
		totalValue := holding.Quantity * holding.AveragePrice
		newValue := order.Quantity * executionPrice
		newTotalQuantity := holding.Quantity + order.Quantity
		
		if newTotalQuantity > 0 {
			holding.AveragePrice = (totalValue + newValue) / newTotalQuantity
		}
		
		holding.Quantity = newTotalQuantity
	} else { // SELL
		// Just reduce quantity for sells
		holding.Quantity -= order.Quantity
	}
	
	holding.LastUpdated = time.Now()
	
	// Save or update holding
	if holding.ID == uuid.Nil {
		if err := holdingRepo.Create(ctx, holding); err != nil {
			return fmt.Errorf("failed to create holding: %w", err)
		}
	} else {
		if err := holdingRepo.Update(ctx, holding); err != nil {
			return fmt.Errorf("failed to update holding: %w", err)
		}
	}
	
	return nil
}

// finalizeWalletTransaction updates the wallet after a trade is executed
func (s *TradingService) finalizeWalletTransaction(ctx context.Context, tx *gorm.DB, order *models.Order, executionPrice float64, fee float64) error {
	walletRepo := repository.NewWalletRepository(tx)
	wallet, err := walletRepo.GetByUserID(ctx, order.UserID)
	if err != nil {
		return fmt.Errorf("failed to get wallet: %w", err)
	}
	
	if wallet == nil {
		return fmt.Errorf("wallet not found for user")
	}
	
	// Create transaction record
	transactionRepo := repository.NewTransactionRepository(tx)
	
	if order.Side == "BUY" {
		// For buy orders, move from hold balance to final transaction
		totalCost := executionPrice * order.Quantity + fee
		
		// Adjust hold balance (might be different from actual execution price)
		wallet.HoldBalance -= totalCost
		
		// Create transaction record
		transaction := &models.Transaction{
			ID:          uuid.New(),
			WalletID:    wallet.ID,
			Type:        "TRADE",
			Amount:      -totalCost,
			Description: fmt.Sprintf("Buy %f shares of %s at %f", order.Quantity, order.Symbol, executionPrice),
			Status:      "COMPLETED",
			OrderID:     &order.ID,
			CreatedAt:   time.Now(),
			UpdatedAt:   time.Now(),
		}
		
		if err := transactionRepo.Create(ctx, transaction); err != nil {
			return fmt.Errorf("failed to create transaction: %w", err)
		}
		
		// Create fee transaction
		feeTransaction := &models.Transaction{
			ID:          uuid.New(),
			WalletID:    wallet.ID,
			Type:        "FEE",
			Amount:      -fee,
			Description: fmt.Sprintf("Fee for buy order %s", order.ID),
			Status:      "COMPLETED",
			OrderID:     &order.ID,
			CreatedAt:   time.Now(),
			UpdatedAt:   time.Now(),
		}
		
		if err := transactionRepo.Create(ctx, feeTransaction); err != nil {
			return fmt.Errorf("failed to create fee transaction: %w", err)
		}
	} else { // SELL
		// For sell orders, add funds to wallet
		totalAmount := executionPrice * order.Quantity - fee
		wallet.Balance += totalAmount
		
		// Create transaction record
		transaction := &models.Transaction{
			ID:          uuid.New(),
			WalletID:    wallet.ID,
			Type:        "TRADE",
			Amount:      totalAmount,
			Description: fmt.Sprintf("Sell %f shares of %s at %f", order.Quantity, order.Symbol, executionPrice),
			Status:      "COMPLETED",
			OrderID:     &order.ID,
			CreatedAt:   time.Now(),
			UpdatedAt:   time.Now(),
		}
		
		if err := transactionRepo.Create(ctx, transaction); err != nil {
			return fmt.Errorf("failed to create transaction: %w", err)
		}
		
		// Create fee transaction
		feeTransaction := &models.Transaction{
			ID:          uuid.New(),
			WalletID:    wallet.ID,
			Type:        "FEE",
			Amount:      -fee,
			Description: fmt.Sprintf("Fee for sell order %s", order.ID),
			Status:      "COMPLETED",
			OrderID:     &order.ID,
			CreatedAt:   time.Now(),
			UpdatedAt:   time.Now(),
		}
		
		if err := transactionRepo.Create(ctx, feeTransaction); err != nil {
			return fmt.Errorf("failed to create fee transaction: %w", err)
		}
	}
	
	// Update wallet
	if err := walletRepo.Update(ctx, wallet); err != nil {
		return fmt.Errorf("failed to update wallet: %w", err)
	}
	
	return nil
}

// CancelOrder cancels an order
func (s *TradingService) CancelOrder(ctx context.Context, orderID uuid.UUID, userID uuid.UUID) error {
	return s.transactionMgr.WithTransaction(ctx, func(tx *gorm.DB) error {
		orderRepo := repository.NewOrderRepository(tx)
		order, err := orderRepo.GetByID(ctx, orderID)
		if err != nil {
			return fmt.Errorf("failed to get order: %w", err)
		}
		
		if order == nil {
			return fmt.Errorf("order not found")
		}
		
		// Verify order belongs to user
		if order.UserID != userID {
			return fmt.Errorf("order does not belong to user")
		}
		
		// Check if order can be cancelled
		if order.Status != "PENDING" {
			return fmt.Errorf("cannot cancel order with status: %s", order.Status)
		}
		
		// Update order status
		now := time.Now()
		order.Status = "CANCELLED"
		order.CancelledAt = &now
		
		if err := orderRepo.Update(ctx, order); err != nil {
			return fmt.Errorf("failed to update order: %w", err)
		}
		
		// Release reserved funds or securities
		if order.Side == "BUY" {
			return s.releaseReservedFunds(ctx, tx, order)
		} else {
			return s.releaseReservedSecurities(ctx, tx, order)
		}
	})
}

// releaseReservedFunds releases funds reserved for a buy order
func (s *TradingService) releaseReservedFunds(ctx context.Context, tx *gorm.DB, order *models.Order) error {
	walletRepo := repository.NewWalletRepository(tx)
	wallet, err := walletRepo.GetByUserID(ctx, order.UserID)
	if err != nil {
		return fmt.Errorf("failed to get wallet: %w", err)
	}
	
	if wallet == nil {
		return fmt.Errorf("wallet not found for user")
	}
	
	// Calculate reserved amount
	var reservedAmount float64
	if order.OrderType == "MARKET" {
		// For market orders, estimate was current price plus buffer
		marketPrice, err := s.marketData.GetCurrentPrice(ctx, order.Symbol)
		if err != nil {
			return fmt.Errorf("failed to get current price: %w", err)
		}
		reservedAmount = marketPrice * order.Quantity * 1.05 // 5% buffer
	} else if order.OrderType == "LIMIT" {
		reservedAmount = *order.Price * order.Quantity
	} else {
		reservedAmount = *order.StopPrice * order.Quantity
	}
	
	// Add estimated fees
	reservedAmount += reservedAmount * 0.001
	
	// Return funds from hold to available balance
	wallet.HoldBalance -= reservedAmount
	wallet.Balance += reservedAmount
	
	// Update wallet
	if err := walletRepo.Update(ctx, wallet); err != nil {
		return fmt.Errorf("failed to update wallet: %w", err)
	}
	
	// Create transaction record
	transactionRepo := repository.NewTransactionRepository(tx)
	transaction := &models.Transaction{
		ID:          uuid.New(),
		WalletID:    wallet.ID,
		Type:        "REFUND",
		Amount:      reservedAmount,
		Description: fmt.Sprintf("Refund for cancelled order %s", order.ID),
		Status:      "COMPLETED",
		OrderID:     &order.ID,
		CreatedAt:   time.Now(),
		UpdatedAt:   time.Now(),
	}
	
	if err := transactionRepo.Create(ctx, transaction); err != nil {
		return fmt.Errorf("failed to create transaction: %w", err)
	}
	
	return nil
}

// releaseReservedSecurities releases securities reserved for a sell order
func (s *TradingService) releaseReservedSecurities(ctx context.Context, tx *gorm.DB, order *models.Order) error {
	holdingRepo := repository.NewHoldingRepository(tx)
	
	// Get default portfolio
	portfolioRepo := repository.NewPortfolioRepository(tx)
	portfolios, err := portfolioRepo.GetByUserID(ctx, order.UserID)
	if err != nil {
		return fmt.Errorf("failed to get portfolios: %w", err)
	}
	
	if len(portfolios) == 0 {
		return fmt.Errorf("no portfolios found for user")
	}
	
	defaultPortfolio := portfolios[0]
	
	// Get holding
	holding, err := holdingRepo.GetByPortfolioIDAndSymbol(ctx, defaultPortfolio.ID, order.Symbol)
	if err != nil {
		return fmt.Errorf("failed to get holding: %w", err)
	}
	
	if holding == nil {
		return fmt.Errorf("holding not found")
	}
	
	// Return securities
	holding.Quantity += order.Quantity
	holding.LastUpdated = time.Now()
	
	// Update holding
	if err := holdingRepo.Update(ctx, holding); err != nil {
		return fmt.Errorf("failed to update holding: %w", err)
	}
	
	return nil
}
