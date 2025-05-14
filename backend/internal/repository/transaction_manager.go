// stock-trading-app/backend/internal/repository/transaction_manager.go

package repository

import (
	"context"
	"fmt"

	"gorm.io/gorm"
)

// TransactionManager handles database transactions
type TransactionManager struct {
	db *gorm.DB
}

// NewTransactionManager creates a new TransactionManager
func NewTransactionManager(db *gorm.DB) *TransactionManager {
	return &TransactionManager{db: db}
}

// WithTransaction executes a function within a database transaction
func (tm *TransactionManager) WithTransaction(ctx context.Context, fn func(tx *gorm.DB) error) error {
	tx := tm.db.WithContext(ctx).Begin()
	if tx.Error != nil {
		return fmt.Errorf("failed to begin transaction: %w", tx.Error)
	}

	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
			panic(r) // re-throw panic after rollback
		}
	}()

	if err := fn(tx); err != nil {
		tx.Rollback()
		return err
	}

	if err := tx.Commit().Error; err != nil {
		return fmt.Errorf("failed to commit transaction: %w", err)
	}

	return nil
}
